# Android build

## Requirements

- Node.js 22.13 or later
- JDK 17 or later
- Android Studio with Android SDK Platform 37
- an Android emulator or USB-debuggable device for manual checks

The workspace used for this MVP had Java 8 and no Android SDK or adb; it cannot produce a valid Android APK locally.

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

The repository includes a GitHub Action that produces a standalone APK artifact after a push to main. A pushed tag matching v* publishes a GitHub Release titled CyberShield Android MVP with CyberShield.apk and its SHA-256 checksum. It uses the project’s default signing configuration; configure protected release credentials before Play Store distribution.
