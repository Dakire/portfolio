// Assemble la livraison (dossier release/) à partir du site construit et de l'API PHP, dans la disposition de l'hébergement OVH :
//
//   production                     préproduction
//   release/.ovhconfig             (aucun)
//   release/www/                   release/www/preprod/
//   release/app/api/               release/app/preprod/api/
//
// private/ (configuration, secrets, état) n'est JAMAIS livré : il n'existe que sur le serveur.
// Le script refuse d'assembler tout ce qui ne doit pas partir en ligne (page de style, secrets, mauvaise cible…).
//
// Usage : node scripts/deploy/assemble.mjs <production|preprod|portal> [--portal apps/portal --build-id <id>] [--dist apps/web/dist] [--api apps/api] [--out release]
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Fichiers et dossiers qui n'ont rien à faire sur un serveur public. */
const FORBIDDEN = [
  /(^|\/)\.env(\.|$)/,
  /(^|\/)contact\.config\.php$/,
  /(^|\/)config\.php$/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)\.cache(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /\.(map|sqlite|sqlite3|db|bak|old|log|pem|key)$/,
  /(^|\/)\.htpasswd$/,
];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

const exists = (path) =>
  stat(path).then(
    () => true,
    () => false,
  );

/** Vérifie le site construit avant de le livrer. @returns {Promise<string[]>} les problèmes trouvés (vide = livrable) */
export async function verifyBuild(dist, target) {
  const problems = [];
  const need = async (file, why) => {
    if (!(await exists(join(dist, file)))) problems.push(`${file} manquant (${why})`);
  };
  await need('index.html', 'accueil');
  await need('404.html', 'page 404');
  await need('.htaccess', 'généré par le build : CSP, en-têtes, redirections');
  await need('.well-known/security.txt', 'contact sécurité');
  await need('.well-known/ai-catalog.json', 'catalogue IA');
  if (await exists(join(dist, 'design')))
    problems.push('design/ présent : la page de style (STYLEGUIDE=1) ne doit pas être livrée');

  const index = (await exists(join(dist, 'index.html')))
    ? await readFile(join(dist, 'index.html'), 'utf-8')
    : '';
  const noindex = /<meta name="robots" content="noindex/.test(index);
  const htaccess = (await exists(join(dist, '.htaccess')))
    ? await readFile(join(dist, '.htaccess'), 'utf-8')
    : '';
  if (target === 'production') {
    if (noindex)
      problems.push(
        'la page d’accueil est en noindex : build de préproduction livré en production ?',
      );
    if (/RewriteBase \/preprod\//.test(htaccess))
      problems.push('.htaccess de préproduction dans une livraison de production');
    if (/data-base=/.test(index))
      problems.push('data-base présent : build avec SITE_BASE livré en production');
  } else {
    if (!noindex) problems.push('la préproduction doit être en noindex (PUBLIC_NOINDEX=1)');
    if (!/RewriteBase \/preprod\//.test(htaccess))
      problems.push('.htaccess sans RewriteBase /preprod/ : build sans SITE_BASE=/preprod/ ?');
    if (!/data-base="\/preprod"/.test(index))
      problems.push('liens non préfixés par /preprod : build sans SITE_BASE=/preprod/ ?');
  }

  for (const file of await walk(dist)) {
    const rel = relative(dist, file).replaceAll('\\', '/');
    if (FORBIDDEN.some((re) => re.test(rel))) problems.push(`fichier interdit : ${rel}`);
  }
  return problems;
}

/** Vérifie l'API PHP prête à livrer (vendor/ installé sans dépendances de développement). */
export async function verifyApi(api) {
  const problems = [];
  if (!(await exists(join(api, 'vendor', 'autoload.php'))))
    problems.push(
      'vendor/autoload.php manquant : lancer composer install --no-dev --classmap-authoritative',
    );
  if (await exists(join(api, 'vendor', 'phpunit')))
    problems.push('vendor/phpunit présent : l’API doit être installée avec --no-dev');
  if (!(await exists(join(api, 'public', 'contact.php'))))
    problems.push('public/contact.php manquant');
  return problems;
}

/** Vérifie le portail Symfony prêt à livrer (vendor/ sans dépendances de développement, aucun état local). */
export async function verifyPortal(portal) {
  const problems = [];
  for (const file of [
    'vendor/autoload.php',
    'public/index.php',
    'public/.htaccess',
    'public/portal.css',
    'composer.json',
  ])
    if (!(await exists(join(portal, file)))) problems.push(`${file} manquant`);
  if (await exists(join(portal, 'vendor', 'phpunit')))
    problems.push('vendor/phpunit présent : le portail doit être installé avec --no-dev');
  for (const local of ['var', '.env', '.env.local', 'config/reference.php'])
    if (await exists(join(portal, local)))
      problems.push(`${local} présent : état local, à ne pas livrer`);
  return problems;
}

/** Livraison du portail : app/portal/ (code) et www/espace/ (point d'entrée). Jamais d'état ni de base de données. */
async function assemblePortal({ portal, out, buildId }) {
  const problems = await verifyPortal(portal);
  if (problems.length) throw new Error(`Livraison refusée :\n- ${problems.join('\n- ')}`);
  await rm(out, { recursive: true, force: true });
  const code = join(out, 'app', 'portal');
  const web = join(out, 'www', 'espace');
  await mkdir(code, { recursive: true });
  await mkdir(web, { recursive: true });
  for (const dir of ['src', 'config', 'templates', 'migrations', 'vendor'])
    await cp(join(portal, dir), join(code, dir), { recursive: true });
  await cp(join(portal, 'composer.json'), join(code, 'composer.json'));
  await writeFile(join(code, 'BUILD_ID'), `${buildId}\n`);
  for (const file of ['index.php', '.htaccess', 'portal.css'])
    await cp(join(portal, 'public', file), join(web, file));
  return { web, code };
}

export async function assemble({ target, dist, api, out, portal, buildId = 'local' }) {
  if (target === 'portal') return assemblePortal({ portal, out, buildId });
  if (target !== 'production' && target !== 'preprod')
    throw new Error(`cible inconnue : ${target}`);
  const problems = [...(await verifyBuild(dist, target)), ...(await verifyApi(api))];
  if (problems.length) throw new Error(`Livraison refusée :\n- ${problems.join('\n- ')}`);

  await rm(out, { recursive: true, force: true });
  const web = target === 'production' ? join(out, 'www') : join(out, 'www', 'preprod');
  const code =
    target === 'production' ? join(out, 'app', 'api') : join(out, 'app', 'preprod', 'api');

  await mkdir(web, { recursive: true });
  await cp(dist, web, { recursive: true });
  await cp(join(api, 'public', 'contact.php'), join(web, 'contact.php'));

  await mkdir(code, { recursive: true });
  await cp(join(api, 'src'), join(code, 'src'), { recursive: true });
  await cp(join(api, 'vendor'), join(code, 'vendor'), { recursive: true });
  await cp(join(api, 'composer.json'), join(code, 'composer.json'));

  if (target === 'production')
    await cp(join(ROOT, 'deploy', 'ovh', '.ovhconfig'), join(out, '.ovhconfig'));

  const leaked = (await walk(out))
    .map((f) => relative(out, f).replaceAll('\\', '/'))
    .filter((rel) => rel.startsWith('private/'));
  if (leaked.length) throw new Error(`private/ ne doit jamais être livré : ${leaked.join(', ')}`);
  return { web, code };
}

if (process.argv[1]?.endsWith('assemble.mjs')) {
  const [target, ...rest] = process.argv.slice(2);
  const option = (name, fallback) => {
    const i = rest.indexOf(`--${name}`);
    return resolve(ROOT, i >= 0 && rest[i + 1] ? rest[i + 1] : fallback);
  };
  try {
    const { web, code } = await assemble({
      target,
      dist: option('dist', 'apps/web/dist'),
      api: option('api', 'apps/api'),
      out: option('out', 'release'),
      portal: option('portal', 'apps/portal'),
      buildId: rest.includes('--build-id') ? rest[rest.indexOf('--build-id') + 1] : 'local',
    });
    console.log(
      `Livraison « ${target} » prête : ${relative(ROOT, web)}/ et ${relative(ROOT, code)}/`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
