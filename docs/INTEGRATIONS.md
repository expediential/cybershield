# Security engine integrations

No external intelligence provider or malware engine ships in this MVP. The following integrations are intentionally left as explicit configuration work, not mocked results.

## URL intelligence

Candidate services: URLhaus, OpenPhish, Google Web Risk / Safe Browsing. Before implementation, review current API terms, rate limits, licensing, data-sharing implications, authentication model, and maintenance state.

Recommended adapter contract:

~~~text
lookup(normalizedUrl) → unavailable | unknown | clean | suspicious | malicious
~~~

Merge external findings with local structural signals. A missed provider lookup must show unable to verify rather than fall back to green.

## ClamAV and YARA

ClamAV is a malware scanner; YARA is rule-based pattern matching. Neither alone gives an absolute-clean guarantee. They must run in isolated workers. License and rule-pack provenance need a separate legal/security review before distribution.

## MobSF

MobSF can analyze a user-selected APK when separately deployed. Do not upload installed applications automatically, and do not imply continuous private-memory inspection. It requires its own operational hardening and license review.

## Android native capabilities

The planned Kotlin bridge must use documented Android APIs:

- PackageManager for allowed app metadata
- connectivity APIs for permitted connection diagnostics
- Bluetooth APIs with user consent
- VpnService only after direct user action and system approval

Each adapter needs a capability status and a failure-state explanation in the UI.
