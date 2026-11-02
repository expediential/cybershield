# Privacy

CyberShield aims to minimize data exposure.

## Current mobile behavior

- URL structure analysis runs on-device.
- Scan history is retained locally through unencrypted app storage. It contains no credentials and is not suitable for secrets.
- No analytics SDK is included.
- No account system, password collection, VPN capture, Bluetooth scan, Wi-Fi read, or installed-app inventory is enabled in the MVP.
- File selection uses the operating-system picker. The MVP derives a local metadata result and does not upload the file.

## If a backend is enabled

The sample API accepts a URL or a bounded file upload. Production use needs a privacy notice that specifies retention, processing region, deletion procedure, security contacts, third-party threat-intelligence sharing, and the legal basis for processing.

Never send page credentials, browser cookies, content from private messages, or installed-app lists to a third party by default.

## User controls planned

- clear local scan history
- enable/disable each monitoring category
- notification preferences
- data-export and deletion controls
- visible backend and third-party provider status
