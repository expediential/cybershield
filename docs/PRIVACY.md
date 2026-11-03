# Privacy

CyberShield aims to minimize data exposure.

## Current mobile behavior

- URL structure analysis runs on-device.
- Scan history is retained locally through unencrypted app storage. It contains no credentials and is not suitable for secrets.
- The saved light/dark appearance preference is retained locally through the same app storage.
- Reduced Motion and Demo Mode preferences are retained locally through the same app storage.
- Demo Mode records stay in memory only. They are not written to local history, alerts, analytics, or posture state.
- No analytics SDK is included.
- No account system, password collection, VPN capture, Bluetooth scan, Wi-Fi read, installed-app inventory, or external URL reputation lookup is enabled in the MVP.
- File selection uses the operating-system picker. The MVP derives a local metadata result and does not upload the file.

## If a backend is enabled

The sample API accepts a URL or a bounded file upload. Production use needs a privacy notice that specifies retention, processing region, deletion procedure, security contacts, third-party threat-intelligence sharing, and the legal basis for processing.

Never send page credentials, browser cookies, content from private messages, or installed-app lists to a third party by default.

## User controls planned

- clear local scan history or choose encrypted storage
- enable/disable each monitoring category
- notification preferences
- data-export and deletion controls
- visible backend and third-party provider status
