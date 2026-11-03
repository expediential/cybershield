# CyberShield Product Capability Inventory

This document is the source of truth for the product surface in the 0.4.0 rebuild. A screen being visible does not mean its underlying Android integration is available.

| Module | Current implementation | Truthful user-facing state | Data boundary |
| --- | --- | --- | --- |
| Security Dashboard | Sentinel Core, posture summary, real activity and attention count | Uses local history and capability availability; no invented device score | Local app storage only |
| Phishing Protection | URL normalization, structural heuristics, local test blocklist, explainable findings | Ready for local checks; external reputation is not configured | URL stays on device in the mobile flow |
| File Scanner | Android document picker and metadata assessment | Ready for metadata inspection; no antivirus/YARA engine | File content is not executed or uploaded |
| Application Security | Dedicated audit experience | Setup required: Expo build has no PackageManager bridge | Demo inventory is isolated and labelled |
| Wi-Fi Security | Dedicated network diagnostic experience | Setup required: no native Wi-Fi diagnostic adapter | Demo topology is isolated and labelled |
| Network Monitor | Dedicated consent/workspace experience | Setup required: no `VpnService` session exists | Demo events never enter real history |
| Bluetooth Security | Dedicated nearby-device experience | Setup required: no native Bluetooth discovery adapter | Demo devices are isolated and labelled |
| Threat Alerts | Derived from actual suspicious/malicious local assessments | Ready for stored local scan alerts | Scan subject and local result only |
| Activity & Scan History | Saved local URL/file assessments, filters, clear control | Ready | AsyncStorage; no account or cloud sync |
| Security Analytics | Trends and outcome distribution from saved assessments | Ready when activity exists; otherwise shows insufficient data | Real history only; demo is excluded |
| Security Education | Practical security guidance | Ready | Static local content |
| Privacy & Settings | Theme, reduced motion, demo controls and limits | Ready | Preferences saved locally |

## Demonstration mode

Demo Mode exists for teaching the intended product capabilities before native integrations are shipped. It is off by default, has a persistent visible `DEMO MODE` label, and only supplies in-memory sample records to the module currently showing them. It does not modify scan history, alerts, posture, or analytics.

## Not yet implemented

CyberShield does not currently perform remote reputation lookup, malware scanning, installed-app enumeration, Wi-Fi diagnostics, Bluetooth discovery, Android notifications, or VPN-based traffic monitoring. These need native Android adapters and, for scanning/reputation, separately operated backend services.
