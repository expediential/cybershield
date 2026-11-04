# Roadmap

## Delivered in 0.6.0

- [x] Sentinel dark-first visual system with a deliberately designed light mode
- [x] Sentinel Core, Threat Constellation, Scan Trace, Security Timeline, and custom module symbols
- [x] Dedicated user-facing workspaces for phishing, files, applications, Wi-Fi, network monitoring, and Bluetooth
- [x] Explicit Demo Mode with isolated, non-persisted sample data
- [x] Real local alert derivation, read/dismiss state, clearable scan history, and activity analytics
- [x] Reduced Motion preference and Android hardware-back handling
- [x] Deterministic URL scanner and product-state tests
- [x] Standalone Android APK CI/release workflow
- [x] Shared manual scan orchestration with outcome-derived progress and partial completion
- [x] Optional WorkManager-backed automatic URL, Wi-Fi-state, and network-state checks
- [x] Local SHA-256 and file-header inspection for user-selected files where Android exposes a stream
- [x] Optional Android finding notifications for changed automatic URL findings
- [x] Limited Android connection-state checks with explicit no-traffic-capture boundary
- [x] Launcher-only PackageManager audit for declared sensitive-permission and review signals
- [x] Just-in-time Bluetooth paired-device audit with Android Nearby devices permission
- [x] Local public-suffix parsing for registrable-domain link checks

## Next implementation milestones

- [ ] Android Wi-Fi/connectivity bridge with API-level behaviour matrix
- [ ] Threat-modelled, consented Kotlin VpnService with persistent stop control
- [ ] Opt-in remote URL reputation adapter with backend-only API keys and provider disclosure
- [ ] Isolated queued ClamAV/YARA file worker with upload consent and result signatures
- [ ] Physical-device accessibility, layout, and integration test matrix

## Release gate

An APK from CI is installable but does not complete a public-store release gate. A public release needs physical-device testing, native permission testing on supported Android versions, accessibility review, dependency audit, privacy review, approved signing, checksum verification, and store-compliance review.
