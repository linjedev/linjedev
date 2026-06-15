# LinjeTune Mobile Builds

LinjeTune is packaged with Capacitor using the same React/Vite UI as the web tool.

## Android

Required local tools:

- JDK 21
- Android SDK Platform 35
- Android SDK Build Tools 35
- Android Platform Tools

On Windows PowerShell, this workspace was verified with:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

Build a sideloadable debug APK:

```powershell
corepack pnpm@9.15.4 android:apk:debug
```

Output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Build the release Android App Bundle:

```powershell
corepack pnpm@9.15.4 android:aab:release
```

Output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

For Play Store submission, configure release signing locally in Android Studio or in a non-committed signing config. Do not commit keystores, passwords, or `android/keystore.properties`.

## iOS

The iOS Capacitor project is generated in `ios/`, but Windows cannot build, sign, run the iOS Simulator, or upload an iOS app. Use macOS with Xcode and CocoaPods.

On a Mac:

```bash
corepack pnpm@9.15.4 install
corepack pnpm@9.15.4 ios:sync
corepack pnpm@9.15.4 ios:open
```

Then build, run, sign, archive, and upload from Xcode.
