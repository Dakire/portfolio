// Faux résolveurs DNS-over-HTTPS pour les tests : réponses JSON construites à partir d'une « zone » décrite en clair.
//   await stubDoh(page, { 'example.fr': { A: ['93.184.216.34'], MX: ['10 mx.example.fr.'] } })
import { generateKeyPairSync } from 'node:crypto';
import type { Page, Route } from '@playwright/test';

type Zone = Record<string, Record<string, string[]>>;
const CODES: Record<string, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  DS: 43,
  CAA: 257,
};
const NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(CODES).map(([k, v]) => [v, k]),
);

export const rsaKey = (bits = 2048) =>
  generateKeyPairSync('rsa', { modulusLength: bits })
    .publicKey.export({ type: 'spki', format: 'der' })
    .toString('base64');

function respond(zone: Zone, name: string, code: number, ad: boolean) {
  const type = NAMES[code] ?? '';
  if (!zone[name]) return { Status: 3, AD: false, Answer: [] };
  const Answer: { name: string; type: number; TTL: number; data: string }[] = [];
  let current = name;
  for (let hop = 0; hop < 5 && type !== 'CNAME' && zone[current]?.CNAME; hop += 1) {
    const target = zone[current]?.CNAME?.[0] ?? '';
    Answer.push({ name: `${current}.`, type: CODES.CNAME as number, TTL: 300, data: `${target}.` });
    current = target;
  }
  for (const data of zone[current]?.[type] ?? []) {
    Answer.push({
      name: `${current}.`,
      type: code,
      TTL: 300,
      data: type === 'TXT' ? `"${data}"` : data,
    });
  }
  return { Status: 0, AD: ad, Answer };
}

/** Intercepte les deux résolveurs publics (Cloudflare puis Google) ; `log` reçoit « nom TYPE » à chaque requête. */
export async function stubDoh(
  page: Page,
  zone: Zone,
  { ad = true, log = [] as string[], cloudflareDown = false } = {},
) {
  const handler = (route: Route) => {
    const url = new URL(route.request().url());
    const name = (url.searchParams.get('name') ?? '').toLowerCase().replace(/\.$/, '');
    const code = Number(url.searchParams.get('type'));
    log.push(`${name} ${NAMES[code]}`);
    return route.fulfill({
      contentType: 'application/dns-json',
      json: respond(zone, name, code, ad),
    });
  };
  // cloudflareDown : le premier résolveur répond 503, l'outil doit basculer sur le second
  await page.route(
    'https://cloudflare-dns.com/dns-query*',
    cloudflareDown ? (route) => route.fulfill({ status: 503, body: 'panne' }) : handler,
  );
  await page.route('https://dns.google/resolve*', handler);
  return log;
}

/** Zone d'un domaine messagerie en bon état (Google Workspace) : chaque test la modifie localement. */
export function mailZone(domain = 'example.fr'): Zone {
  return {
    [domain]: {
      A: ['93.184.216.34'],
      AAAA: ['2606:4700:4700::1111'],
      NS: ['ns1.dnshost.test.', 'ns2.dnshost.test.'],
      SOA: ['ns1.dnshost.test. hostmaster.dnshost.test. 2024010101 7200 3600 1209600 3600'],
      MX: ['1 aspmx.l.google.com.', '5 alt1.aspmx.l.google.com.'],
      TXT: ['v=spf1 include:_spf.google.com -all', 'google-site-verification=abc123'],
      CAA: ['0 issue "letsencrypt.org"'],
      DS: ['12345 13 2 ABCDEF'],
    },
    'aspmx.l.google.com': { A: ['93.184.216.40'], AAAA: ['2606:4700:4700::1112'] },
    'alt1.aspmx.l.google.com': { A: ['93.184.216.41'] },
    '_spf.google.com': { TXT: ['v=spf1 ip4:93.184.216.0/24 ~all'] },
    [`_dmarc.${domain}`]: { TXT: [`v=DMARC1; p=reject; rua=mailto:dmarc@${domain}`] },
    [`google._domainkey.${domain}`]: { TXT: [`v=DKIM1; k=rsa; p=${rsaKey(2048)}`] },
  };
}
