// Fabrique de réponses DNS binaires pour les tests (tests unitaires et faux résolveurs des tests de bout en bout).
//   buildResponse({ name: 'exemple.fr', type: 'A', answers: ['1.2.3.4'] })
const TYPES = { A: 1, NS: 2, CNAME: 5, SOA: 6, MX: 15, TXT: 16, AAAA: 28 };

const name = (value) => {
  const bytes = [];
  for (const label of String(value).replace(/\.$/, '').split('.'))
    bytes.push(label.length, ...Buffer.from(label));
  return [...bytes, 0];
};
const u16 = (n) => [(n >> 8) & 0xff, n & 0xff];
const u32 = (n) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

function ipv6(text) {
  const [head, tail = ''] = text.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = text.includes('::')
    ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]
    : left;
  return groups.flatMap((g) => u16(parseInt(g, 16)));
}

function rdata(type, value) {
  switch (type) {
    case 'A':
      return value.split('.').map(Number);
    case 'AAAA':
      return ipv6(value);
    case 'NS':
    case 'CNAME':
      return name(value);
    case 'MX': {
      const [preference, host] = value.split(' ');
      return [...u16(Number(preference)), ...name(host)];
    }
    case 'TXT': {
      const chunks = value.match(/.{1,255}/gs) ?? [''];
      return chunks.flatMap((chunk) => [chunk.length, ...Buffer.from(chunk)]);
    }
    default:
      throw new Error(`Type non pris en charge par le fabricant de test : ${type}`);
  }
}

/** @param {{ name: string, type: string, answers?: string[], rcode?: number, ttl?: number, ad?: boolean }} options */
export function buildResponse({
  name: domain,
  type,
  answers = [],
  rcode = 0,
  ttl = 300,
  ad = false,
}) {
  const flags = 0x8180 | (ad ? 0x20 : 0) | rcode;
  const question = [...name(domain), ...u16(TYPES[type]), ...u16(1)];
  const records = answers.flatMap((value) => {
    const data = rdata(type, value);
    return [0xc0, 0x0c, ...u16(TYPES[type]), ...u16(1), ...u32(ttl), ...u16(data.length), ...data]; // nom : pointeur vers la question
  });
  return Buffer.from([
    ...u16(0),
    ...u16(flags),
    ...u16(1),
    ...u16(answers.length),
    0,
    0,
    0,
    0,
    ...question,
    ...records,
  ]);
}
