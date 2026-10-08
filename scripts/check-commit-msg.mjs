// Vérifie qu'un message de commit suit Conventional Commits : type(portée)?: sujet. Appelé par le hook commit-msg (lefthook.yml).
import { readFileSync } from 'node:fs';

const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];
const first = readFileSync(process.argv[2], 'utf-8').split('\n')[0];
const format = new RegExp(String.raw`^(${TYPES.join('|')})(\([a-z0-9-]+\))?!?: \S.{0,100}$`);
const ok = format.test(first) || /^(Merge|Revert) /.test(first);

if (!ok) {
  console.error(
    `Message de commit refusé : « ${first} »\nFormat attendu : type(portée): sujet   (types : ${TYPES.join(', ')})`,
  );
  process.exit(1);
}
