// Saisie utilisateur -> nom de domaine ASCII (punycode) valide, ou une erreur explicite.
const LABEL = /^(?!-)[a-z0-9_-]{1,63}(?<!-)$/;

/** Accepte un domaine, une URL, une adresse e-mail ou un nom avec point final ; les noms internationaux deviennent du punycode. */
export function normalizeDomain(input) {
  let s = String(input ?? '').trim().toLowerCase();
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // protocole
  s = s.replace(/^.*@/, ''); // adresse e-mail : on garde le domaine
  s = s.split(/[/?#:\s]/)[0]; // chemin, requête, port
  s = s.replace(/\.+$/, '');
  if (!s) return { error: 'empty' };

  let ascii;
  try {
    ascii = new URL(`http://${s}/`).hostname;
  } catch {
    return { error: 'invalid' };
  }
  if (/^\d+(\.\d+){3}$/.test(ascii) || ascii.includes(':')) return { error: 'ip' };
  const labels = ascii.split('.');
  if (labels.length < 2 || ascii.length > 253 || !labels.every((l) => LABEL.test(l))) return { error: 'invalid' };
  if (/^\d+$/.test(labels.at(-1))) return { error: 'invalid' };
  return { domain: ascii };
}

/** Sélecteurs DKIM saisis (séparés par virgule, espace ou point-virgule). */
export function parseSelectors(input) {
  const list = String(input ?? '')
    .toLowerCase()
    .split(/[\s,;]+/)
    .map((s) => s.replace(/\._domainkey.*$/, ''))
    .filter((s) => /^[a-z0-9_.-]{1,63}$/.test(s));
  return [...new Set(list)].slice(0, 8);
}

// Domaine d'organisation (RFC 7489 §3.2), sans liste complète des suffixes publics : les suffixes à deux niveaux courants suffisent ici.
const SECOND_LEVEL = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'me.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'co.jp', 'ne.jp', 'or.jp', 'com.br', 'com.cn', 'com.tr',
  'co.za', 'com.mx', 'co.in', 'com.sg', 'com.hk', 'co.kr', 'asso.fr', 'gouv.fr', 'nom.fr', 'com.fr', 'tm.fr', 'prd.fr', 'presse.fr', 'avocat.fr',
]);

export function orgDomain(domain) {
  const labels = domain.split('.');
  const two = labels.slice(-2).join('.');
  return SECOND_LEVEL.has(two) ? labels.slice(-3).join('.') : two;
}
