# Roadmap

## Delivered in 0.1.0

- [x] Original premium technical visual system
- [x] Offline local URL-structure assessment
- [x] Scan history
- [x] File picker and transparent metadata-only response
- [x] Optional FastAPI contract
- [x] Android debug-build CI workflow

## Next

- [ ] Add a clear-history control and encrypted storage configuration
- [ ] Add backend client with timeouts, typed errors, opt-in provider disclosure
- [ ] Add isolated queued ClamAV/YARA worker infrastructure
- [ ] Add unit and UI tests, offline/error test matrix, and accessibility audit
- [ ] Add Kotlin Android bridges for user-consented Wi-Fi, Bluetooth, and app metadata
- [ ] Add a user-controlled VpnService monitor only after threat modelling and privacy review
- [ ] Add MobSF deployment documentation and selected-APK workflow

## Release gate

A public release requires an Android device/emulator test pass, API threat-model review, dependency audit, privacy review, signed artifact, checksum, store-compliance review, and a verified GitHub Release asset.
