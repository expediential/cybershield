# Architecture

## Principles

1. **Local-first by default.** A useful MVP must still open and demonstrate core workflows when remote services are unavailable.
2. **Capability honesty.** Every module describes whether it is active, needs permission, needs configuration, is unsupported, or is illustrative.
3. **Engine boundaries.** URL reputation, file scanning, static APK analysis, Android inventory, VPN observation, and nearby-device visibility are independent adapters.
4. **No security theatre.** A visual green state cannot substitute for a checked capability.

## Mobile

The Expo app intentionally has no router dependency in this small MVP. App.tsx owns screen transitions so all routes are available offline. It delegates scanner logic and persistence to focused modules:

~~~text
App / presentation
  ↓
urlScanner (pure local business logic) ──────→ UrlScanResult
  ↓
history service ─────────────────────────────→ AsyncStorage
~~~

The URL scanner is deterministic and testable. It normalizes an input, limits assessment to HTTP/S, then records explainable findings. It distinguishes an invalid/unknown address, local suspicious signals, a reserved local test-blocklist match, and no high-risk local signal.

The dashboard score is an **assessment score**, not a claim of device security. It is derived from the number of local findings plus a visible limited-coverage label. It must not become a 100% safe statement.

## Backend

The FastAPI service is optional. Current endpoints are versioned under /api/v1:

| Endpoint | Purpose | Safety boundary |
| --- | --- | --- |
| GET /health | readiness | no sensitive input |
| POST /scans/url | duplicateable local URL rules | no external calls |
| POST /scans/files | bounded metadata upload | 10 MB ceiling; no execution |

Production file scanning should use a queue and an isolated worker rather than the API process:

~~~text
client → authenticated API → scan-job queue → isolated ClamAV/YARA worker → signed result store
~~~

## Extension points

| Module | Mobile adapter | Backend adapter | Current state |
| --- | --- | --- | --- |
| URL security | local structural parser | permitted reputation provider | local parser implemented |
| Files | DocumentPicker | isolated scan worker | metadata only |
| Installed apps | Kotlin PackageManager bridge | MobSF for chosen APKs | planned |
| Wi-Fi | Kotlin connectivity bridge | none | planned |
| Network | user-authorized VpnService | optional enrichment | sample UI |
| Bluetooth | Kotlin Bluetooth bridge | none | planned |

Do not couple app navigation or screen components to a particular security vendor.
