# Roadmap

## Delivered in 0.3.0

- [x] Quiet Signal design system with a light-first and persistent dark theme
- [x] Original scalable Signal Mark and code-native visual components
- [x] Feature-oriented app structure in place of a monolithic interface
- [x] Honest protection map and quiet monitoring workspace
- [x] Local URL assessment, local activity history, and metadata-only file workflow
- [x] Android hardware-back handling and native screen-settle transitions
- [x] Standalone Android APK CI/release workflow

## Next

- [ ] Clear-history control and encrypted-storage decision
- [ ] Mobile UI tests, device accessibility audit, and offline/error matrix
- [ ] Opt-in backend client with typed errors, timeouts, and provider disclosure
- [ ] Isolated queued ClamAV/YARA worker infrastructure
- [ ] Kotlin Android bridges for user-consented Wi-Fi, Bluetooth, and app metadata
- [ ] Threat model and native user-controlled `VpnService` monitor
- [ ] Selected-APK/MobSF workflow with explicit upload consent

## Release gate

A public release requires a physical Android device or emulator pass, accessibility test pass, dependency audit, privacy review, signed artifact, checksum verification, and store-compliance review. An APK produced by CI should not be interpreted as completing those gates.
