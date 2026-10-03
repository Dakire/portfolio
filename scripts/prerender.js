// Pré-rend <App /> (FR) dans dist/index.html pour que le contenu soit lisible sans JavaScript.
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const file = new URL('../dist/index.html', import.meta.url);
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
  const html = await readFile(file, 'utf-8');
  if (!html.includes('<div id="root"></div>')) throw new Error('Conteneur #root introuvable dans dist/index.html');
  await writeFile(file, html.replace('<div id="root"></div>', () => `<div id="root">${render()}</div>`));
  console.log('Pré-rendu injecté dans dist/index.html');
} finally {
  await vite.close();
}
