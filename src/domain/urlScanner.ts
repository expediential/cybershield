import type { Finding, UrlScanResult, Verdict } from '../types/security';

const shorteners = new Set(['bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'is.gd', 'rb.gy', 'cutt.ly', 'rebrand.ly', 'shorturl.at']);
const testBlocklist = new Set(['malware.test', 'phishing.test', 'unsafe.example']);
const riskyTlds = new Set(['zip', 'mov', 'click', 'top', 'gq', 'work', 'country']);
const lureWords = /(login|verify|wallet|password|secure|account|invoice|gift|crypto|signin)/i;
const brandWords = ['paypal', 'microsoft', 'google', 'apple', 'amazon', 'netflix', 'instagram', 'facebook', 'whatsapp', 'binance'];

function finding(label: string, detail: string, severity: Finding['severity']): Finding {
  return { label, detail, severity };
}

export function scanUrl(input: string, now = new Date()): UrlScanResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return invalidResult(input, 'Enter a web address to begin a local assessment.', now);
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return invalidResult(input, 'This does not appear to be a valid web address.', now);
  }

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    return invalidResult(input, 'Only HTTP and HTTPS addresses can be assessed.', now);
  }

  const host = url.hostname.toLowerCase();
  const findings: Finding[] = [];
  let risk = 0;
  const apply = (points: number, item: Finding) => {
    risk += points;
    findings.push(item);
  };

  if (testBlocklist.has(host)) {
    apply(100, finding('Test threat match', 'This reserved demonstration domain is treated as malicious for local testing.', 'danger'));
  }
  if (url.protocol === 'http:') {
    apply(18, finding('Unencrypted connection', 'The address uses HTTP, so content can be changed in transit.', 'warning'));
  } else {
    findings.push(finding('Encrypted transport', 'HTTPS is present; this does not validate the site or its content.', 'safe'));
  }
  if ([...shorteners].some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    apply(24, finding('Shortened link', 'The final destination is hidden behind a link-shortening service.', 'warning'));
  }
  if (host.split('.').some((label) => label.startsWith('xn--'))) {
    apply(28, finding('Internationalized hostname', 'Punycode can be legitimate, but look-alike domains need extra scrutiny.', 'warning'));
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) {
    apply(30, finding('IP-address host', 'A direct IP address is unusual for consumer-facing sign-in links.', 'warning'));
  }
  if (url.username || url.password || trimmed.includes('@')) {
    apply(24, finding('Misleading address structure', 'A user-info segment can make an address appear to belong to another site.', 'danger'));
  }
  if (/%(?:[0-9a-f]{2})/i.test(url.pathname + url.search) || /%(?:25)?(?:40|2f|5c)/i.test(url.href)) {
    apply(14, finding('Encoded URL components', 'Encoded characters can be normal, but they can also conceal a destination, path, or user-info segment.', 'info'));
  }
  if (/(?:^|[?&])(url|uri|target|redirect|redirect_uri|next|continue|return|destination)=https?%?3a/i.test(url.search) || /(?:^|[?&])(url|uri|target|redirect|next|continue|return|destination)=https?:/i.test(url.search)) {
    apply(16, finding('Redirect parameter', 'The address contains a destination parameter. The final page may differ from the visible domain.', 'warning'));
  }
  const labels = host.split('.');
  const brandLabel = labels.find((label) => brandWords.includes(label.replace(/[^a-z]/g, '')) || brandWords.some((brand) => label.includes(brand)));
  const registeredArea = labels.slice(-2).join('.');
  if (brandLabel && !registeredArea.includes(brandLabel.replace(/[^a-z]/g, '')) && (labels.length > 2 || host.includes('-'))) {
    apply(22, finding('Look-alike brand placement', `The hostname includes “${brandLabel}” outside its apparent registrable domain. Legitimate brands can use subdomains, so verify independently.`, 'warning'));
  }
  if (lureWords.test(url.pathname + url.search) && (host.split('.').length > 3 || host.includes('-'))) {
    apply(18, finding('Credential-lure pattern', 'The path or query uses sign-in language alongside an unusually structured host.', 'warning'));
  }
  const tld = host.split('.').at(-1) || '';
  if (riskyTlds.has(tld)) {
    apply(12, finding('Higher-abuse TLD signal', 'This domain ending is frequently used in abuse campaigns; this alone is not proof.', 'warning'));
  }
  if (host.split('.').length >= 5 || host.length > 54) {
    apply(10, finding('Complex hostname', 'A long or deeply nested hostname can obscure the registered domain.', 'info'));
  }
  if (!findings.some((item) => item.severity === 'safe')) {
    findings.push(finding('Local assessment only', 'No external reputation source is configured on this device.', 'info'));
  }

  const score = Math.min(100, risk);
  const verdict: Verdict = score >= 85 ? 'malicious' : score >= 24 ? 'suspicious' : 'safe';
  const recommendation =
    verdict === 'malicious'
      ? 'Do not open or share this link. Delete it and report it through the service that delivered it.'
      : verdict === 'suspicious'
        ? 'Avoid entering credentials or payment details until you independently verify the sender and domain.'
        : 'No high-risk local signals were found. Verify the sender before sharing information; this is not a guarantee of safety.';

  return {
    input,
    normalized: url.toString(),
    verdict,
    score,
    findings,
    checkedAt: now.toISOString(),
    coverage: testBlocklist.has(host) ? 'Local test blocklist + structural analysis' : 'Structural analysis only — reputation lookup is not configured',
    recommendation,
  };
}

function invalidResult(input: string, reason: string, now: Date): UrlScanResult {
  return {
    input,
    normalized: '',
    verdict: 'unknown',
    score: 0,
    findings: [finding('Unable to assess', reason, 'info')],
    checkedAt: now.toISOString(),
    coverage: 'No assessment coverage',
    recommendation: 'Check the address and try again.',
  };
}
