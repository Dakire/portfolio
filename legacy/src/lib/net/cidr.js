// Calculs réseau IPv4 et IPv6 en BigInt : analyse d'une saisie (CIDR, masque, adresse seule), description d'un réseau,
// découpage en sous-réseaux égaux, découpage VLSM selon des besoins en hôtes, appartenance d'une adresse, recouvrement.

const V4 = 32n;
const V6 = 128n;
const bitsOf = (family) => (family === 4 ? V4 : V6);
const pow2 = (n) => 1n << BigInt(n);

// --- Adresses ---

export function parseIPv4(text) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text.trim());
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255) || m.slice(1).some((p) => p.length > 1 && p.startsWith('0'))) return null;
  return parts.reduce((acc, p) => (acc << 8n) | BigInt(p), 0n);
}

export const formatIPv4 = (n) => [24n, 16n, 8n, 0n].map((s) => Number((n >> s) & 255n)).join('.');

export function parseIPv6(text) {
  let s = text.trim().toLowerCase();
  if (!s || /[^0-9a-f:.]/.test(s) || s.includes(':::')) return null;
  // IPv4 incorporé (::ffff:192.0.2.1) : converti en deux groupes
  const embedded = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (embedded) {
    const v4 = parseIPv4(embedded[1]);
    if (v4 === null) return null;
    s = `${s.slice(0, -embedded[1].length)}${(v4 >> 16n).toString(16)}:${(v4 & 0xffffn).toString(16)}`;
  }
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.reduce((acc, g) => (acc << 16n) | BigInt(parseInt(g, 16)), 0n);
}

const groups6 = (n) => Array.from({ length: 8 }, (_, i) => Number((n >> BigInt((7 - i) * 16)) & 0xffffn));
export const expandIPv6 = (n) => groups6(n).map((g) => g.toString(16).padStart(4, '0')).join(':');

/** Forme compressée de RFC 5952 : la plus longue suite de groupes nuls (au moins deux) devient « :: ». */
export function compressIPv6(n) {
  const g = groups6(n);
  let best = { start: -1, len: 0 };
  for (let i = 0; i < 8; ) {
    if (g[i] !== 0) {
      i += 1;
      continue;
    }
    let j = i;
    while (j < 8 && g[j] === 0) j += 1;
    if (j - i > best.len) best = { start: i, len: j - i };
    i = j;
  }
  const hex = g.map((x) => x.toString(16));
  if (best.len < 2) return hex.join(':');
  return `${hex.slice(0, best.start).join(':')}::${hex.slice(best.start + best.len).join(':')}`;
}

export const formatAddress = (family, n) => (family === 4 ? formatIPv4(n) : compressIPv6(n));

// --- Masques ---

/** Longueur du préfixe d'un masque IPv4 contigu (255.255.255.0 -> 24) ; null s'il n'est pas contigu. */
export function maskToPrefix(mask) {
  const value = BigInt.asUintN(32, mask);
  if (value === 0n) return 0;
  const inverted = BigInt.asUintN(32, ~value);
  if ((inverted & (inverted + 1n)) !== 0n) return null; // les bits à 0 ne sont pas tous en fin de masque
  return 32 - inverted.toString(2).replace(/^0+/, '').length;
}

export const prefixToMask = (prefix) => (prefix === 0 ? 0n : BigInt.asUintN(32, ~((1n << BigInt(32 - prefix)) - 1n)));

/**
 * « 192.168.1.10/24 », « 192.168.1.10 255.255.255.0 », « 192.168.1.0/0.0.0.255 » (joker), « 10.0.0.1 » (hôte), « 2001:db8::/32 ».
 * @returns {{ family: 4|6, ip: bigint, prefix: number } | { error: 'empty'|'address'|'prefix'|'mask' }}
 */
