# CyberShield Product Capability Inventory

This document is the source of truth for the product surface in the 0.6.0 build. A screen being visible does not imply broader device access than described below.

| Module | Current implementation | Truthful user-facing state | Data boundary |
| --- | --- | --- | --- |
| Security Dashboard | Sentinel Core, posture summary, real activity and attention count | Uses local history and capability availability; no invented device score | Local app storage only |
| Phishing Protection | URL normalization, public-suffix-aware structural heuristics, local test blocklist, explainable findings | Ready for local checks; external reputation is not configured | URL stays on device in the mobile flow |
| File Scanner | Android document picker, filename/MIME/header checks, and local SHA-256 where the provider exposes bytes | Ready for local assessment; no antivirus/YARA engine | File content is never executed or uploaded |
| Application Security | Local Kotlin PackageManager audit of Android-visible launcher apps; declared sensitive-permission/review signals | Ready; no `QUERY_ALL_PACKAGES`, malware verdict, or upload | App inventory stays in memory for the current scan only |
| Wi-Fi Security | Android-reported connection type/reachability, Wi-Fi state, SSID and security type only when exposed, airplane mode, and local IP when exposed | Ready for limited connection-state checks; no traffic or DNS inspection | No packet or traffic collection |
| Network Monitor | Android-reported connection type/reachability and local IP when exposed | Ready for limited connectivity metadata; no `VpnService` or flow inspection | No traffic content is captured |
| Bluetooth Security | Kotlin adapter reads paired-device names/types after user grants Android Nearby devices access | Ready; no discovery, addresses, or remote upload | Pairing data stays in memory for the current scan only |
| Scan engine | Shared manual and automatic module orchestration, honest progress, skip/failure records, cancellation, and local run history | Ready | Local AsyncStorage only |
| Automatic Scan | Expo Background Task/WorkManager registration with battery and Wi-Fi policy controls | Optional and deferrable; exact clock time is not guaranteed | Saved URLs and connection-state metadata only |
| Finding notifications | Android notification channel for changed automatic URL findings | Optional, permission-gated | No scan content is sent remotely |
| Threat Alerts | Derived from actual suspicious/malicious local assessments | Ready for stored local scan alerts | Scan subject and local result only |
| Activity & Scan History | Saved local URL/file assessments, filters, clear control | Ready | AsyncStorage; no account or cloud sync |
| Security Analytics | Trends and outcome distribution from saved assessments | Ready when activity exists; otherwise shows insufficient data | Real history only; demo is excluded |
| Security Education | Practical security guidance | Ready | Static local content |
| Privacy & Settings | Theme, reduced motion, demo controls and limits | Ready | Preferences saved locally |

## Demonstration mode

Demo Mode exists for teaching the intended product capabilities before native integrations are shipped. It is off by default, has a persistent visible `DEMO MODE` label, and only supplies in-memory sample records to the module currently showing them. It does not modify scan history, alerts, posture, or analytics.

## Not yet implemented

CyberShield does not currently perform remote reputation lookup, malware scanning, broad installed-app enumeration, nearby-Wi-Fi diagnostics, Bluetooth discovery, or VPN-based traffic monitoring. These need separately designed Android adapters and, for scanning/reputation, separately operated backend services.
