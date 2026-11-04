# Privacy

CyberShield is local-first in this release.

- URL analysis is performed on-device and does not fetch the entered address.
- A selected file remains on device. CyberShield never uploads or executes it. If readable through Android’s picker grant, the app computes a SHA-256 fingerprint locally.
- Saved history contains link addresses or file names, verdicts, timestamps, and assessment summaries. It does not contain file bytes, passwords, browser cookies, packet content, or message contents.
- Automatic Scan rechecks only saved URLs and Android connection-state metadata. It never selects a file, scans storage, or captures network traffic.
- Notification permission is requested only when the user enables finding notifications while saving Automatic Scan settings.
- Theme, reduced-motion, Demo Mode, automatic-scan settings, history, and scan-run records are stored in app-local AsyncStorage. Clear app data to remove them; a dedicated scan-history clear control removes assessment history.
- Demo Mode uses in-memory records only and never enters real history, alerts, analytics, or the security posture.

No analytics SDK, account system, external URL-reputation API, external hash-reputation API, VPN service, Bluetooth scanner, or installed-app inventory is enabled in this release.

Before connecting a backend, CyberShield needs a user-facing privacy notice for retention, processing region, service providers, deletion, incident contact, and any threat-intelligence sharing. Never transmit a private file or installed-app inventory by default.
