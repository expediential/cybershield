# Security model

## Threat-modelled constraints

CyberShield is itself a security-sensitive application. This MVP does not collect credentials, execute scanned content, install certificates, intercept TLS, or silently turn on a VPN.

### URL assessments

The local scanner examines address structure only:

- unencrypted HTTP
- URL shorteners
- punycode hostnames
- direct IP hosts
- user-info / misleading @ structures
- selected high-abuse TLDs
- a small reserved **test** blocklist

It does not fetch a destination, crawl a web page, authenticate to it, or declare an unknown link safe. Clear means no high-risk signals were detected by the available local checks.

### File assessments

The mobile flow selects a file using the platform picker and looks only at metadata. The optional API reads at most 10 MB and never executes a file. Do not expose this MVP endpoint to the public internet.

Before enabling deep scans:

1. Require authenticated, rate-limited requests.
2. Use a scan job queue; do not scan in the API process.
3. Store files outside the web root with random identifiers.
4. Run worker containers with no network, read-only filesystem, non-root UID, timeouts, CPU/memory caps, and automatic deletion.
5. Sanitize all result text and keep security logs free of sensitive URLs and file paths.

### Android modules

Installed-app access, Wi-Fi metadata, nearby Bluetooth discovery and a VpnService all have version-specific Android restrictions. Request only the minimum permission immediately before the user-selected feature. Never represent a denied, unavailable, or sample-only feature as active.

### Demo Mode

Demo Mode is an in-memory teaching aid for the App Security, Wi-Fi Security, Network Monitor, Bluetooth Security, and Alerts surfaces. Every sample surface carries a `DEMO` label. Demo records are never written to scan history, derived into real alerts, or included in analytics/posture calculations. Turning Demo Mode off immediately removes the sample workspace data.

### Posture and alerts

CyberShield does not calculate a universal device security score. The dashboard can state only: how many declared modules are ready, whether saved local assessments need review, and whether there is insufficient information. Alerts are derived from saved suspicious/malicious URL or file assessments; dismissing and read state are local user controls.

### Secrets

The mobile application contains no API keys. Configure server-only secrets with deployment secret management; do not commit .env files. .env.example contains empty placeholders only.
