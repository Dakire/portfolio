// pnpm reference:gam [chemin-du-wiki] : génère public/data/reference/gam.json à partir du wiki GAM (GAM-team/GAM.wiki.git).
// Sans argument, clone le wiki (profondeur 1) dans un dossier temporaire. Tourne uniquement en local.
// Licence : GAM est sous Apache 2.0 ; on ne garde que des extraits courts (syntaxe abrégée, première phrase) et un lien vers la page d'origine.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OUT_DIR, buildReference, readSources, serialize } from './lib.mjs';

const WIKI_URL = 'https://github.com/GAM-team/GAM/wiki';
const CLONE_URL = 'https://github.com/GAM-team/GAM.wiki.git';
const MAX_SYNTAX_LINES = 8;
const MAX_EXAMPLES = 4;

const SKIP =
  /^(00scratch|_Sidebar|README|Home|GamUpdates|GAM-Release-Process|Other-Resources|GAM-Public-Chat-Room|Upgrade-Benefits)\.md$/;

/** Catégorie d'une page du wiki d'après son nom de fichier (la première règle qui correspond l'emporte). */
const CATEGORY_RULES = [
  [
    'install',
    /^(How-to-|Install-GAM|Authorization|gam\.cfg|Using-GAM7|Running-GAM7|GAM-with-minimal|HTTPS-Proxy|SSL-Root|Google-Network|Verifying|GAM7-on-|Version-and-Help|GAM7-FAQ|GAM-Return-Codes|Downloads-Installs)/,
  ],
  ['drive', /^(Users-Drive|Users-Shared-Drives|Shared-Drives|Drive-|Find-File|Users-Forms-Drive)/],
  ['calendar', /^(Users-Calendars|Calendars|No-Owner)/],
  ['gmail', /^(Users-Gmail|Email-Audit|Send-Email)/],
  ['chrome', /^(Chrome|ChromeOS|Collections-of-ChromeOS|Mobile-Devices|Cloud-Identity-Devices)/],
  ['ou', /^Organizational-Units/],
  ['reports', /^(Reports|Alert-Center|Vault-Takeout|Google-Data-Transfers)/],
  ['licenses', /^Licenses/],
  ['groups', /^(Groups|Users-Group|Cloud-Identity-Groups)/],
  [
    'syntax',
    /^(Basic-Items|List|Bulk-Processing|Command-|CSV-|Meta-Commands|Permission-Matches|Tag-Replace|Todrive|BNF|Python-Regular|Collections-of-Items|Rclone|Scripts)/,
  ],
  [
    'services',
    /^(Users-(Forms|Keep|Meet|Chat|Tasks|YouTube|Classroom|Analytics|Data-Studio|Tag-Manager|Classification|Spreadsheets|Web-Resources|Photo|Profile-Photo|Gmail-CSE)|Classroom|Chat-Bot|Sites|Cloud-Storage|Resources|Resellers?|Cloud-Channel)/,
  ],
  [
    'users',
    /^(Users|Aliases|Collections-of-Users|Unmanaged|Addresses|Global-Address|Domain-People|Domain-Shared)/,
  ],
  [
    'admin',
    /^(Administrators|Customer|Domains|Domain-|Schemas|Context-Aware|Inbound-SSO|Cloud-Identity)/,
  ],
];
const categoryOf = (file) => CATEGORY_RULES.find(([, re]) => re.test(file))?.[0] ?? 'services';

const plain = (md) =>
  md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, (m) => (/^<\/?[a-z]+>$/i.test(m) ? '' : m))
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function excerpt(s, max = 200) {
  const t = plain(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max).replace(/\s+\S*$/, '');
  return `${cut}…`;
}

/** Ancre GitHub d'un intertitre : minuscules, ponctuation retirée, espaces en tirets. */
const anchor = (h) =>
  plain(h)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');

