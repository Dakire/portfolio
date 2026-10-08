import { describe, expect, it } from 'vitest';
import { crc32, zipStore } from '../src/zip.js';

// Relecture minimale d'une archive : répertoire central, noms, tailles et CRC
function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const entries = [];
  for (let i = 0; i < count; i += 1) {
    expect(view.getUint32(offset, true)).toBe(0x02014b50);
    const crc = view.getUint32(offset + 16, true);
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const local = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    expect(view.getUint32(local, true)).toBe(0x04034b50);
    const dataStart =
      local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    entries.push({
      name,
      crc,
      size,
      data: bytes.subarray(dataStart, dataStart + size),
      utf8: (view.getUint16(offset + 8, true) & 0x0800) !== 0,
    });
    offset += 46 + nameLength;
  }
  return entries;
}

describe('crc32', () => {
  it('donne les valeurs de référence', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
    expect(crc32(new TextEncoder().encode('The quick brown fox jumps over the lazy dog'))).toBe(
      0x414fa339,
    );
  });
});

describe('zipStore', () => {
  it('écrit une archive relisible : noms UTF-8, contenu intact, CRC corrects', () => {
    const zip = zipStore([
      { name: 'agenda-2024.ics', data: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n' },
      { name: 'réunion été.ics', data: 'é😀' },
      { name: 'binaire.bin', data: new Uint8Array([0, 1, 2, 255]) },
      { name: 'vide.txt', data: '' },
    ]);
    const entries = readZip(zip);
    expect(entries.map((e) => e.name)).toEqual([
      'agenda-2024.ics',
      'réunion été.ics',
      'binaire.bin',
      'vide.txt',
    ]);
    expect(new TextDecoder().decode(entries[0].data)).toBe('BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n');
    expect(new TextDecoder().decode(entries[1].data)).toBe('é😀');
    expect([...entries[2].data]).toEqual([0, 1, 2, 255]);
    for (const e of entries) {
      expect(crc32(e.data)).toBe(e.crc);
      expect(e.utf8).toBe(true);
    }
  });

  it('gère une archive vide', () => {
    expect(readZip(zipStore([]))).toEqual([]);
  });
});
