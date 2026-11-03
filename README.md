# CyberShield

CyberShield is a local-first Android security companion built around a simple promise: explain what was actually checked, what needs setup, and what is not available. Version 0.3.0 introduces the **Quiet Signal** product design: warm, calm, and clear rather than an imitation “hacker” dashboard.

## What works now

| Capability | Status | What it does |
| --- | --- | --- |
| Link assessment | Ready | Inspects URL structure locally: scheme, shorteners, punycode, IP hosts, risky TLDs, misleading URL forms, and a reserved local test blocklist. It never visits the link. |
| File assessment | Ready | Opens Android’s document picker and reports the metadata Android shares. Files are not executed or uploaded. |
| Activity history | Ready | Saves local assessment summaries with AsyncStorage. |
| Theme preference | Ready | A light-first UI with a persistent purpose-designed dark mode. |
| Monitoring workspace | Boundary shown | No network traffic, app inventory, Wi-Fi details, Bluetooth devices, or VPN session are collected in this build. |
| FastAPI contract | Ready for integration | Provides local URL rules and a bounded metadata-upload contract; the mobile MVP does not depend on it. |

## Product principles

- No fabricated security score, timers, monitoring events, or background-protection claims.
- A “clear” link result only means the documented local checks found no high-risk structural signal. It is not a guarantee.
- A file result is metadata-only until a separately configured, isolated malware engine exists.
- Permission, configuration, and native capability boundaries are visible in the Protection centre.

See [the Quiet Signal design system](docs/DESIGN_SYSTEM.md), [architecture](docs/ARCHITECTURE.md), [privacy boundaries](docs/PRIVACY.md), and [future integration guidance](docs/INTEGRATIONS.md).

## Mobile architecture

~~~text
App.tsx — app shell, transitions, history and in-memory navigation
├── src/core/ThemeProvider.tsx
├── src/components/QuietSignal.tsx
├── src/brand/SignalMark.tsx
├── src/features/
│   ├── home/
│   ├── protection/
│   ├── scanner/
│   ├── activity/
│   ├── monitoring/
│   └── profile/
├── src/domain/urlScanner.ts
└── src/services/history.ts
~~~

## Run locally

Node 22.13 or later is required.

~~~powershell
npm install
npm run start
~~~

Use an Android emulator or USB-debuggable device from the Expo terminal. The link and metadata workflows work without a backend.

## Verify

~~~powershell
npm run typecheck
npm run test
~~~

The URL scanner test suite covers deterministic local verdicts. Device and accessibility testing remain required for a public release.

## Build an Android APK

With JDK 17+, Android SDK Platform 37, and Android build tools installed:

~~~powershell
npm install
npx expo prebuild --platform android --no-install
cd android
.\gradlew.bat assembleRelease
Copy-Item app\build\outputs\apk\release\app-release.apk ..\CyberShield.apk
Get-FileHash ..\CyberShield.apk -Algorithm SHA256
~~~

The GitHub Actions workflow builds a standalone release APK on `main`. A verified `v*` tag publishes `CyberShield.apk` and a SHA-256 checksum. Android release notes are in [docs/ANDROID_BUILD.md](docs/ANDROID_BUILD.md).

## Security and privacy

- Do not ship reputation-provider tokens in the app.
- Do not execute, upload, or call a metadata-only file result an antivirus scan.
- Any future VPN monitor must be a consented native Android feature with a visible stop control.
- Any deep file scan must run in an isolated worker with limits on size, time, CPU, and memory.

## Licence

No licence is currently provided. Select one before distribution and review every future engine’s licence separately.
