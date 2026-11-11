# Open-source attribution and integration review

CyberShield does not copy, bundle, or link the candidate projects in the table below. The current Android build uses Expo packages plus `tldts`, declared in `package.json`; their licenses are resolved through the npm dependency tree and must remain part of release compliance review.

| Integrated dependency | Purpose | License | Data boundary |
| --- | --- | --- | --- |
| `tldts` 7.4.19 | Local public-suffix parsing for registrable-domain link checks | MIT | Runs on device; no URL is sent to a service |

| Candidate | Repository | License reviewed | Decision in this release | If adopted later |
| --- | --- | --- | --- | --- |
| YARA | https://github.com/VirusTotal/yara | BSD 3-Clause (verify pinned release before use) | Not integrated | Isolate rules/engine in a backend worker; publish required notices and review rule provenance. |
| ClamAV | https://github.com/Cisco-Talos/clamav | GPL-2.0 | Not integrated | Do not embed in the proprietary mobile client without a full GPL/commercial-distribution review. Prefer an isolated service only after legal review. |
| Magika | https://github.com/google/magika | Apache-2.0 | Not integrated | Evaluate model/runtime size, Android compatibility, model attribution, and false-positive behavior before use. |
| MobSF | https://github.com/MobSF/Mobile-Security-Framework-MobSF | GPL-3.0 | Not integrated | Keep as an optional analyst/CI service; do not bundle it into the client without GPL compliance review. |
| VirusTotal | https://www.virustotal.com/ | Service terms/API terms—not an embedded OSS dependency | Not configured | Use only through a consented backend adapter; keep keys server-side and respect quotas/terms. |

## Review record

The technical review concluded that ClamAV, YARA, Magika, and MobSF are not responsible direct React Native/Expo mobile-client dependencies for this phase. They either require native/server runtimes, carry copyleft obligations, are designed as analysis platforms, or need separate privacy and operational controls. No source code, signatures, models, or feeds from these candidate projects are included in CyberShield 0.6.1.

License and maintenance must be rechecked against a pinned version immediately before any integration. This document is an engineering record, not legal advice.
