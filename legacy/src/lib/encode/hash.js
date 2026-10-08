// Empreintes : SHA-1/256/384/512 via SubtleCrypto (rapide, natif) et MD5 en JavaScript pur (SubtleCrypto ne l'offre pas ;
// MD5 reste utile pour comparer des sommes de contrôle de fichiers, mais n'est plus sûr contre un attaquant).
import { bytesToHex } from './text.js';

export const ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

const K = Uint32Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32));
const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;

/** MD5 (RFC 1321) d'un tableau d'octets -> 16 octets. */
export function md5(bytes) {
  const length = bytes.length;
  const padded = new Uint8Array((((length + 8) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, (length << 3) >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(length / 2 ** 29), true);

  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let offset = 0; offset < padded.length; offset += 64) {
    const m = Array.from({ length: 16 }, (_, i) => view.getUint32(offset + i * 4, true));
    let [a, b, c, d] = [a0, b0, c0, d0];
    for (let i = 0; i < 64; i += 1) {
      let f;
      let g;
      if (i < 16) [f, g] = [(b & c) | (~b & d), i];
      else if (i < 32) [f, g] = [(d & b) | (~d & c), (5 * i + 1) % 16];
      else if (i < 48) [f, g] = [b ^ c ^ d, (3 * i + 5) % 16];
      else [f, g] = [c ^ (b | ~d), (7 * i) % 16];
      f = (f + a + K[i] + m[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + rotl(f, S[i])) >>> 0;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }
  const out = new DataView(new ArrayBuffer(16));
  [a0, b0, c0, d0].forEach((v, i) => out.setUint32(i * 4, v, true));
  return new Uint8Array(out.buffer);
}

/** Empreinte hexadécimale d'octets avec l'algorithme demandé (MD5, SHA-1, SHA-256, SHA-384, SHA-512). */
export async function hashHex(algorithm, bytes) {
  if (algorithm === 'MD5') return bytesToHex(md5(bytes));
  return bytesToHex(new Uint8Array(await crypto.subtle.digest(algorithm, bytes)));
}

/** Compare deux empreintes (insensible à la casse, aux espaces et aux séparateurs « : »). */
export const sameHash = (a, b) => a.replace(/[\s:]/g, '').toLowerCase() === b.replace(/[\s:]/g, '').toLowerCase() && a.trim() !== '';
