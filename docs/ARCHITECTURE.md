# Architecture — Phase 2

CyberShield is a local-first Expo Android application. It keeps its product UI separate from the security assessment engine, Android-platform adapters, storage, scheduling, and notifications.

## Runtime map

~~~text
App.tsx
  ├─ persisted UI shell and route state
  ├─ local assessment history
  ├─ persisted scan-run history
  └─ automatic-scan settings

src/scanning/ScanManager.ts
  ├─ module registry and shared orchestration
  ├─ manual scan execution
  └─ automatic scan execution
       ├─ Phishing Protection     URL structural analysis
       ├─ File Security           user-selected file metadata, header, SHA-256
       ├─ Wi-Fi Security          Android-reported connection state
       ├─ Network Security        Android-reported connectivity metadata
       ├─ App Security            launchable-app metadata and declared-permission audit
       └─ Bluetooth Security      user-approved paired-device metadata audit

src/scanning/ScanScheduler.ts
  ├─ Expo Background Task → Android WorkManager
  ├─ battery/Wi-Fi execution policy
  ├─ run persistence
  └─ changed-finding notification gate
~~~

## Shared scanning contract

Every `ScanModule` declares its identity, display name, Android access requirements, availability check, and `execute` function. `ScanManager` produces the same `ScanRun`, `ScanModuleResult`, finding, recommendation, progress, and partial-completion model for both Manual Scan and Automatic Scan.

Progress is derived from completed modules divided by selected modules. It is never a cosmetic timer. A full scan runs all selected modules, with unavailable access or missing input represented by a skipped result instead of a fabricated clean result.

## Manual Scan

Manual Scan can select any module and accepts input only when the module needs it:

- URL Security accepts a user-supplied HTTP/S URL and never opens it.
- File Security accepts only a file explicitly selected through Android’s system picker.
- Wi-Fi and Network Security query supported Android connection-state APIs.
- App Security uses a narrow Kotlin PackageManager bridge and launcher-only Android package visibility.
- Bluetooth Security requests Android Nearby devices access only when the user starts a paired-device audit.

The UI may cancel a run between modules. Any completed results are retained and the run is marked `cancelled`.

## Automatic Scan

Automatic Scan is an Expo Background Task registered in global module scope. In an Android standalone/development build, Expo schedules it through WorkManager. The schedule is deferrable: the configured daily/weekly cadence is a **minimum interval**, not a promise of an exact time.

Eligible automatic checks are intentionally limited to:

- previously saved URLs (rechecked with current local heuristics),
- Wi-Fi connection-state metadata, and
- network connection-state metadata.

Automatic Scan never chooses files, reads device storage, inventories applications, discovers Bluetooth devices, or captures network traffic. A battery policy defers under 20% when not charging; Wi-Fi-only mode defers when Android does not report Wi-Fi. Android can impose additional deferral. If the app is force-stopped, scheduled work does not resume until the user opens CyberShield again.

## Persistence

| Store | Contents | Retention |
| --- | --- | --- |
| `@cybershield/scan-history/v1` | saved URL/file assessment summaries | newest 30 |
| `@cybershield/scan-runs/v1` | manual/automatic run summaries and module outcomes | newest 40 |
| `@cybershield/automatic-scan/v1` | schedule and execution preferences | until changed or app data is cleared |

All stores use app-local AsyncStorage. No file content, API keys, network payloads, or installed-app inventory is stored by this release.

## Android-native boundaries

Expo modules provide the currently implemented platform access: `expo-file-system`, `expo-network`, `expo-battery`, `expo-background-task`, `expo-task-manager`, `expo-notifications`, and the local `cybershield-device-security` Kotlin module. Background Tasks and notification behavior require a standalone or development Android build; Expo Go is not a supported background-task runtime.

The following remain outside this release and require separately designed and audited platform work before any device claim can be made:

- broad `PackageManager` visibility beyond user-facing launcher activities;
- Wi-Fi DNS, gateway, and nearby-scan details;
- Bluetooth discovery or device-address collection;
- an explicit-consent `VpnService` for metadata-only flow monitoring.

## Future backend adapters

External URL reputation or file-hash reputation must use a backend-held provider key and a provider-specific privacy/terms review. Files must not be uploaded without a separate, explicit user-consent interaction. Antivirus/YARA engines belong in isolated, resource-capped workers—not in the mobile process.
