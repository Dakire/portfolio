// Garde-fou éditorial : un article publié ne contient jamais de marqueur « À COMPLÉTER » (emplacement du vécu de l'auteur),
// et chaque brouillon est bien un brouillon (draft: true) tant qu'il en contient.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src', 'content', 'blog');
const files = [
  ...readdirSync(ROOT)
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(ROOT, f)),
  ...readdirSync(join(ROOT, 'en'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(ROOT, 'en', f)),
];

describe('articles en brouillon', () => {
  it.each(files)('%s : aucun marqueur « À COMPLÉTER » dans un article publié', (file) => {
    const text = readFileSync(file, 'utf-8').replace(/\r\n/g, '\n');
    const front = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    const draft = /^draft:\s*true\s*$/m.test(front);
    if (!draft) expect(text, file).not.toMatch(/À COMPLÉTER|TO BE COMPLETED/);
  });
});
