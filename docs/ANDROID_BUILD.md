# Android build

## Requirements

- Node.js 22.13 or later
- JDK 17 or later
- Android Studio with Android SDK Platform 37
- an Android emulator or USB-debuggable device for manual checks

If the local machine has only Java 8 or no Android SDK/adb, use the repository’s GitHub Actions workflow for a repeatable release build instead of treating a development client as a distributable APK.

## Phase 2 device checks

Use a standalone or development APK for these checks; Expo Go does not support the Background Task runtime used by Automatic Scan.

- Run a manual link check, a selected-file check, Wi-Fi state check, and network state check.
- Confirm a full scan marks a missing URL/file and unbundled app/Bluetooth adapters as skipped rather than clean.
- Enable Automatic Scan and confirm the app explains that WorkManager uses a minimum interval rather than an exact preferred time.
- Grant and deny notification permission independently; the app must keep scanning when notifications are denied.
- Verify that no file, network traffic, installed-app inventory, or Bluetooth discovery data appears without the corresponding native adapter.

## Release minification compatibility

Expo SDK 58's WorkManager dependency used by `expo-background-task` needs explicit Room and `InputMerger` constructor keep rules for Android minified release builds. The `expo-build-properties` config plugin appends those rules during prebuild. Do not remove this configuration while Automatic Scan is included; it prevents a native startup crash that can occur before React Native renders.

## Standalone APK

~~~powershell
npm install
npx expo install --fix
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
Copy-Item app\build\outputs\apk\release\app-release.apk ..\CyberShield.apk
Get-FileHash ..\CyberShield.apk -Algorithm SHA256
~~~

Install only on a test device:

~~~powershell
adb install -r ..\CyberShield.apk
~~~

## Signing and release

Do not invent signing credentials. Configure a release keystore through a protected CI secret manager or Expo Application Services, then create an AAB/APK using the organization’s approved signing workflow. Generate and publish a SHA-256 file beside every downloadable APK.

The repository includes a GitHub Action that produces a standalone APK artifact after a push to `main`. A pushed tag matching `v*` publishes a GitHub Release with `CyberShield.apk` and its SHA-256 checksum. It uses the project’s default signing configuration; configure protected release credentials before Play Store distribution.
