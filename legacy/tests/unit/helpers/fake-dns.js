// Résolveur DNS simulé : une « zone » décrit les enregistrements par nom, sans aucun réseau.
//   fakeResolver({ 'example.com': { A: ['1.2.3.4'], MX: ['10 mx.example.com.'], TXT: ['v=spf1 -all'] } })
import { RCODE, TYPE } from '../../../src/lib/dns/resolver.js';

const CODES = Object.fromEntries(Object.entries(TYPE).map(([k, v]) => [k, v]));

export function fakeResolver(zone, { ad = false } = {}) {
  const log = [];
  const records = (name, type) => zone[name]?.[type] ?? [];

  const answer = (name, type, data) => ({
    name, // comme le résolveur réel, les noms sont rendus sans point final
    type: CODES[type],
    ttl: 300,
    data: type === 'TXT' ? (Array.isArray(data) ? data.map((p) => `"${p}"`).join(' ') : `"${data}"`) : data,
  });

  return {
    log,
    stats: { queries: 0 },
    async query(rawName, type) {
      const name = rawName.toLowerCase().replace(/\.$/, '');
      log.push(`${name} ${type}`);
      this.stats.queries += 1;
      const base = { name, qtype: CODES[type], ad, endpoint: 'fake', authority: [] };
      if (!zone[name]) return { ...base, status: RCODE.NXDOMAIN, answers: [] };

      const answers = [];
      let current = name;
      // Suit les alias CNAME comme un vrai résolveur
      for (let hop = 0; hop < 5 && type !== 'CNAME' && zone[current]?.CNAME; hop += 1) {
        const target = zone[current].CNAME[0];
        answers.push(answer(current, 'CNAME', `${target}.`));
        current = target;
      }
      for (const data of records(current, type)) answers.push(answer(current, type, data));
      return { ...base, status: RCODE.NOERROR, answers };
    },
  };
}

/** Zone d'un domaine « en bonne santé » : sert de base aux tests, chacun la modifie localement. */
export function healthyZone(domain = 'example.com') {
  return {
    [domain]: {
      A: ['93.184.216.34'],
      AAAA: ['2606:2800:220:1:248:1893:25c8:1946'],
      NS: ['ns1.example.net.', 'ns2.example.net.'],
      SOA: ['ns1.example.net. hostmaster.example.net. 2024010101 7200 3600 1209600 3600'],
      MX: ['10 mx1.mailhost.test.', '20 mx2.mailhost.test.'],
      TXT: ['v=spf1 ip4:203.0.113.0/24 -all', 'google-site-verification=abc'],
      CAA: ['0 issue "letsencrypt.org"'],
      DS: ['12345 13 2 ABCDEF'],
    },
    'mx1.mailhost.test': { A: ['93.184.216.35'] },
    'mx2.mailhost.test': { A: ['93.184.216.36'], AAAA: ['2606:4700:4700::1111'] },
    [`_dmarc.${domain}`]: { TXT: ['v=DMARC1; p=reject; rua=mailto:dmarc@' + domain] },
  };
}
