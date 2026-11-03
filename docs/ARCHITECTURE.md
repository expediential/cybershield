# Architecture

## Principles

1. **Local-first by default.** Link checks and activity history work without a server.
2. **Capability honesty.** The app distinguishes ready, permission-required, configuration-required, and limited areas.
3. **No security theatre.** A visual state never substitutes for an engine, system permission, or verified signal.
4. **Small feature boundaries.** The app shell composes focused screens and shared components; feature logic does not live in one giant screen file.

## Mobile

`App.tsx` owns the small offline navigation state, Android back handling, screen-settle animation, and persisted history. Feature modules own their own visual workflow.

~~~text
App shell
├── ThemeProvider                 persisted light/dark preference
├── QuietSignal components        shared brand, status, trace, coverage, navigation
├── Feature screens               home, protection, scan, activity, monitoring, profile
├── urlScanner                    pure deterministic URL assessment
└── history service               AsyncStorage persistence
~~~

The URL scanner normalizes an input, permits only HTTP/S, and emits explainable structural findings. It can report an invalid input, an unknown address, a local suspicious signal, a reserved local blocklist match, or no high-risk signal from the checks available. It does not request a page, follow a redirect, or use a reputation API.

The file flow uses `expo-document-picker`. It reads only metadata offered by the Android picker. It does not execute or upload a selected file and does not imply a malware verdict.

The monitoring workspace intentionally shows no sample telemetry. A usable monitor would need native Android code, user consent, a visible stop control, and a privacy review.

## Backend

The optional FastAPI service exposes versioned endpoints under `/api/v1`:

| Endpoint | Purpose | Boundary |
| --- | --- | --- |
| `GET /health` | readiness | no sensitive input |
| `POST /scans/url` | repeatable local URL rules | no external calls |
| `POST /scans/files` | bounded metadata upload contract | 10 MB ceiling; no execution |

Production scanning needs a queue and isolated worker rather than scans in the API process:

~~~text
client → authenticated API → scan-job queue → isolated ClamAV/YARA worker → signed result store
~~~

## Extension points

| Module | Mobile adapter | Backend adapter | Current state |
| --- | --- | --- | --- |
| URL security | local structural parser | opt-in reputation provider | local parser ready |
| Files | DocumentPicker | isolated scan worker | metadata only |
| Installed apps | Kotlin PackageManager bridge | chosen APK analysis | unavailable |
| Wi-Fi | Kotlin connectivity bridge | none | unavailable |
| Network | consented `VpnService` | optional enrichment | no native monitor |
| Bluetooth | Kotlin Bluetooth bridge | none | unavailable |

Navigation and UI components must remain independent of a particular threat-intelligence vendor.
