// Vérification du sitemap en ligne, par de vraies requêtes GET (pas HEAD) et sans suivre les redirections.
//   pnpm --filter @grichard/web sitemap:check                       # https://grichard.eu
//   pnpm --filter @grichard/web sitemap:check -- https://exemple.fr
// Contrôle : robots.txt déclare /sitemap.xml ; /sitemap.xml répond 200 en XML, est un <urlset> valide ; chaque URL répond 200 sans
// redirection, sans noindex (balise ou en-tête), avec une canonique égale à elle-même. Code de retour non nul au premier écart.
const origin = (
  process.argv.slice(2).find((a) => a.startsWith('http')) ?? 'https://grichard.eu'
).replace(/\/$/, '');
const UA = 'grichard.eu sitemap-check (+https://grichard.eu/)';
const problems = [];

const get = (url) => fetch(url, { redirect: 'manual', headers: { 'user-agent': UA } });

const robots = await get(`${origin}/robots.txt`);
const declared = [...(await robots.text()).matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1]);
console.log(`robots.txt : ${robots.status}, Sitemap déclaré : ${declared.join(', ') || 'aucun'}`);
if (!declared.includes(`${origin}/sitemap.xml`))
  problems.push('robots.txt ne déclare pas /sitemap.xml');

const res = await get(`${origin}/sitemap.xml`);
const type = res.headers.get('content-type') ?? '';
const xml = await res.text();
console.log(`/sitemap.xml : ${res.status}, ${type}, ${xml.length} octets`);
if (res.status !== 200) problems.push(`/sitemap.xml répond ${res.status}`);
if (!/\b(application|text)\/xml\b/.test(type)) problems.push(`/sitemap.xml servi en « ${type} »`);
if (!xml.startsWith('<?xml')) problems.push('/sitemap.xml ne commence pas par la déclaration XML');
if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'))
  problems.push('/sitemap.xml n’est pas un <urlset> à l’espace de noms sitemaps.org');
if (!xml.trimEnd().endsWith('</urlset>')) problems.push('/sitemap.xml est tronqué');

const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (new Set(locs).size !== locs.length) problems.push('URL en double dans le sitemap');
console.log(`${locs.length} URL à vérifier…`);

let checked = 0;
for (const loc of locs) {
  if (!loc.startsWith(`${origin}/`)) {
    problems.push(`${loc} : hors du site`);
    continue;
  }
  const page = await get(loc);
  const html = await page.text();
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  const robotsMeta = /<meta name="robots" content="([^"]+)"/.exec(html)?.[1] ?? '';
  const header = page.headers.get('x-robots-tag') ?? '';
  if (page.status !== 200)
    problems.push(`${loc} : ${page.status} ${page.headers.get('location') ?? ''}`);
  else if (canonical !== loc) problems.push(`${loc} : canonique ${canonical ?? 'absente'}`);
  else if (/noindex/i.test(robotsMeta + header)) problems.push(`${loc} : noindex`);
  checked++;
}

console.log(`${checked} URL vérifiées.`);
if (problems.length) {
  console.error(`\n${problems.length} problème(s) :\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('Sitemap conforme.');
