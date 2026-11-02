# CyberShield

**Know your digital environment. Stay ahead of threats.**

CyberShield is a local-first Android security MVP with a premium technical interface. It is deliberately honest about its boundaries: the included URL engine is functional offline, while capabilities that require Android native modules, operating-system permission, an isolated backend, or external intelligence are labelled as such.

## What is implemented

| Capability | Status | Notes |
| --- | --- | --- |
| Premium React Native/Expo interface | Implemented | Dashboard, Scan Centre, protection matrix, alerts, activity, settings, onboarding and learning views |
| Local URL assessment | Implemented | URL normalization, HTTP, link shortener, punycode, IP-host, misleading-address, high-abuse-TLD and local test-blocklist checks |
| Scan history | Implemented | Persisted locally with AsyncStorage |
| File selection / metadata assessment | Implemented | Uses the device picker; never executes content; no antivirus verdict without an engine |
| FastAPI contract | Implemented | Health, URL assessment and size-bounded metadata-upload endpoints |
| Radial monitor interface | Demonstration-only | Animated sample telemetry; no VPN or traffic interception |
| App, Wi-Fi and Bluetooth visibility | UI / limitation explanation | Requires native Android permission and capability modules |
| ClamAV, YARA, MobSF and remote URL intelligence | Planned integration | Must be deployed and configured independently |

## Design

The product is original and uses a restrained black, mint, and instrumentation-inspired visual language:

- Technical typography, fine dividers, tabular metrics and intentional negative space
- A high-contrast assessment dashboard with a visible coverage boundary
- Purpose-built waveform and radial monitor components
- A prominent central Scan action and non-generic module matrix
- Clear CLEAR, REVIEW, BLOCK, and UNKNOWN states

## Architecture

~~~text
Expo mobile client
├── App.tsx                         screen state and workflows
├── src/domain/urlScanner.ts         local explainable URL assessment
├── src/services/history.ts          local scan history
├── src/components/Visuals.tsx       waveform, radar, severity components
└── src/design/tokens.ts             design-system primitives

Optional isolated backend
└── backend/app/main.py
    ├── GET  /api/v1/health
    ├── POST /api/v1/scans/url
    └── POST /api/v1/scans/files
~~~

Read [Architecture](docs/ARCHITECTURE.md), [integrations](docs/INTEGRATIONS.md), and [privacy limitations](docs/PRIVACY.md) before adding production security engines.

## Run the mobile app

Prerequisite: Node 22.13+.

~~~powershell
npm install
npx expo install --fix
npm run start
~~~

Press a from the Expo terminal to launch an Android emulator/device, or scan the displayed QR code with Expo Go on Android. The app has an offline URL-scanning workflow even if the backend is not running.

## Run the API

The environment used to create this repository did not contain a working Python installation. On a machine with Python 3.13+:

~~~powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
~~~

Or use a Docker daemon:

~~~powershell
docker compose up --build
~~~

The interactive OpenAPI page is available at http://localhost:8000/docs.

## Test

~~~powershell
npm run test
npm run typecheck
~~~

The test suite verifies deterministic URL heuristic verdicts. More test coverage is required before a production release.

## Build an Android APK

Install Android Studio, Android SDK Platform 37, and JDK 17 or newer, then:

~~~powershell
npm install
npx expo install --fix
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleDebug
Copy-Item app\build\outputs\apk\debug\app-debug.apk ..\CyberShield.apk
Get-FileHash ..\CyberShield.apk -Algorithm SHA256
~~~

The supplied GitHub Actions workflow performs equivalent debug-APK packaging on main. See [Android build notes](docs/ANDROID_BUILD.md).

## Security and privacy

- Do not put external threat-intelligence keys in the app.
- A safe local URL verdict means only that this small, documented set of local checks did not find a high-risk signal.
- File content is never executed by the mobile app or MVP API.
- Deep file scans must run in an isolated worker with strict size, time, CPU, and memory limits.
- VPN monitoring must be a separate, clearly consented native Android feature.

See [Security](docs/SECURITY.md) and [Privacy](docs/PRIVACY.md).

## Release state

No Android SDK, SDK platform, emulator, working Python installation, repository remote, GitHub authentication, APK, release, or signing credentials were available in the supplied workspace. Therefore no APK, push, or GitHub Release is claimed. The source and CI workflow are ready for a properly provisioned build environment.

## Licence

No licence was provided with the newly initialized repository. Choose and add one before publishing. Security engine licenses must be reviewed separately before integration.
