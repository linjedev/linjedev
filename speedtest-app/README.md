# Linje Speed

A clean black-and-white browser speed test app intended to be wrapped as a small portable desktop executable.

## What It Does

- Ping, jitter, packet loss, download, upload, loaded latency, consistency, score, and quality label.
- Multiple server locations, including auto-select, Cloudflare, and public LibreSpeed test points.
- 15, 30, 45, or 60 second transfer timers. The chosen duration applies to both download and upload.
- Last 10 results are saved locally in `localStorage`.
- Ranking sorts those 10 results by the app score.
- CSV export and one-click history clear.
- No account, no backend, no database.

## Run Locally

```powershell
Set-Location -LiteralPath 'D:\VC\[P1]\IcelandTrip-Travelnformation\speedtest-app'
python -m http.server 4173
```

Open `http://localhost:4173`.

## Portable EXE Path

The packaged Windows executable is:

```text
dist\LinjeSpeed.exe
```

It is a single portable Windows launcher that embeds the exact web UI, starts a tiny local server, and opens the app in a compact Edge app window. The packaged app and the browser preview use the same `index.html`, `styles.css`, `app.js`, and `servers.json`.

To rebuild it on Windows with the built-in .NET Framework compiler:

```powershell
Set-Location -LiteralPath 'D:\VC\[P1]\IcelandTrip-Travelnformation'
New-Item -ItemType Directory -Force -Path 'speedtest-app\dist' | Out-Null
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /nologo /target:winexe /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /out:'speedtest-app\dist\LinjeSpeed.exe' /resource:'speedtest-app\index.html,index.html' /resource:'speedtest-app\styles.css,styles.css' /resource:'speedtest-app\app.js,app.js' /resource:'speedtest-app\servers.json,servers.json' 'speedtest-app\desktop\LinjeSpeedLauncher.cs'
```

Run the embedded asset self-test:

```powershell
& 'speedtest-app\dist\LinjeSpeed.exe' --self-test
```

Because the app itself is static, it can also be wrapped by any Windows WebView/Electron/Neutralino shell without changing the code. A practical WebView packaging route is:

```powershell
npm create neutralinojs@latest linje-speed
Copy-Item .\speedtest-app\* .\linje-speed\resources\ -Recurse -Force
Set-Location .\linje-speed
npm run build
```

That produces a portable Windows executable from a very small WebView-based shell. Electron also works, but the final app is much larger.

## Accuracy Notes

This uses two compatible browser speed-test protocols:

- `/__down?bytes=0` for latency samples
- `/__down?bytes=...` for download transfer samples
- `/__up?bytes=...` for upload transfer samples
- LibreSpeed `empty.php` for ping/upload and `garbage.php?ckSize=...` for download

The static server catalog lives in `servers.json`.

Browser-based speed tests are useful and portable, but operating system power mode, VPNs, Wi-Fi roaming, browser throttling, CORS policy changes, and background traffic can all affect results.
