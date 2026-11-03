# CyberShield — Sentinel

CyberShield is an Android cybersecurity companion with a complete product map: Phishing Protection, File Security, Application Security, Wi-Fi Security, Network Monitor, Bluetooth Security, Threat Alerts, Activity, Analytics, and privacy controls.

Version 0.4.0 restores the full surface as a dark-first **Sentinel** experience. It is direct about which functions are real today and which need Android-native or backend integration.

## What works today

| Module | Current capability |
| --- | --- |
| Phishing Protection | Local URL normalization and structural analysis: HTTP, shorteners, punycode, IP hosts, suspicious URL patterns, risky TLDs, plus a local test blocklist. |
| File Security | Android system file picker and metadata inspection. Files are never executed or uploaded. |
| Threat Alerts | Derived from suspicious or malicious saved local assessments, with read/dismiss state. |
| Scan history | Local AsyncStorage persistence, filters, and clear control. |
| Security Analytics | Real local assessment trends and outcome distribution. |
| Demo Mode | Clearly labelled, in-memory sample workspaces for unconnected App, Wi-Fi, Network, and Bluetooth modules. |

## What is not connected

Installed-app auditing, Wi-Fi diagnostics, Bluetooth discovery, VPN-based network monitoring, antivirus/YARA scanning, and external URL-reputation providers need additional native Android or backend implementation. Their dedicated screens state this explicitly; CyberShield does not present sample data as device data.

See [Product Features](docs/PRODUCT_FEATURES.md), [Architecture](docs/ARCHITECTURE.md), [Art Direction](docs/ART_DIRECTION.md), [Design System](docs/DESIGN_SYSTEM.md), [Animation System](docs/ANIMATION_SYSTEM.md), [Security](docs/SECURITY.md), and [Privacy](docs/PRIVACY.md).

## Run

Node 22.13+ is required.

~~~powershell
npm install
npm run start
~~~

Run on an Android emulator or USB-debuggable device from Expo. The URL and file metadata workflows do not need a backend.

## Verify

~~~powershell
npm run typecheck
npm run test
~~~

## Build a standalone Android APK

With JDK 17+ and Android SDK Platform 37:

~~~powershell
npm install
npx expo prebuild --platform android --no-install
cd android
.\gradlew.bat assembleRelease
Copy-Item app\build\outputs\apk\release\app-release.apk ..\CyberShield.apk
Get-FileHash ..\CyberShield.apk -Algorithm SHA256
~~~

GitHub Actions performs the same standalone release build. A version tag matching v-star publishes:

<https://github.com/expediential/cybershield/releases/latest/download/CyberShield.apk>

## Security boundaries

- A local clear verdict is not a guarantee that a website or file is safe.
- No external URL intelligence key is embedded in the mobile app.
- File metadata inspection is not malware scanning.
- Demo Mode data is not stored in local history or analytics.
- A future VPN monitor must use explicit Android consent and a visible stop control.