/** Nom court d'une syntaxe : « gam create user <EmailAddress> … » -> « gam create user ». */
function commandName(line) {
  const tokens = line.trim().split(/\s+/);
  const out = [];
  for (const [i, t] of tokens.entries()) {
    if (i >= 6) break;
    if (i >= 2 && /^[<[({]/.test(t)) break;
    if (i === 1 && /^[[(]/.test(t)) break;
    out.push(t);
  }
  return out.join(' ');
}

/** Variantes de recherche : « create|add » développé, « <UserTypeEntity> » remplacé par « user ». */
function aliasesOf(name) {
  let variants = [[]];
  for (const raw of name.replace(/<UserTypeEntity>/g, 'user').split(' ')) {
    const alts = /^[\w|]+$/.test(raw) ? raw.split('|') : [raw];
    variants = variants.flatMap((v) => alts.map((a) => [...v, a])).slice(0, 12);
  }
  return [...new Set(variants.map((v) => v.join(' ')))].filter((v) => v !== name).slice(0, 6);
}

function parsePage(file, text, ids) {
  const page = file.replace(/\.md$/, '');
  const pageTitle = page.replace(/-/g, ' ');
  const pageUrl = `${WIKI_URL}/${page}`;
  const cat = categoryOf(file);
  const lines = text.split(/\r?\n/);
  const entries = [];

  let heading = pageTitle;
  let hAnchor = '';
  let firstPara = '';
  let fence = null; // { lines, heading, anchor }
  let pendingDesc = null; // bloc dont on attend le paragraphe de description
  let lastSyntax = null; // dernière entrée de syntaxe sous l'intertitre courant

  const addEntry = (name, firstLine, blockLines, extra = {}) => {
    const key = `${page}:${name}`;
    const n = (ids.get(key) ?? 0) + 1;
    ids.set(key, n);
    const shown = blockLines.slice(0, MAX_SYNTAX_LINES);
    if (blockLines.length > MAX_SYNTAX_LINES) shown.push('  …');
    const entry = {
      name,
      cat,
      syn: firstLine.trim().replace(/\s+/g, ' ').slice(0, 220),
      alias: aliasesOf(name),
      ex: [shown.join('\n')],
      tags: [...new Set([plain(heading), pageTitle])],
      url: hAnchor ? `${pageUrl}#${hAnchor}` : pageUrl,
      ...extra,
    };
    entries.push(entry);
    return entry;
  };

  const flushBlock = (block) => {
    // Découpe le bloc en commandes : une ligne « gam … » en colonne 0 en ouvre une nouvelle.
    const cmds = [];
    for (const l of block.lines) {
      if (/^gam(\s|$)/.test(l)) cmds.push([l]);
      else if (cmds.length && l.trim()) cmds.at(-1).push(l);
    }
    for (const cmd of cmds) {
      const first = cmd[0];
      const isSyntax = /[<[(]/.test(first) || cmd.length > 1;
      if (isSyntax) {
        const name = commandName(first);
        if (name.split(' ').length < 2) continue;
        lastSyntax = addEntry(name, first, cmd);
        pendingDesc = lastSyntax;
      } else if (
        lastSyntax &&
        lastSyntax.url.startsWith(pageUrl) &&
        lastSyntax.tags[0] === plain(block.heading)
      ) {
        if (lastSyntax.ex.length < MAX_EXAMPLES + 1 && first.length <= 300)
          lastSyntax.ex.push(first);
      } else {
        const name = first
          .split(/\s+/)
          .slice(0, 4)
          .filter((t, i, a) => a.slice(0, i + 1).every((x) => /^[a-z][a-z_]*$/.test(x)))
          .join(' ');
        if (name.split(' ').length < 2 || first.length > 300) continue;
        lastSyntax = addEntry(name, first, [first]);
        lastSyntax.example = true;
        pendingDesc = lastSyntax;
      }
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (fence) {
      if (/^\s*```/.test(line)) {
        const block = fence;
        fence = null;
        flushBlock(block);
      } else fence.lines.push(line);
      continue;
    }
    if (/^\s*```/.test(line)) {
      fence = { lines: [], heading, anchor: hAnchor };
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      heading = plain(h[2]);
      hAnchor = anchor(h[2]);
      lastSyntax = null;
      pendingDesc = null;
      continue;
    }
    if (!line.trim()) continue;
    const prose =
      !/^\s*([-*+]|\d+\.)\s/.test(line) && !/^\s*[|>]/.test(line) && !/^\s*</.test(line);
    // La description d'une syntaxe est la ligne de texte qui la suit directement ; sinon on n'en met pas.
    if (pendingDesc && prose && !pendingDesc.desc) pendingDesc.desc = excerpt(line);
    pendingDesc = null;
    if (prose && !firstPara) firstPara = line;
  }

  // Page d'ensemble : titre de la page + première phrase.
  entries.unshift({
    name: pageTitle,
    cat,
    syn: excerpt(firstPara, 200) || pageTitle,
    alias: [],
    tags: ['page'],
    url: pageUrl,
  });
  return entries;
}

function main() {
  let wiki = process.argv[2];
  if (!wiki) {
    wiki = join(mkdtempSync(join(tmpdir(), 'gam-wiki-')), 'wiki');
    execFileSync('git', ['clone', '--depth', '1', CLONE_URL, wiki], { stdio: 'inherit' });
  }
  const files = readdirSync(wiki)
    .filter((f) => f.endsWith('.md') && !SKIP.test(f))
    .sort();
  const ids = new Map();
  const entries = files.flatMap((f) => parsePage(f, readFileSync(join(wiki, f), 'utf-8'), ids));
  const clean = entries.map(({ example: _e, ...e }) => {
    if (!e.alias?.length) delete e.alias;
    if (!e.desc && !e.syn) e.desc = e.name;
    return e;
  });

  const { source } = readSources().find((s) => s.file === 'gam.yml');
  const built = buildReference('gam.yml', { meta: source.meta, entries: clean });
  built.meta.generated = new Date().toISOString().slice(0, 10);
  writeFileSync(join(OUT_DIR, 'gam.json'), serialize(built));
  console.log(`GAM : ${built.entries.length} entrées de ${files.length} pages.`);
}

main();
