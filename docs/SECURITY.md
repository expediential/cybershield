# Security boundaries

## Implemented assessments

### Phishing Protection

The local URL analyser normalizes HTTP/S input without visiting the destination. It explains visible structural signals: HTTP, shorteners, punycode labels, direct IP hosts, misleading user-info, encoded components, redirect parameters, lure wording, risky TLDs, unusually complex hosts, and selected brand-placement look-alikes. A tiny reserved test blocklist exists solely for deterministic test coverage.

A low-risk result means no high-risk signal was found by these local checks. It is not a reputation verdict or a guarantee that a site is safe.

### File Security

Files are selected through Android’s picker. CyberShield does not execute, install, preview, transmit, or upload them. When the Android document provider gives the app a readable stream, the app calculates a SHA-256 fingerprint and inspects the first bytes for a small set of file signatures. It also compares extension, reported MIME type, size, executable/installer indicators, and double extensions.

The assessment is not antivirus, YARA, sandboxing, or a malware-clean declaration. A hash is displayed only for user comparison with a trusted publisher; no external hash reputation provider is configured.

### Wi-Fi and Network Security

The app reads Android-reported connection type, connected/reachable state, airplane mode, and a local IPv4 address when the platform exposes it. It does not read SSIDs, encryption, passwords, DNS payloads, packets, traffic contents, or TLS content. It does not establish a VPN.

## Deliberately unavailable modules

Installed-app auditing and Bluetooth discovery require dedicated Android-native adapters and version-specific permissions. These modules report unavailable/skipped in the shared scan engine. Demo Mode remains visibly labelled and never becomes security history, posture, alerts, or analytics.

## Automatic Scan and notifications

Automatic Scan uses Android WorkManager through Expo Background Task in a standalone/development build. It is deferrable and runs supported local checks only. It does not bypass Android background limits, user permissions, app force-stop behavior, or battery/network conditions. A notification is emitted only after notification permission is granted and a suspicious/malicious URL fingerprint differs from the previous automatic run.

## Future integrations

Any reputation provider, file engine, or VPN integration must be threat-modelled and reviewed before enabling it. Provider secrets stay on a backend; personal files require an explicit per-upload consent step; workers must be isolated, non-root, network-restricted where possible, and resource capped.
