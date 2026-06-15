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

For Play Store submission, the release build reads local signing details from:

```text
android/keystore.properties
android/linjetune-upload-key.jks
```

Both files are intentionally ignored by git. Back them up somewhere private. Losing this upload key can block future Play Store updates unless Google Play App Signing key reset is available for the app.

Use `android/keystore.properties.example` as the template if the local signing files need to be recreated on another machine.

## iOS

The iOS Capacitor project is generated in `ios/` with bundle id `dev.linje.linjetune`, app name `LinjeTune`, matching black/white app icon and launch assets, and App Store export options at `ios/App/ExportOptions.plist`.

Windows can sync the iOS project, but it cannot build, sign, run the iOS Simulator, archive, export an `.ipa`, or upload an iOS app. Use macOS with Xcode and CocoaPods for the final package.

On a Mac:

```bash
corepack pnpm@9.15.4 install
corepack pnpm@9.15.4 ios:sync
```

Smoke-test in the iOS Simulator:

```bash
corepack pnpm@9.15.4 ios:build:sim
corepack pnpm@9.15.4 ios:open
```

In Xcode, select the `App` target, choose your Apple Developer team for automatic signing, then run on a simulator or device.

Build the App Store archive:

```bash
corepack pnpm@9.15.4 ios:archive
```

Export the `.ipa`:

```bash
corepack pnpm@9.15.4 ios:ipa
```

Output:

```text
ios/App/output/LinjeTune.ipa
```

Upload the exported `.ipa` with Xcode Organizer, Transporter, or App Store Connect tooling.

### GitHub IPA Build

The `LinjeTune iOS Release` workflow can build a signed `.ipa` on GitHub's macOS runners after Apple Developer signing assets are added as repository secrets.

Required secrets:

```text
IOS_DISTRIBUTION_CERTIFICATE_BASE64
IOS_DISTRIBUTION_CERTIFICATE_PASSWORD
IOS_PROVISIONING_PROFILE_BASE64
IOS_KEYCHAIN_PASSWORD
APPLE_TEAM_ID
```

Create the certificate secret from a `.p12` distribution certificate:

```bash
base64 -i linjetune_distribution.p12 | pbcopy
```

Create the provisioning profile secret from an App Store provisioning profile for bundle id `dev.linje.linjetune`:

```bash
base64 -i LinjeTune_App_Store.mobileprovision | pbcopy
```

After the secrets are set, run the `LinjeTune iOS Release` workflow manually from GitHub Actions. It archives the app, exports the `.ipa`, and uploads a `LinjeTune-ios-ipa` workflow artifact.
