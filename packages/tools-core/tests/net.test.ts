import { describe, expect, it } from 'vitest';
import {
  classify,
  compressIPv6,
  contains,
  describeNetwork,
  expandIPv6,
  formatIPv4,
  maskToPrefix,
  overlaps,
  parseCidr,
  parseIPv4,
  parseIPv6,
  parseNeeds,
  prefixToMask,
  reverseName,
  splitNetwork,
  vlsm,
} from '../src/net/cidr.js';

const net = (text) => {
  const parsed = parseCidr(text);
  expect(parsed.error, text).toBeUndefined();
  return parsed;
};
const describe4 = (text) => describeNetwork(net(text));

describe('adresses', () => {
  it('lit et écrit IPv4', () => {
    expect(formatIPv4(parseIPv4('192.168.1.10'))).toBe('192.168.1.10');
    for (const bad of ['256.1.1.1', '1.2.3', '1.2.3.4.5', '01.2.3.4', 'a.b.c.d', ''])
      expect(parseIPv4(bad), bad).toBeNull();
  });

  it('lit, étend et compresse IPv6 (RFC 5952)', () => {
    expect(compressIPv6(parseIPv6('2001:0db8:0000:0000:0000:ff00:0042:8329'))).toBe(
      '2001:db8::ff00:42:8329',
    );
    expect(compressIPv6(parseIPv6('::1'))).toBe('::1');
    expect(compressIPv6(parseIPv6('::'))).toBe('::');
    expect(compressIPv6(parseIPv6('fe80:0:0:0:0:0:0:1'))).toBe('fe80::1');
    expect(compressIPv6(parseIPv6('2001:db8:0:1:0:0:0:1'))).toBe('2001:db8:0:1::1'); // la plus longue suite de zéros
    expect(compressIPv6(parseIPv6('2001:db8:0:0:1:0:0:1'))).toBe('2001:db8::1:0:0:1'); // à égalité, la première
    expect(expandIPv6(parseIPv6('2001:db8::1'))).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(compressIPv6(parseIPv6('::ffff:192.0.2.1'))).toBe('::ffff:c000:201');
    for (const bad of ['2001:db8::1::2', '1:2:3:4:5:6:7:8:9', 'g::1', '12345::', ':::'])
      expect(parseIPv6(bad), bad).toBeNull();
  });
});

describe('masques et saisies', () => {
  it('convertit masque et préfixe dans les deux sens', () => {
    expect(maskToPrefix(parseIPv4('255.255.255.0'))).toBe(24);
    expect(maskToPrefix(parseIPv4('255.255.255.192'))).toBe(26);
    expect(maskToPrefix(parseIPv4('255.255.255.255'))).toBe(32);
    expect(maskToPrefix(parseIPv4('0.0.0.0'))).toBe(0);
    expect(maskToPrefix(parseIPv4('255.0.255.0'))).toBeNull(); // non contigu
    expect(formatIPv4(prefixToMask(20))).toBe('255.255.240.0');
    expect(formatIPv4(prefixToMask(0))).toBe('0.0.0.0');
  });

  it.each([
    ['192.168.1.10/24', 4, 24],
    ['192.168.1.10 255.255.255.0', 4, 24],
    ['192.168.1.0/255.255.255.192', 4, 26],
    ['192.168.1.0/0.0.0.63', 4, 26], // masque joker
    ['10.0.0.1', 4, 32],
    ['2001:db8::/32', 6, 32],
    ['::1', 6, 128],
    ['  172.16.0.0 / 12 ', 4, 12],
  ])('%s -> IPv%i /%i', (input, family, prefix) =>
    expect(parseCidr(input)).toMatchObject({ family, prefix }),
  );

  it.each([
    ['', 'empty'],
    ['pas une adresse', 'address'],
    ['10.0.0.1/33', 'prefix'],
    ['2001:db8::/129', 'prefix'],
    ['10.0.0.1/255.0.255.0', 'mask'],
    ['10.0.0.1/abc', 'mask'],
  ])('refuse « %s » (%s)', (input, error) => expect(parseCidr(input).error).toBe(error));
});

describe("description d'un réseau IPv4", () => {
  it('192.168.1.10/24', () => {
    const d = describe4('192.168.1.10/24');
    expect(d).toMatchObject({
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      first: '192.168.1.1',
      lastHost: '192.168.1.254',
      mask: '255.255.255.0',
      wildcard: '0.0.0.255',
      hosts: 254n,
      total: 256n,
      class: 'C',
      type: 'private',
    });
    expect(d.binaryAddress).toBe('11000000.10101000.00000001.00001010');
    expect(d.binaryMask).toBe('11111111.11111111.11111111.00000000');
    expect(d.reverse).toBe('10.1.168.192.in-addr.arpa');
    expect(d.hex).toBe('0xc0a8010a');
  });

  it('cas limites : /30, /31 (point à point), /32, /0', () => {
    expect(describe4('172.16.5.6/30')).toMatchObject({
      network: '172.16.5.4',
      broadcast: '172.16.5.7',
      first: '172.16.5.5',
      lastHost: '172.16.5.6',
      hosts: 2n,
    });
    expect(describe4('10.0.0.0/31')).toMatchObject({
      hosts: 2n,
      broadcast: null,
      first: '10.0.0.0',
      lastHost: '10.0.0.1',
      pointToPoint: true,
    });
    expect(describe4('8.8.8.8/32')).toMatchObject({
      hosts: 1n,
      singleHost: true,
      first: '8.8.8.8',
      total: 1n,
    });
    expect(describe4('1.2.3.4/0')).toMatchObject({
      network: '0.0.0.0',
      broadcast: '255.255.255.255',
      total: 2n ** 32n,
    });
  });

  it('classes et types', () => {
    expect(describe4('10.1.2.3/8')).toMatchObject({ class: 'A', type: 'private' });
    expect(describe4('172.20.1.1/16')).toMatchObject({ class: 'B', type: 'private' });
    expect(classify(4, parseIPv4('172.32.0.1'))).toBe('public');
    expect(classify(4, parseIPv4('127.0.0.1'))).toBe('loopback');
    expect(classify(4, parseIPv4('169.254.10.1'))).toBe('linkLocal');
    expect(classify(4, parseIPv4('100.64.0.1'))).toBe('cgnat');
    expect(classify(4, parseIPv4('224.0.0.1'))).toBe('multicast');
    expect(classify(4, parseIPv4('203.0.113.9'))).toBe('documentation');
    expect(classify(4, parseIPv4('8.8.8.8'))).toBe('public');
  });
});

