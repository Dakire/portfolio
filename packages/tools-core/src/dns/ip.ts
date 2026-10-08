// Adresses IP : validation et plages, sans dépendance (utilisé par SPF, MX et A/AAAA).
export const isIPv4 = (s: string): boolean =>
  /^(\d{1,3})(\.\d{1,3}){3}$/.test(s) &&
  s.split('.').every((n) => Number(n) <= 255 && String(Number(n)) === n);

export const ipv4ToInt = (s: string): number =>
  s.split('.').reduce((acc, n) => acc * 256 + Number(n), 0);

export function isIPv6(s: unknown): boolean {
  if (typeof s !== 'string' || !/^[0-9a-f:.]+$/i.test(s) || !s.includes(':')) return false;
  try {
    new URL(`http://[${s}]/`); // l'analyseur d'URL accepte exactement les formes IPv6 valides (compression, IPv4 incorporé…)
    return true;
  } catch {
    return false;
  }
}

/** Plages IPv4 qui ne sont jamais routées sur Internet : un MX ou un A qui y pointe est une erreur de configuration. */
const PRIVATE_V4: [string, number][] = [
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['100.64.0.0', 10],
  ['0.0.0.0', 8],
  ['192.0.2.0', 24],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

export const inCidr4 = (ip: string, network: string, prefix: number): boolean => {
  const size = 2 ** (32 - prefix);
  const base = Math.floor(ipv4ToInt(network) / size) * size;
  const value = ipv4ToInt(ip);
  return value >= base && value < base + size;
};

export const isPrivateIPv4 = (ip: string): boolean =>
  isIPv4(ip) && PRIVATE_V4.some(([network, prefix]) => inCidr4(ip, network, prefix));

export const isPrivateIPv6 = (ip: string): boolean => {
  const s = ip.toLowerCase();
  return (
    s === '::' ||
    s === '::1' ||
    /^f[cd][0-9a-f]{2}:/.test(s) ||
    /^fe[89ab][0-9a-f]:/.test(s) ||
    s.startsWith('2001:db8')
  );
};

/** Réseau IPv4 « adresse/préfixe » -> [début, fin] numériques (pour détecter les plages qui se recouvrent). */
export const rangeOf4 = (ip: string, prefix: number): [number, number] => {
  const size = 2 ** (32 - prefix);
  const start = Math.floor(ipv4ToInt(ip) / size) * size;
  return [start, start + size - 1];
};

/** Bits d'hôte non nuls dans « adresse/préfixe » (ex. 192.0.2.7/24) : l'adresse n'est pas celle du réseau. */
export const hasHostBits4 = (ip: string, prefix: number): boolean =>
  rangeOf4(ip, prefix)[0] !== ipv4ToInt(ip);
