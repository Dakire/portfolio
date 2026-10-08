// Tests de l'assemblage de la livraison : node --test scripts/deploy
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { assemble, verifyBuild } from './assemble.mjs';

const write = async (root, file, content = '') => {
  const path = join(root, file);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
};

const HTACCESS_PROD = 'RewriteBase /\n';
const HTACCESS_PREPROD = 'RewriteBase /preprod/\n';
const INDEX_PROD = '<html lang="fr"><meta name="robots" content="index, follow">';
const INDEX_PREPROD =
  '<html lang="fr" data-base="/preprod"><meta name="robots" content="noindex, follow">';

async function fakeBuild(root, { preprod = false } = {}) {
  await write(root, 'index.html', preprod ? INDEX_PREPROD : INDEX_PROD);
  await write(root, '404.html');
  await write(root, '.htaccess', preprod ? HTACCESS_PREPROD : HTACCESS_PROD);
  await write(root, '.well-known/security.txt');
  await write(root, '.well-known/ai-catalog.json', '{}');
  await write(root, '_astro/app.abc123.js');
}

async function fakeApi(root) {
  await write(root, 'public/contact.php', '<?php');
  await write(root, 'src/Http/Request.php', '<?php');
  await write(root, 'vendor/autoload.php', '<?php');
  await write(root, 'composer.json', '{}');
}

describe('assemblage de la livraison', () => {
  let dir;
  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'release-'));
  });
  after(() => rm(dir, { recursive: true, force: true }));

  it('production : www/, app/api/ et .ovhconfig, sans private/', async () => {
    const [dist, api, out] = ['dist', 'api', 'out'].map((n) => join(dir, `prod-${n}`));
    await fakeBuild(dist);
    await fakeApi(api);
    await assemble({ target: 'production', dist, api, out });
    assert.equal(await readFile(join(out, 'www', 'index.html'), 'utf-8'), INDEX_PROD);
    await readFile(join(out, 'www', '.htaccess'));
    await readFile(join(out, 'www', 'contact.php'));
    await readFile(join(out, 'app', 'api', 'vendor', 'autoload.php'));
    assert.match(await readFile(join(out, '.ovhconfig'), 'utf-8'), /app\.engine\.version=8\.5/);
    await assert.rejects(readFile(join(out, 'private', 'config.php')));
  });

  it('préproduction : tout sous www/preprod/ et app/preprod/api/, jamais à la racine', async () => {
    const [dist, api, out] = ['dist', 'api', 'out'].map((n) => join(dir, `pre-${n}`));
    await fakeBuild(dist, { preprod: true });
    await fakeApi(api);
    await assemble({ target: 'preprod', dist, api, out });
    await readFile(join(out, 'www', 'preprod', 'index.html'));
    await readFile(join(out, 'www', 'preprod', 'contact.php'));
    await readFile(join(out, 'app', 'preprod', 'api', 'vendor', 'autoload.php'));
    await assert.rejects(readFile(join(out, 'www', 'index.html')));
    await assert.rejects(
      readFile(join(out, '.ovhconfig')),
      'la préproduction ne touche pas à .ovhconfig',
    );
  });

  it('refuse la page de style, les secrets, les cartes de source et une base de données', async () => {
    const dist = join(dir, 'bad-dist');
    await fakeBuild(dist);
    await write(dist, 'design/index.html');
    await write(dist, 'contact.config.php');
    await write(dist, '_astro/app.js.map');
    await write(dist, 'espace/data.sqlite');
    const problems = (await verifyBuild(dist, 'production')).join('\n');
    assert.match(problems, /design\//);
    assert.match(problems, /contact\.config\.php/);
    assert.match(problems, /app\.js\.map/);
    assert.match(problems, /data\.sqlite/);
  });

  it('refuse de livrer un build de préproduction en production, et inversement', async () => {
    const pre = join(dir, 'mix-pre');
    const prod = join(dir, 'mix-prod');
    await fakeBuild(pre, { preprod: true });
    await fakeBuild(prod);
    assert.ok((await verifyBuild(pre, 'production')).length >= 2);
    assert.ok((await verifyBuild(prod, 'preprod')).length >= 2);
    assert.deepEqual(await verifyBuild(prod, 'production'), []);
    assert.deepEqual(await verifyBuild(pre, 'preprod'), []);
  });

  it('refuse une API sans vendor/ ou installée avec les dépendances de développement', async () => {
    const [dist, api, out] = ['dist', 'api', 'out'].map((n) => join(dir, `api-${n}`));
    await fakeBuild(dist);
    await fakeApi(api);
    await write(api, 'vendor/phpunit/phpunit/composer.json');
    await assert.rejects(assemble({ target: 'production', dist, api, out }), /--no-dev/);
    await rm(join(api, 'vendor'), { recursive: true });
    await assert.rejects(
      assemble({ target: 'production', dist, api, out }),
      /autoload\.php manquant/,
    );
  });
});

describe('livraison du portail', () => {
  let dir;
  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'portal-'));
  });
  after(() => rm(dir, { recursive: true, force: true }));

  async function fakePortal(root) {
    for (const file of [
      'vendor/autoload.php',
      'src/Kernel.php',
      'config/bundles.php',
      'templates/base.html.twig',
      'migrations/Version1.php',
      'public/index.php',
      'public/.htaccess',
      'public/portal.css',
      'composer.json',
    ])
      await write(root, file, 'x');
  }

  it('range le code dans app/portal/ et le point d’entrée dans www/espace/', async () => {
    const portal = join(dir, 'portal');
    const out = join(dir, 'out');
    await fakePortal(portal);
    await assemble({ target: 'portal', portal, out, buildId: 'abc123' });
    await readFile(join(out, 'app', 'portal', 'vendor', 'autoload.php'));
    assert.equal(
      (await readFile(join(out, 'app', 'portal', 'BUILD_ID'), 'utf-8')).trim(),
      'abc123',
    );
    await readFile(join(out, 'www', 'espace', 'index.php'));
    await readFile(join(out, 'www', 'espace', '.htaccess'));
    await assert.rejects(readFile(join(out, 'app', 'portal', 'public', 'index.php')));
  });

  it('refuse un état local (var/, .env), les dépendances de dev et une installation incomplète', async () => {
    const portal = join(dir, 'bad');
    await fakePortal(portal);
    await write(portal, 'var/portal.sqlite');
    await write(portal, '.env.local');
    await write(portal, 'vendor/phpunit/phpunit/composer.json');
    await rm(join(portal, 'public', 'portal.css'));
    await assert.rejects(
      assemble({ target: 'portal', portal, out: join(dir, 'out2') }),
      (error) =>
        /var présent/.test(error.message) &&
        /\.env\.local présent/.test(error.message) &&
        /--no-dev/.test(error.message) &&
        /portal\.css manquant/.test(error.message),
    );
  });
});
