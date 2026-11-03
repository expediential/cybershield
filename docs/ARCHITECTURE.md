# Architecture

## Product boundaries

CyberShield is a local-first Expo Android application. It has a functional local URL structural analyser, Android file picker metadata inspection, and persisted local history. Advanced Android-security functions are visible as dedicated modules but remain explicitly unconnected until native integrations exist.

## Mobile structure

~~~text
App.tsx                         state shell, Android back behaviour, transitions
src/core/ThemeProvider.tsx      persisted theme, reduced motion, demo preference
src/core/navigation.ts          route identifiers
src/design/tokens.ts            Sentinel visual/motion tokens
src/components/QuietSignal.tsx  brand, module symbols, Sentinel Core, traces, timelines
src/domain/
  capabilities.ts               module availability records
  urlScanner.ts                 deterministic local URL logic
  productState.ts               posture, analytics, alert derivation
  demo.ts                       isolated demonstration records
src/features/
  home/                         dashboard
  protection/                   full module index
  scanner/                      URL and metadata workflows
  modules/                      app, Wi-Fi, network and Bluetooth workspaces
  activity/, alerts/, analytics/, profile/
src/services/history.ts         AsyncStorage persistence
~~~

`App.tsx` deliberately retains a small, dependency-free route state rather than installing a router. Every declared route is reachable through a primary navigation path or a direct action in a parent screen.

## Data flow

~~~text
URL input ──→ urlScanner ──→ UrlScanResult ──→ local history ──→ alerts / timeline / analytics
File picker ─→ metadata result ──────────────→ local history ──→ alerts / timeline / analytics
Demo Mode ───→ in-memory demo records ───────→ module view only (never history/analytics)
~~~

## URL assessment

`urlScanner.ts` accepts HTTP/S addresses only, normalizes input, and applies explainable checks for HTTP, shorteners, punycode, IP hosts, misleading user-info, credential-lure paths, risky TLDs, complex hosts, and a local test blocklist. It does not fetch the page, follow redirects, or query an external reputation service.

## File assessment

`expo-document-picker` returns Android-provided metadata. The app evaluates whether the filename has an installer/executable extension and always says whether an antivirus engine ran. It does not execute, hash, upload, or classify file contents.

## Native extension boundaries

| Module | Required native / service work | Current state |
| --- | --- | --- |
| Application Security | Kotlin PackageManager bridge, package visibility policy | Not connected |
| Wi-Fi Security | Kotlin connectivity/Wi-Fi adapter, version-specific permissions | Not connected |
| Network Monitor | Consent-based Kotlin `VpnService`, persistent stop control | Not connected |
| Bluetooth Security | Android nearby-device permissions and Bluetooth adapter | Not connected |
| File engines | Isolated ClamAV/YARA worker and opt-in backend client | Not connected |
| URL reputation | Provider adapter, backend-held keys, privacy disclosure | Not configured |

No advanced module can report live device data until this work is implemented and tested.

## Optional backend

The FastAPI sample exposes health, URL assessment, and a size-bounded metadata upload contract. A production scanning architecture must use isolated queued workers:

~~~text
mobile client → authenticated API → queue → isolated scan worker → signed result store
~~~
