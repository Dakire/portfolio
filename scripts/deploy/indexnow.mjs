// Notifie IndexNow (Bing, Yandex, etc.) des pages récemment modifiées. Google ne supporte pas IndexNow.
// Usage : node scripts/deploy/indexnow.mjs [jours=3]
// La clé est publique par conception (le fichier <clé>.txt est servi à la racine du site).
const KEY = 'e0c55f5a9a704cec86e7fbbabad8456c';
const HOST = 'grichard.eu';
const days = Number(process.argv[2] ?? 3);

const xml = await (await fetch(`https://${HOST}/root-access.xml`)).text();
const since = Date.now() - days * 86_400_000;
const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map((m) => ({
    loc: /<loc>(.*?)<\/loc>/.exec(m[1])?.[1],
    mod: /<lastmod>(.*?)<\/lastmod>/.exec(m[1])?.[1],
  }))
  .filter((u) => u.loc && u.mod && Date.parse(u.mod) >= since)
  .map((u) => u.loc);

if (urls.length === 0) {
  console.log('IndexNow : aucune page récente à notifier.');
  process.exit(0);
}
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  }),
});
console.log(`IndexNow : ${urls.length} URL, réponse ${res.status}`);
// Non bloquant : une notification ratée ne doit pas faire échouer la livraison.
