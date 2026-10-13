// pnpm reference:links : vérifie que les liens de documentation des index répondent (HTTP 2xx/3xx). Local uniquement, jamais en CI.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { OUT_DIR } from './lib.mjs';

const only = process.argv[2];
const urls = new Map();
for (const f of readdirSync(OUT_DIR).filter((n) => n.endsWith('.json') && n !== 'index.json')) {
  if (only && !f.startsWith(only)) continue;
  for (const e of JSON.parse(readFileSync(join(OUT_DIR, f), 'utf-8')).entries)
    urls.set(e.url.split('#')[0], f);
}
const queue = [...urls.keys()];
const bad = [];
async function worker() {
  for (let url = queue.pop(); url; url = queue.pop()) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok && res.status !== 429) bad.push(`${res.status} ${url} (${urls.get(url)})`);
    } catch (error) {
      bad.push(`ERR ${url} (${urls.get(url)}) ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(`${urls.size} URL vérifiées, ${bad.length} en échec.`);
for (const b of bad.sort()) console.log(b);
process.exitCode = bad.length ? 1 : 0;