describe("description d'un réseau IPv6", () => {
  it('2001:db8::/32', () => {
    const d = describeNetwork(net('2001:db8::/32'));
    expect(d).toMatchObject({
      network: '2001:db8::',
      last: '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff',
      total: 2n ** 96n,
      subnets64: 2n ** 32n,
      type: 'documentation',
    });
  });

  it('types et nom inverse', () => {
    expect(classify(6, parseIPv6('fe80::1'))).toBe('linkLocal');
    expect(classify(6, parseIPv6('fd12:3456::1'))).toBe('ula');
    expect(classify(6, parseIPv6('2606:4700::1111'))).toBe('globalUnicast');
    expect(classify(6, parseIPv6('ff02::1'))).toBe('multicast');
    expect(classify(6, parseIPv6('::1'))).toBe('loopback');
    expect(reverseName(6, parseIPv6('2001:db8::1'))).toBe(
      '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
    );
  });

  it('un /64 a un seul sous-réseau /64', () => {
    expect(describeNetwork(net('2001:db8:1:2::5/64')).subnets64).toBe(1n);
    expect(describeNetwork(net('2001:db8:1:2::5/80')).subnets64).toBeNull();
  });
});

describe('découpage', () => {
  it('découpe en sous-réseaux égaux', () => {
    const r = splitNetwork(net('192.168.0.0/24'), 26);
    expect(r.count).toBe(4n);
    expect(r.items.map((s) => `${s.network}/${s.prefix}`)).toEqual([
      '192.168.0.0/26',
      '192.168.0.64/26',
      '192.168.0.128/26',
      '192.168.0.192/26',
    ]);
    expect(r.items[1]).toMatchObject({
      first: '192.168.0.65',
      broadcast: '192.168.0.127',
      hosts: 62n,
    });
  });

  it('plafonne la liste mais donne le total, et refuse un préfixe plus court', () => {
    const r = splitNetwork(net('10.0.0.0/8'), 24, 10);
    expect(r.count).toBe(65536n);
    expect(r.items).toHaveLength(10);
    expect(r.truncated).toBe(true);
    expect(splitNetwork(net('10.0.0.0/24'), 16).error).toBe('prefix');
    expect(splitNetwork(net('10.0.0.0/24'), 33).error).toBe('prefix');
    expect(splitNetwork(net('2001:db8::/32'), 36).items[1].network).toBe('2001:db8:1000::');
  });
});

describe('VLSM', () => {
  it('alloue du plus grand au plus petit, alignés et sans recouvrement', () => {
    const r = vlsm(net('192.168.0.0/24'), parseNeeds('Serveurs:10, Ventes:100, Compta:50, IT:25'));
    expect(r.error).toBeUndefined();
    expect(r.allocations.map((a) => [a.name, `${a.network}/${a.prefix}`, a.wasted])).toEqual([
      ['Ventes', '192.168.0.0/25', 26],
      ['Compta', '192.168.0.128/26', 12],
      ['IT', '192.168.0.192/27', 5],
      ['Serveurs', '192.168.0.224/28', 4],
    ]);
    expect(r.free).toBe(16n); // 192.168.0.240/28 reste libre
  });

  it('signale ce qui ne tient pas', () => {
    expect(vlsm(net('192.168.0.0/24'), parseNeeds('200, 100')).error).toBe('noRoom');
    expect(vlsm(net('192.168.0.0/26'), parseNeeds('100')).error).toBe('tooBig');
    expect(vlsm(net('2001:db8::/32'), parseNeeds('10')).error).toBe('ipv4only');
  });

  it('lit les besoins', () => {
    expect(parseNeeds('LAN A: 50\n120; Wi-Fi=30, nimportequoi')).toEqual([
      { name: 'LAN A', hosts: 50 },
      { name: '#2', hosts: 120 },
      { name: 'Wi-Fi', hosts: 30 },
      { error: 'nimportequoi' },
    ]);
  });
});

describe('appartenance et recouvrement', () => {
  it('teste si une adresse est dans un réseau', () => {
    expect(contains(net('192.168.1.0/24'), parseIPv4('192.168.1.200'))).toBe(true);
    expect(contains(net('192.168.1.0/24'), parseIPv4('192.168.2.1'))).toBe(false);
    expect(contains(net('2001:db8::/32'), parseIPv6('2001:db8:abcd::1'))).toBe(true);
  });

  it('détecte le recouvrement de deux réseaux', () => {
    expect(overlaps(net('10.0.0.0/8'), net('10.5.0.0/16'))).toBe(true);
    expect(overlaps(net('10.0.0.0/24'), net('10.0.1.0/24'))).toBe(false);
    expect(overlaps(net('10.0.0.0/24'), net('2001:db8::/32'))).toBe(false);
  });
});
