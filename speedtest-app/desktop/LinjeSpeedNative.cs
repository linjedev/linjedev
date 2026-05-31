using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace LinjeSpeedNative
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            if (args.Length > 0 && args[0] == "--self-test")
            {
                if (SpeedServers.All.Count < 8) throw new InvalidOperationException("Server catalog is incomplete.");
                Console.WriteLine("self-test ok");
                return;
            }

            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SpeedForm());
        }
    }

    internal sealed class SpeedForm : Form
    {
        public SpeedForm()
        {
            Text = "Linje Speed";
            ClientSize = new Size(518, 750);
            MinimumSize = new Size(420, 640);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Theme.Void;
            Font = new Font("Segoe UI", 9F);
            Controls.Add(new SpeedSurface { Dock = DockStyle.Fill });
        }
    }

    internal sealed class SpeedSurface : Control
    {
        private readonly System.Windows.Forms.Timer timer;
        private readonly List<Result> history;
        private CancellationTokenSource cancellation;
        private Server selectedServer;
        private int selectedDuration = 15;
        private double progress;
        private bool running;
        private bool settingsOpen;
        private int hoverIndex = -1;
        private string phase = "Ready";
        private string primary = "GO";
        private string unit = "";
        private string status = "Choose a server or use auto-select.";
        private string quality = "Waiting";
        private double ping = double.NaN;
        private double download = double.NaN;
        private double upload = double.NaN;
        private double jitter = double.NaN;
        private double loaded = double.NaN;
        private double loss = double.NaN;
        private int score = -1;
        private float pulse;

        public SpeedSurface()
        {
            DoubleBuffered = true;
            Cursor = Cursors.Hand;
            BackColor = Theme.Void;
            ForeColor = Theme.Paper;
            selectedServer = SpeedServers.All[0];
            history = ResultStore.Load();

            timer = new System.Windows.Forms.Timer { Interval = 30 };
            timer.Tick += (s, e) =>
            {
                pulse += .04f;
                if (running) Invalidate();
            };
            timer.Start();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
            g.Clear(Theme.Void);

            Rectangle bounds = ClientRectangle;
            DrawHeader(g, bounds);
            Rectangle dial = DialBounds(bounds);
            DrawDial(g, dial);
            DrawBottom(g, bounds);
            if (settingsOpen) DrawSettings(g, bounds);
        }

        private void DrawHeader(Graphics g, Rectangle bounds)
        {
            using (Font logo = new Font("Segoe UI", 15F, FontStyle.Bold))
            using (Font small = new Font("Segoe UI", 8F, FontStyle.Bold))
            using (Brush muted = new SolidBrush(Theme.Muted))
            using (Pen icon = new Pen(Theme.Muted, 2))
            {
                string text = "LINJE SPEED";
                SizeF size = g.MeasureString(text, logo);
                g.DrawString(text, logo, muted, (bounds.Width - size.Width) / 2, 28);
                g.DrawString("LOCAL RANKED NETWORK TEST", small, muted, 22, 28);

                Rectangle settings = SettingsBounds(bounds);
                for (int i = 0; i < 3; i++)
                {
                    int y = settings.Top + 8 + i * 8;
                    g.DrawLine(icon, settings.Left + 2, y, settings.Right - 2, y);
                    g.FillEllipse(muted, settings.Left + 8 + i * 7, y - 3, 6, 6);
                }
            }
        }

        private void DrawDial(Graphics g, Rectangle dial)
        {
            int inset = 14;
            Rectangle outer = new Rectangle(dial.X + inset, dial.Y + inset, dial.Width - inset * 2, dial.Height - inset * 2);
            Rectangle inner = new Rectangle(dial.X + 48, dial.Y + 48, dial.Width - 96, dial.Height - 96);
            float glow = running ? (float)(Math.Sin(pulse) * 12 + 18) : 0;

            using (Pen track = new Pen(Theme.Ring, 2.5f))
            using (Pen innerPen = new Pen(Theme.Paper, 2.2f))
            using (Pen progressPen = new Pen(Theme.Paper, 5.5f))
            using (Pen glowPen = new Pen(Color.FromArgb((int)Math.Max(0, glow), Theme.Paper), 10f))
            using (Font phaseFont = new Font("Segoe UI", 12F, FontStyle.Regular))
            using (Font valueFont = new Font("Segoe UI", primary == "GO" ? 54F : 48F, FontStyle.Bold))
            using (Font unitFont = new Font("Segoe UI", 11F, FontStyle.Regular))
            using (Brush paper = new SolidBrush(Theme.Paper))
            using (Brush muted = new SolidBrush(Theme.Muted))
            {
                g.DrawEllipse(track, outer);
                if (running) g.DrawArc(glowPen, outer, -90, (float)(progress * 3.6));
                if (progress > 0) g.DrawArc(progressPen, outer, -90, (float)(progress * 3.6));
                g.DrawEllipse(innerPen, inner);

                DrawCentered(g, phase, phaseFont, muted, dial.X, dial.Y + dial.Height / 2 - 72, dial.Width, 24);
                DrawCentered(g, primary, valueFont, paper, dial.X, dial.Y + dial.Height / 2 - 42, dial.Width, 76);
                DrawCentered(g, unit, unitFont, muted, dial.X, dial.Y + dial.Height / 2 + 38, dial.Width, 24);
            }
        }

        private void DrawBottom(Graphics g, Rectangle bounds)
        {
            int left = 28;
            int bottomTop = Math.Max(500, bounds.Height - 228);
            using (Font label = new Font("Segoe UI", 8F, FontStyle.Bold))
            using (Font server = new Font("Segoe UI", 13F, FontStyle.Regular))
            using (Font metric = new Font("Segoe UI", 18F, FontStyle.Bold))
            using (Font small = new Font("Segoe UI", 9F))
            using (Brush paper = new SolidBrush(Theme.Paper))
            using (Brush muted = new SolidBrush(Theme.Muted))
            using (Brush soft = new SolidBrush(Theme.Soft))
            using (Pen line = new Pen(Theme.Line, 1))
            {
                DrawServerRow(g, left, bottomTop, server, small, paper, muted);
                DrawStatus(g, status, small, muted, left, bottomTop + 66, bounds.Width - left * 2);

                int cardTop = bottomTop + 102;
                int cardWidth = (bounds.Width - left * 2 - 18) / 4;
                DrawMetric(g, "PING", Format(ping, 0), "ms", left, cardTop, cardWidth, label, metric, small);
                DrawMetric(g, "DOWN", Format(download, 1), "Mbps", left + cardWidth + 6, cardTop, cardWidth, label, metric, small);
                DrawMetric(g, "UP", Format(upload, 1), "Mbps", left + (cardWidth + 6) * 2, cardTop, cardWidth, label, metric, small);
                DrawMetric(g, "JIT", Format(jitter, 0), "ms", left + (cardWidth + 6) * 3, cardTop, cardWidth, label, metric, small);

                int rankTop = cardTop + 76;
                g.DrawLine(line, left, rankTop - 8, bounds.Width - left, rankTop - 8);
                string rank = BestLine();
                g.DrawString("LAST 10", label, muted, left, rankTop);
                g.DrawString(rank, small, soft, left + 78, rankTop - 1);
                string summary = score >= 0 ? "Score " + score + " / " + quality + " / Loaded " + Format(loaded, 0) + " ms / Loss " + Format(loss, 0) + "%" : "No saved result yet";
                g.DrawString(summary, small, muted, left, rankTop + 26);
            }
        }

        private void DrawServerRow(Graphics g, int left, int top, Font serverFont, Font small, Brush paper, Brush muted)
        {
            using (Pen circle = new Pen(Theme.Muted, 2))
            {
                g.DrawEllipse(circle, left, top + 6, 36, 36);
                g.DrawEllipse(circle, left + 9, top + 15, 18, 18);
                g.DrawLine(circle, left + 18, top + 8, left + 18, top + 40);
                g.DrawLine(circle, left + 4, top + 24, left + 32, top + 24);
            }
            string name = selectedServer.Protocol == "auto" ? "Auto select nearest" : selectedServer.Name;
            string sub = selectedServer.Protocol == "auto" ? "Lowest latency available" : selectedServer.Provider;
            g.DrawString(name, serverFont, paper, left + 54, top + 2);
            g.DrawString(sub, small, muted, left + 54, top + 29);
        }

        private void DrawMetric(Graphics g, string title, string value, string suffix, int x, int y, int w, Font label, Font metric, Font small)
        {
            using (Brush ink = new SolidBrush(Theme.Panel))
            using (Brush paper = new SolidBrush(Theme.Paper))
            using (Brush muted = new SolidBrush(Theme.Muted))
            using (Pen line = new Pen(Theme.Line))
            {
                Rectangle rect = new Rectangle(x, y, w, 64);
                g.FillRectangle(ink, rect);
                g.DrawRectangle(line, rect);
                g.DrawString(title, label, muted, x + 8, y + 7);
                g.DrawString(value, metric, paper, x + 8, y + 24);
                g.DrawString(suffix, small, muted, x + 8, y + 48);
            }
        }

        private void DrawSettings(Graphics g, Rectangle bounds)
        {
            Rectangle panel = new Rectangle(22, 74, bounds.Width - 44, Math.Min(474, bounds.Height - 110));
            using (Brush bg = new SolidBrush(Color.FromArgb(247, 8, 8, 12)))
            using (Pen border = new Pen(Theme.Line))
            using (Font head = new Font("Segoe UI", 9F, FontStyle.Bold))
            using (Font item = new Font("Segoe UI", 10F))
            using (Brush paper = new SolidBrush(Theme.Paper))
            using (Brush muted = new SolidBrush(Theme.Muted))
            using (Brush hover = new SolidBrush(Theme.Panel))
            {
                g.FillRectangle(bg, panel);
                g.DrawRectangle(border, panel);
                g.DrawString("SERVER", head, muted, panel.Left + 16, panel.Top + 14);

                int y = panel.Top + 42;
                for (int i = 0; i < SpeedServers.All.Count && y < panel.Bottom - 36; i++)
                {
                    Rectangle row = new Rectangle(panel.Left + 10, y, panel.Width - 20, 28);
                    if (i == hoverIndex || SpeedServers.All[i] == selectedServer) g.FillRectangle(hover, row);
                    g.DrawString(SpeedServers.All[i].ToString(), item, paper, row.Left + 8, row.Top + 5);
                    y += 30;
                }

                g.DrawString("DURATION  " + selectedDuration + "s  (click here to cycle)", head, muted, panel.Left + 16, panel.Bottom - 28);
            }
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            int old = hoverIndex;
            hoverIndex = HitServerIndex(e.Location);
            if (old != hoverIndex) Invalidate();
            base.OnMouseMove(e);
        }

        protected override void OnMouseClick(MouseEventArgs e)
        {
            if (SettingsBounds(ClientRectangle).Contains(e.Location))
            {
                settingsOpen = !settingsOpen;
                Invalidate();
                return;
            }

            if (settingsOpen)
            {
                int index = HitServerIndex(e.Location);
                if (index >= 0)
                {
                    selectedServer = SpeedServers.All[index];
                    settingsOpen = false;
                    status = "Selected " + selectedServer.ToString() + ".";
                    Invalidate();
                    return;
                }

                Rectangle panel = new Rectangle(22, 74, Width - 44, Math.Min(474, Height - 110));
                if (new Rectangle(panel.Left, panel.Bottom - 38, panel.Width, 38).Contains(e.Location))
                {
                    selectedDuration = selectedDuration == 15 ? 30 : selectedDuration == 30 ? 45 : selectedDuration == 45 ? 60 : 15;
                    Invalidate();
                    return;
                }

                settingsOpen = false;
                Invalidate();
                return;
            }

            if (DialBounds(ClientRectangle).Contains(e.Location))
            {
                if (running && cancellation != null) cancellation.Cancel();
                else StartTest();
            }
            base.OnMouseClick(e);
        }

        private int HitServerIndex(Point point)
        {
            if (!settingsOpen) return -1;
            Rectangle panel = new Rectangle(22, 74, Width - 44, Math.Min(474, Height - 110));
            int y = panel.Top + 42;
            for (int i = 0; i < SpeedServers.All.Count && y < panel.Bottom - 36; i++)
            {
                if (new Rectangle(panel.Left + 10, y, panel.Width - 20, 28).Contains(point)) return i;
                y += 30;
            }
            return -1;
        }

        private async void StartTest()
        {
            if (running) return;
            cancellation = new CancellationTokenSource();
            running = true;
            progress = 0;
            Reset();
            Invalidate();

            try
            {
                Server server = await ResolveServer(selectedServer, cancellation.Token);
                SetPhase("Ping", 8, "Finding latency to " + server.Name);
                int pingCount = selectedDuration >= 45 ? 8 : 6;
                Latency latency = await SpeedEngine.MeasurePing(server, pingCount, cancellation.Token);
                ping = latency.Ping;
                jitter = latency.Jitter;
                loss = latency.Loss;

                SetPhase("Download", 22, "Measuring download from " + server.Name + " for " + selectedDuration + "s");
                Transfer down = await SpeedEngine.MeasureTransfer(server, TransferPlan.DownloadBytes, selectedDuration, true, cancellation.Token, LiveDown);
                download = down.Mbps;

                SetPhase("Upload", 66, "Measuring upload to " + server.Name + " for " + selectedDuration + "s");
                Transfer up = await SpeedEngine.MeasureTransfer(server, TransferPlan.UploadBytes, selectedDuration, false, cancellation.Token, LiveUp);
                upload = up.Mbps;

                SetPhase("Loaded", 94, "Checking latency under load");
                loaded = await SpeedEngine.MeasureLoadedLatency(server, cancellation.Token);

                Result result = Result.From(server, latency, down, up, loaded);
                ShowResult(result);
                history.Insert(0, result);
                while (history.Count > 10) history.RemoveAt(history.Count - 1);
                ResultStore.Save(history);
                SetPhase("Done", 100, "Finished on " + server.Name + ".");
            }
            catch (OperationCanceledException)
            {
                SetPhase("Stopped", 0, "Test stopped.");
                primary = "GO";
                unit = "";
            }
            catch (Exception ex)
            {
                SetPhase("Offline", 0, ex.Message);
                primary = "GO";
                unit = "";
            }
            finally
            {
                running = false;
                cancellation = null;
                Invalidate();
            }
        }

        private async Task<Server> ResolveServer(Server selected, CancellationToken token)
        {
            if (selected.Protocol != "auto") return selected;
            SetPhase("Server", 3, "Auto-selecting the closest responsive test point");
            Server best = null;
            double bestPing = double.MaxValue;
            foreach (Server server in SpeedServers.All.Where(s => s.Protocol != "auto"))
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    double p = await SpeedEngine.Probe(server, token);
                    if (p < bestPing)
                    {
                        best = server;
                        bestPing = p;
                    }
                }
                catch { }
            }
            if (best == null) throw new InvalidOperationException("No configured server responded.");
            selectedServer = best;
            status = "Selected " + best.Name + " at " + Format(bestPing, 0) + " ms.";
            return best;
        }

        private void LiveDown(double mbps)
        {
            BeginInvoke((Action)(() =>
            {
                download = mbps;
                primary = Format(mbps, 1);
                unit = "Mbps down";
                progress = Math.Min(64, progress + 10);
                Invalidate();
            }));
        }

        private void LiveUp(double mbps)
        {
            BeginInvoke((Action)(() =>
            {
                upload = mbps;
                primary = Format(mbps, 1);
                unit = "Mbps up";
                progress = Math.Min(92, progress + 8);
                Invalidate();
            }));
        }

        private void Reset()
        {
            phase = "Ready";
            primary = "--";
            unit = "Mbps";
            quality = "Testing";
            score = -1;
            ping = download = upload = jitter = loaded = loss = double.NaN;
        }

        private void ShowResult(Result result)
        {
            ping = result.Ping;
            download = result.Download;
            upload = result.Upload;
            jitter = result.Jitter;
            loaded = result.LoadedLatency;
            loss = result.Loss;
            score = result.Score;
            quality = result.Quality;
            primary = Format(result.Download, 1);
            unit = "Mbps down";
        }

        private void SetPhase(string nextPhase, double nextProgress, string text)
        {
            phase = nextPhase;
            progress = nextProgress;
            status = text;
            Invalidate();
        }

        private string BestLine()
        {
            if (history.Count == 0) return "Run a test to start the ranking.";
            Result best = history.OrderByDescending(r => r.Score).First();
            return "#" + 1 + "  " + best.Score + " / " + best.Quality + " / " + best.ServerName + " / D " + Format(best.Download, 1);
        }

        private static void DrawCentered(Graphics g, string text, Font font, Brush brush, int x, int y, int w, int h)
        {
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            {
                g.DrawString(text, font, brush, new RectangleF(x, y, w, h), sf);
            }
        }

        private static void DrawStatus(Graphics g, string text, Font font, Brush brush, int x, int y, int width)
        {
            using (StringFormat sf = new StringFormat { Trimming = StringTrimming.EllipsisWord })
            {
                g.DrawString(text, font, brush, new RectangleF(x, y, width, 32), sf);
            }
        }

        private static Rectangle DialBounds(Rectangle bounds)
        {
            int size = Math.Min(340, Math.Max(260, bounds.Width - 150));
            return new Rectangle((bounds.Width - size) / 2, 112, size, size);
        }

        private static Rectangle SettingsBounds(Rectangle bounds)
        {
            return new Rectangle(bounds.Width - 58, 24, 34, 34);
        }

        private static string Format(double value, int places)
        {
            return double.IsNaN(value) || double.IsInfinity(value) ? "--" : value.ToString("N" + places);
        }
    }

    internal static class SpeedEngine
    {
        public static async Task<double> Probe(Server server, CancellationToken token)
        {
            Stopwatch watch = Stopwatch.StartNew();
            await Request(server.PingUrl("probe"), null, token);
            watch.Stop();
            return watch.Elapsed.TotalMilliseconds;
        }

        public static async Task<Latency> MeasurePing(Server server, int count, CancellationToken token)
        {
            List<double> samples = new List<double>();
            int failed = 0;
            for (int i = 0; i < count; i++)
            {
                token.ThrowIfCancellationRequested();
                Stopwatch watch = Stopwatch.StartNew();
                try
                {
                    await Request(server.PingUrl(i.ToString()), null, token);
                    watch.Stop();
                    samples.Add(watch.Elapsed.TotalMilliseconds);
                }
                catch
                {
                    failed++;
                }
            }
            if (samples.Count == 0) throw new InvalidOperationException("No ping samples completed.");
            return new Latency { Ping = Percentile(samples, .5), Jitter = AverageDelta(samples), Loss = failed * 100.0 / count };
        }

        public static async Task<Transfer> MeasureTransfer(Server server, int[] bytesList, int durationSeconds, bool download, CancellationToken token, Action<double> live)
        {
            List<double> samples = new List<double>();
            Stopwatch total = Stopwatch.StartNew();
            int index = 0;
            while (total.Elapsed.TotalSeconds < durationSeconds || samples.Count == 0)
            {
                token.ThrowIfCancellationRequested();
                int bytes = bytesList[index % bytesList.Length];
                byte[] upload = download ? null : Payload(bytes);
                Stopwatch watch = Stopwatch.StartNew();
                byte[] body = await Request(download ? server.DownloadUrl(bytes) : server.UploadUrl(bytes), upload, token);
                watch.Stop();
                int measured = download && body.Length > 0 ? body.Length : bytes;
                double mbps = measured * 8.0 / Math.Max(watch.Elapsed.TotalSeconds, .001) / 1000000.0;
                samples.Add(mbps);
                live(mbps);
                index++;
            }
            List<double> trimmed = samples.Count > 2 ? samples.Skip(1).ToList() : samples;
            return new Transfer { Mbps = Percentile(trimmed, .75), Peak = samples.Max(), Consistency = Math.Min(100, Percentile(trimmed, .25) / Math.Max(Percentile(trimmed, .75), 1) * 100) };
        }

        public static async Task<double> MeasureLoadedLatency(Server server, CancellationToken token)
        {
            Task<byte[]> load = Request(server.DownloadUrl(1000000), null, token);
            List<double> samples = new List<double>();
            for (int i = 0; i < 3; i++)
            {
                Stopwatch watch = Stopwatch.StartNew();
                await Request(server.PingUrl("loaded" + i), null, token);
                watch.Stop();
                samples.Add(watch.Elapsed.TotalMilliseconds);
            }
            await load;
            return Percentile(samples, .5);
        }

        private static async Task<byte[]> Request(string url, byte[] body, CancellationToken token)
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = body == null ? "GET" : "POST";
            request.Timeout = 15000;
            request.ReadWriteTimeout = 15000;
            if (body != null)
            {
                request.ContentType = "application/octet-stream";
                request.ContentLength = body.Length;
                using (Stream stream = await request.GetRequestStreamAsync())
                {
                    token.ThrowIfCancellationRequested();
                    await stream.WriteAsync(body, 0, body.Length, token);
                }
            }
            using (WebResponse response = await request.GetResponseAsync())
            using (Stream stream = response.GetResponseStream())
            using (MemoryStream memory = new MemoryStream())
            {
                token.ThrowIfCancellationRequested();
                await stream.CopyToAsync(memory);
                return memory.ToArray();
            }
        }

        private static byte[] Payload(int bytes)
        {
            byte[] payload = new byte[bytes];
            new Random().NextBytes(payload);
            return payload;
        }

        private static double Percentile(List<double> values, double p)
        {
            values = values.OrderBy(v => v).ToList();
            int index = Math.Max(0, Math.Min(values.Count - 1, (int)Math.Round((values.Count - 1) * p)));
            return values[index];
        }

        private static double AverageDelta(List<double> values)
        {
            if (values.Count < 2) return 0;
            double sum = 0;
            for (int i = 1; i < values.Count; i++) sum += Math.Abs(values[i] - values[i - 1]);
            return sum / (values.Count - 1);
        }
    }

    internal sealed class Server
    {
        public string Name;
        public string Provider;
        public string Protocol;
        public string BaseUrl;
        public string Dl;
        public string Ul;
        public string Ping;

        public override string ToString()
        {
            return Protocol == "auto" ? Name : Name + " - " + Provider;
        }

        public string PingUrl(string token)
        {
            if (Protocol == "cloudflare") return Clean(BaseUrl) + "/__down?bytes=0&r=" + Stamp(token);
            return Join(BaseUrl, Ping) + "?r=" + Stamp(token);
        }

        public string DownloadUrl(int bytes)
        {
            if (Protocol == "cloudflare") return Clean(BaseUrl) + "/__down?bytes=" + bytes + "&r=" + Stamp("d");
            int mb = Math.Max(1, (int)Math.Ceiling(bytes / 1000000.0));
            return Join(BaseUrl, Dl) + "?ckSize=" + mb + "&r=" + Stamp("d");
        }

        public string UploadUrl(int bytes)
        {
            if (Protocol == "cloudflare") return Clean(BaseUrl) + "/__up?bytes=" + bytes + "&r=" + Stamp("u");
            return Join(BaseUrl, Ul) + "?r=" + Stamp("u");
        }

        private static string Join(string baseUrl, string path) { return Clean(baseUrl) + "/" + path.TrimStart('/'); }
        private static string Clean(string url) { return url.TrimEnd('/'); }
        private static string Stamp(string token) { return DateTime.UtcNow.Ticks + "-" + token; }
    }

    internal static class SpeedServers
    {
        public static readonly List<Server> All = new List<Server>
        {
            new Server { Name = "Auto select nearest", Provider = "Mixed", Protocol = "auto" },
            new Server { Name = "Cloudflare Global", Provider = "Cloudflare", Protocol = "cloudflare", BaseUrl = "https://speed.cloudflare.com" },
            Libre("London, England", "Clouvider", "https://lon.speedtest.clouvider.net/backend", "garbage.php", "empty.php", "empty.php"),
            Libre("Amsterdam, Netherlands", "Clouvider", "https://ams.speedtest.clouvider.net/backend", "garbage.php", "empty.php", "empty.php"),
            Libre("Frankfurt, Germany", "Clouvider", "https://fra.speedtest.clouvider.net/backend", "garbage.php", "empty.php", "empty.php"),
            Libre("New York, United States", "Clouvider", "https://nyc.speedtest.clouvider.net/backend", "garbage.php", "empty.php", "empty.php"),
            Libre("Atlanta, United States", "Clouvider", "https://atl.speedtest.clouvider.net/backend", "garbage.php", "empty.php", "empty.php"),
            Libre("Los Angeles, United States", "Clouvider", "https://la.speedtest.clouvider.net/backend", "garbage.php", "empty.php", "empty.php"),
            Libre("Chicago, United States", "Sharktech", "https://chispeed.sharktech.net", "backend/garbage.php", "backend/empty.php", "backend/empty.php"),
            Libre("Singapore", "DS Group Media", "https://speedtest.dsgroupmedia.com", "backend/garbage.php", "backend/empty.php", "backend/empty.php"),
            Libre("Tokyo, Japan", "A573", "https://librespeed.a573.net/", "backend/garbage.php", "backend/empty.php", "backend/empty.php"),
            Libre("Bangalore, India", "DigitalOcean", "https://in1.backend.librespeed.org/", "garbage.php", "empty.php", "empty.php"),
            Libre("Johannesburg, South Africa", "HOSTAFRICA", "https://za1.backend.librespeed.org/", "garbage.php", "empty.php", "empty.php")
        };

        private static Server Libre(string name, string provider, string url, string dl, string ul, string ping)
        {
            return new Server { Name = name, Provider = provider, Protocol = "librespeed", BaseUrl = url, Dl = dl, Ul = ul, Ping = ping };
        }
    }

    internal static class TransferPlan
    {
        public static readonly int[] DownloadBytes = new[] { 5000000, 10000000, 15000000, 25000000 };
        public static readonly int[] UploadBytes = new[] { 1000000, 2500000, 5000000, 8000000 };
    }

    internal sealed class Latency { public double Ping; public double Jitter; public double Loss; }
    internal sealed class Transfer { public double Mbps; public double Peak; public double Consistency; }

    internal sealed class Result
    {
        public DateTime CreatedAt;
        public string ServerName;
        public double Ping;
        public double Jitter;
        public double Loss;
        public double Download;
        public double Upload;
        public double LoadedLatency;
        public int Score;
        public string Quality;

        public static Result From(Server server, Latency latency, Transfer down, Transfer up, double loaded)
        {
            int score = CalculateScore(down.Mbps, up.Mbps, latency.Ping, latency.Jitter, loaded, latency.Loss);
            return new Result { CreatedAt = DateTime.Now, ServerName = server.Name, Ping = latency.Ping, Jitter = latency.Jitter, Loss = latency.Loss, Download = down.Mbps, Upload = up.Mbps, LoadedLatency = loaded, Score = score, Quality = QualityLabel(score) };
        }

        private static int CalculateScore(double down, double up, double ping, double jitter, double loaded, double loss)
        {
            double score = Math.Min(down / 500, 1) * 42 + Math.Min(up / 100, 1) * 26 + Math.Max(0, 1 - ping / 120) * 16 + Math.Max(0, 1 - loaded / 260) * 8 + Math.Max(0, 1 - jitter / 35) * 5 + Math.Max(0, 1 - loss / 8) * 3;
            return (int)Math.Round(score);
        }

        private static string QualityLabel(int score)
        {
            if (score >= 88) return "Excellent";
            if (score >= 72) return "Strong";
            if (score >= 55) return "Steady";
            if (score >= 38) return "Limited";
            return "Poor";
        }
    }

    internal static class ResultStore
    {
        private static string PathName { get { return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "LinjeSpeed.history.tsv"); } }
        public static List<Result> Load()
        {
            try
            {
                if (!File.Exists(PathName)) return new List<Result>();
                return File.ReadAllLines(PathName).Select(Parse).Where(r => r != null).Take(10).ToList();
            }
            catch { return new List<Result>(); }
        }

        public static void Save(List<Result> results)
        {
            try { File.WriteAllLines(PathName, results.Take(10).Select(Format).ToArray()); }
            catch { }
        }

        private static string Format(Result r)
        {
            return string.Join("\t", new[] { r.CreatedAt.Ticks.ToString(), r.ServerName, r.Ping.ToString(), r.Jitter.ToString(), r.Loss.ToString(), r.Download.ToString(), r.Upload.ToString(), r.LoadedLatency.ToString(), r.Score.ToString(), r.Quality });
        }

        private static Result Parse(string line)
        {
            string[] p = line.Split('\t');
            if (p.Length < 10) return null;
            return new Result { CreatedAt = new DateTime(long.Parse(p[0])), ServerName = p[1], Ping = double.Parse(p[2]), Jitter = double.Parse(p[3]), Loss = double.Parse(p[4]), Download = double.Parse(p[5]), Upload = double.Parse(p[6]), LoadedLatency = double.Parse(p[7]), Score = int.Parse(p[8]), Quality = p[9] };
        }
    }

    internal static class Theme
    {
        public static readonly Color Void = Color.FromArgb(6, 6, 14);
        public static readonly Color Panel = Color.FromArgb(14, 14, 22);
        public static readonly Color Paper = Color.FromArgb(247, 247, 242);
        public static readonly Color Soft = Color.FromArgb(214, 214, 208);
        public static readonly Color Muted = Color.FromArgb(132, 132, 146);
        public static readonly Color Line = Color.FromArgb(48, 48, 54);
        public static readonly Color Ring = Color.FromArgb(52, 52, 48);
    }
}