export function parseCidr(input) {
  const text = String(input ?? '').trim();
  if (!text) return { error: 'empty' };
  const [addr, rest] = text.split(/[\s/]+/).filter(Boolean);
  const v4 = parseIPv4(addr);
  const v6 = v4 === null ? parseIPv6(addr) : null;
  if (v4 === null && v6 === null) return { error: 'address' };
  const family = v4 !== null ? 4 : 6;
  const ip = v4 ?? v6;
  const max = family === 4 ? 32 : 128;

  if (rest === undefined) return { family, ip, prefix: max };
  if (/^\d{1,3}$/.test(rest)) {
    const prefix = Number(rest);
    return prefix > max ? { error: 'prefix' } : { family, ip, prefix };
  }
  if (family === 4) {
    const mask = parseIPv4(rest);
    if (mask === null) return { error: 'mask' };
    const direct = maskToPrefix(mask);
    if (direct !== null) return { family, ip, prefix: direct };
    const wildcard = maskToPrefix(BigInt.asUintN(32, ~mask)); // masque joker : 0.0.0.255
    return wildcard === null ? { error: 'mask' } : { family, ip, prefix: wildcard };
  }
  return { error: 'mask' };
}

// --- Description d'un réseau ---

// [adresse, préfixe, clé de type] : le premier qui contient l'adresse l'emporte (du plus précis au plus large)
const TYPES_V4 = [
  ['255.255.255.255', 32, 'broadcast'],
  ['0.0.0.0', 8, 'unspecified'],
  ['127.0.0.0', 8, 'loopback'],
  ['10.0.0.0', 8, 'private'],
  ['172.16.0.0', 12, 'private'],
  ['192.168.0.0', 16, 'private'],
  ['100.64.0.0', 10, 'cgnat'],
  ['169.254.0.0', 16, 'linkLocal'],
  ['192.0.0.0', 24, 'reserved'],
  ['192.0.2.0', 24, 'documentation'],
  ['198.51.100.0', 24, 'documentation'],
  ['203.0.113.0', 24, 'documentation'],
  ['198.18.0.0', 15, 'benchmark'],
  ['224.0.0.0', 4, 'multicast'],
  ['240.0.0.0', 4, 'reserved'],
];
const TYPES_V6 = [
  ['::1', 128, 'loopback'],
  ['::', 128, 'unspecified'],
  ['::ffff:0:0', 96, 'ipv4Mapped'],
  ['64:ff9b::', 96, 'nat64'],
  ['2001:db8::', 32, 'documentation'],
  ['2001::', 32, 'teredo'],
  ['fc00::', 7, 'ula'],
  ['fe80::', 10, 'linkLocal'],
  ['ff00::', 8, 'multicast'],
  ['2000::', 3, 'globalUnicast'],
];

export function classify(family, ip) {
  const table = family === 4 ? TYPES_V4 : TYPES_V6;
  const bits = bitsOf(family);
  for (const [addr, prefix, type] of table) {
    const base = family === 4 ? parseIPv4(addr) : parseIPv6(addr);
    const shift = bits - BigInt(prefix);
    if (ip >> shift === base >> shift) return type;
  }
  return family === 4 ? 'public' : 'reserved';
}

const classOf = (ip) => {
  const first = Number(ip >> 24n);
  return first < 128 ? 'A' : first < 192 ? 'B' : first < 224 ? 'C' : first < 240 ? 'D' : 'E';
};

const binary4 = (n) => [24n, 16n, 8n, 0n].map((s) => Number((n >> s) & 255n).toString(2).padStart(8, '0')).join('.');

export function reverseName(family, ip) {
  if (family === 4) return `${[0n, 8n, 16n, 24n].map((s) => Number((ip >> s) & 255n)).join('.')}.in-addr.arpa`;
  return `${expandIPv6(ip).replace(/:/g, '').split('').reverse().join('.')}.ip6.arpa`;
}

