using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace LinjeSpeed
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            if (args.Length > 0 && args[0] == "--self-test")
            {
                RunSelfTest();
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            SpeedServer server = new SpeedServer();
            server.Start();

            BrowserLauncher.Open(server.Url);

            Application.Run(new TrayApplication(server));
        }

        private static void RunSelfTest()
        {
            SpeedServer server = new SpeedServer();
            server.Start();
            try
            {
                using (WebClient client = new WebClient())
                {
                    Require(client.DownloadString(server.Url), "Linje Speed");
                    Require(client.DownloadString(server.Url + "styles.css"), ".shell");
                    Require(client.DownloadString(server.Url + "app.js"), "runTest");
                    Require(client.DownloadString(server.Url + "servers.json"), "librespeed");
                }
            }
            finally
            {
                server.Stop();
            }
        }

        private static void Require(string text, string expected)
        {
            if (text.IndexOf(expected, StringComparison.Ordinal) < 0)
            {
                throw new InvalidOperationException("Self-test failed. Missing: " + expected);
            }
        }
    }

    internal sealed class TrayApplication : ApplicationContext
    {
        private readonly SpeedServer server;
        private readonly NotifyIcon notifyIcon;

        public TrayApplication(SpeedServer server)
        {
            this.server = server;

            MenuItem openItem = new MenuItem("Open Linje Speed", Open);
            MenuItem exitItem = new MenuItem("Exit", Exit);

            notifyIcon = new NotifyIcon
            {
                Icon = SystemIcons.Application,
                Text = "Linje Speed",
                Visible = true,
                ContextMenu = new ContextMenu(new[] { openItem, exitItem })
            };
            notifyIcon.DoubleClick += Open;
        }

        private void Open(object sender, EventArgs e)
        {
            BrowserLauncher.Open(server.Url);
        }

        private void Exit(object sender, EventArgs e)
        {
            notifyIcon.Visible = false;
            notifyIcon.Dispose();
            server.Stop();
            ExitThread();
        }
    }

    internal static class BrowserLauncher
    {
        public static void Open(string url)
        {
            string edge = FindEdge();
            if (!string.IsNullOrEmpty(edge))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = edge,
                    Arguments = "--app=\"" + url + "\" --window-size=520,790 --new-window",
                    UseShellExecute = false
                });
                return;
            }

            Process.Start(new ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
        }

        private static string FindEdge()
        {
            string[] roots =
            {
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)
            };

            string[] relativePaths =
            {
                @"Microsoft\Edge\Application\msedge.exe",
                @"Microsoft\EdgeCore",
                @"Microsoft\EdgeWebView\Application"
            };

            foreach (string root in roots)
            {
                if (string.IsNullOrEmpty(root)) continue;

                string normalEdge = Path.Combine(root, relativePaths[0]);
                if (File.Exists(normalEdge)) return normalEdge;

                for (int i = 1; i < relativePaths.Length; i++)
                {
                    string folder = Path.Combine(root, relativePaths[i]);
                    if (!Directory.Exists(folder)) continue;

                    string[] matches = Directory.GetFiles(folder, "msedge.exe", SearchOption.AllDirectories);
                    if (matches.Length > 0)
                    {
                        Array.Sort(matches);
                        return matches[matches.Length - 1];
                    }
                }
            }

            return null;
        }
    }

    internal sealed class SpeedServer
    {
        private readonly Dictionary<string, EmbeddedFile> files;
        private TcpListener listener;
        private Thread thread;
        private volatile bool running;

        public SpeedServer()
        {
            files = new Dictionary<string, EmbeddedFile>(StringComparer.OrdinalIgnoreCase)
            {
                { "/", Load("index.html", "text/html; charset=utf-8") },
                { "/index.html", Load("index.html", "text/html; charset=utf-8") },
                { "/styles.css", Load("styles.css", "text/css; charset=utf-8") },
                { "/app.js", Load("app.js", "application/javascript; charset=utf-8") },
                { "/servers.json", Load("servers.json", "application/json; charset=utf-8") }
            };
        }

        public string Url { get; private set; }

        public void Start()
        {
            int port = FindPort(4173);
            listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();
            Url = "http://localhost:" + port + "/";

            running = true;
            thread = new Thread(ListenLoop);
            thread.IsBackground = true;
            thread.Start();
        }

        public void Stop()
        {
            running = false;
            if (listener != null)
            {
                listener.Stop();
            }
        }

        private void ListenLoop()
        {
            while (running)
            {
                try
                {
                    TcpClient client = listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(HandleClient, client);
                }
                catch
                {
                    if (running)
                    {
                        Thread.Sleep(100);
                    }
                }
            }
        }

        private void HandleClient(object state)
        {
            using (TcpClient client = (TcpClient)state)
            using (NetworkStream stream = client.GetStream())
            {
                string requestLine = ReadRequestLine(stream);
                if (string.IsNullOrEmpty(requestLine))
                {
                    return;
                }

                string[] parts = requestLine.Split(' ');
                string path = parts.Length > 1 ? parts[1] : "/";
                int queryIndex = path.IndexOf('?');
                if (queryIndex >= 0)
                {
                    path = path.Substring(0, queryIndex);
                }

                DrainHeaders(stream);

                EmbeddedFile file;
                if (!files.TryGetValue(path, out file))
                {
                    WriteResponse(stream, 404, "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Not found"));
                    return;
                }

                WriteResponse(stream, 200, file.ContentType, file.Bytes);
            }
        }

        private static string ReadRequestLine(NetworkStream stream)
        {
            List<byte> bytes = new List<byte>();
            int previous = -1;
            while (true)
            {
                int current = stream.ReadByte();
                if (current < 0)
                {
                    break;
                }
                if (previous == '\r' && current == '\n')
                {
                    bytes.RemoveAt(bytes.Count - 1);
                    break;
                }
                bytes.Add((byte)current);
                previous = current;
            }
            return Encoding.ASCII.GetString(bytes.ToArray());
        }

        private static void DrainHeaders(NetworkStream stream)
        {
            int matched = 0;
            byte[] end = new byte[] { 13, 10, 13, 10 };
            while (matched < end.Length)
            {
                int current = stream.ReadByte();
                if (current < 0)
                {
                    return;
                }
                matched = current == end[matched] ? matched + 1 : 0;
            }
        }

        private static void WriteResponse(NetworkStream stream, int status, string contentType, byte[] body)
        {
            string statusText = status == 200 ? "OK" : "Not Found";
            string headers =
                "HTTP/1.1 " + status + " " + statusText + "\r\n" +
                "Content-Type: " + contentType + "\r\n" +
                "Content-Length: " + body.Length + "\r\n" +
                "Cache-Control: no-store\r\n" +
                "Connection: close\r\n\r\n";

            byte[] headerBytes = Encoding.ASCII.GetBytes(headers);
            stream.Write(headerBytes, 0, headerBytes.Length);
            stream.Write(body, 0, body.Length);
        }

        private static EmbeddedFile Load(string resourceName, string contentType)
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            using (Stream stream = assembly.GetManifestResourceStream(resourceName))
            {
                if (stream == null)
                {
                    throw new InvalidOperationException("Missing embedded resource: " + resourceName);
                }
                using (MemoryStream memory = new MemoryStream())
                {
                    stream.CopyTo(memory);
                    return new EmbeddedFile(memory.ToArray(), contentType);
                }
            }
        }

        private static int FindPort(int preferred)
        {
            for (int port = preferred; port < preferred + 100; port++)
            {
                TcpListener probe = null;
                try
                {
                    probe = new TcpListener(IPAddress.Loopback, port);
                    probe.Start();
                    return port;
                }
                catch
                {
                }
                finally
                {
                    if (probe != null)
                    {
                        probe.Stop();
                    }
                }
            }

            TcpListener any = new TcpListener(IPAddress.Loopback, 0);
            any.Start();
            int assigned = ((IPEndPoint)any.LocalEndpoint).Port;
            any.Stop();
            return assigned;
        }
    }

    internal sealed class EmbeddedFile
    {
        public EmbeddedFile(byte[] bytes, string contentType)
        {
            Bytes = bytes;
            ContentType = contentType;
        }

        public byte[] Bytes { get; private set; }
        public string ContentType { get; private set; }
    }
}