/** Tout ce qu'on peut dire d'un réseau (ou d'une adresse) : bornes, masque, nombre d'hôtes, type, binaire, DNS inverse. */
export function describeNetwork({ family, ip, prefix }) {
  const bits = Number(bitsOf(family));
  const size = pow2(bits - prefix);
  const network = ip & ~(size - 1n) & (pow2(bits) - 1n);
  const last = network + size - 1n;
  const base = {
    family,
    prefix,
    address: formatAddress(family, ip),
    network: formatAddress(family, network),
    last: formatAddress(family, last),
    total: size,
    type: classify(family, ip),
    networkType: classify(family, network),
    reverse: reverseName(family, ip),
    ipValue: ip,
    networkValue: network,
    lastValue: last,
  };
  if (family === 6) {
    return {
      ...base,
      expanded: expandIPv6(ip),
      networkExpanded: expandIPv6(network),
      subnets64: prefix <= 64 ? pow2(64 - prefix) : null,
      first: formatAddress(6, network),
      hosts: size,
    };
  }
  const point = prefix === 31;
  const single = prefix === 32;
  const usable = single ? 1n : point ? 2n : size - 2n;
  const firstHost = single || point ? network : network + 1n;
  const lastHost = single || point ? last : last - 1n;
  const mask = prefixToMask(prefix);
  return {
    ...base,
    mask: formatIPv4(mask),
    wildcard: formatIPv4(BigInt.asUintN(32, ~mask)),
    broadcast: prefix >= 31 ? null : formatIPv4(last),
    first: formatIPv4(firstHost),
    lastHost: formatIPv4(lastHost),
    hosts: usable,
    class: classOf(ip),
    binaryAddress: binary4(ip),
    binaryMask: binary4(mask),
    hex: `0x${ip.toString(16).padStart(8, '0')}`,
    integer: ip,
    pointToPoint: point,
    singleHost: single,
  };
}

// --- Découpage ---

/** Découpe un réseau en sous-réseaux de longueur `newPrefix` (au plus `limit` sont listés ; `count` donne le total). */
export function splitNetwork(net, newPrefix, limit = 256) {
  const max = net.family === 4 ? 32 : 128;
  if (!Number.isInteger(newPrefix) || newPrefix < net.prefix || newPrefix > max) return { error: 'prefix' };
  const total = pow2(newPrefix - net.prefix);
  const bits = Number(bitsOf(net.family));
  const step = pow2(bits - newPrefix);
  const start = describeNetwork(net).networkValue;
  const items = [];
  for (let i = 0n; i < total && i < BigInt(limit); i += 1n) {
    items.push(describeNetwork({ family: net.family, ip: start + i * step, prefix: newPrefix }));
  }
  return { count: total, items, truncated: total > BigInt(limit) };
}

/** « LAN-A:50 », « 120 », une demande par ligne ou séparée par des virgules / points-virgules. */
export function parseNeeds(text) {
  return String(text ?? '')
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line, i) => {
      const m = /^(?:(.*?)\s*[:=]\s*)?(\d+)$/.exec(line);
      return m ? { name: m[1] || `#${i + 1}`, hosts: Number(m[2]) } : { error: line };
    });
}

/** VLSM IPv4 : alloue des sous-réseaux de la plus grande demande à la plus petite, alignés, sans recouvrement. */
export function vlsm(net, needs) {
  if (net.family !== 4) return { error: 'ipv4only' };
  const parent = describeNetwork(net);
  const end = parent.networkValue + parent.total;
  let cursor = parent.networkValue;
  const allocations = [];
  const sorted = [...needs].sort((a, b) => b.hosts - a.hosts);
  for (const need of sorted) {
    if (need.hosts < 1) continue;
    const blockBits = Math.max(2, Math.ceil(Math.log2(need.hosts + 2))); // + adresse du réseau et de diffusion ; /30 au minimum
    const prefix = 32 - blockBits;
    if (prefix < net.prefix) return { error: 'tooBig', need };
    const size = pow2(blockBits);
    cursor = ((cursor + size - 1n) / size) * size; // alignement sur la taille du bloc
    if (cursor + size > end) return { error: 'noRoom', need, allocations };
    const sub = describeNetwork({ family: 4, ip: cursor, prefix });
    allocations.push({ name: need.name, needed: need.hosts, ...sub, wasted: Number(sub.hosts) - need.hosts });
    cursor += size;
  }
  return { allocations, free: end - cursor, parent };
}

// --- Appartenance et recouvrement ---

export function contains(net, ip) {
  const d = describeNetwork(net);
  return ip >= d.networkValue && ip <= d.lastValue;
}

export function overlaps(a, b) {
  if (a.family !== b.family) return false;
  const x = describeNetwork(a);
  const y = describeNetwork(b);
  return x.networkValue <= y.lastValue && y.networkValue <= x.lastValue;
}

