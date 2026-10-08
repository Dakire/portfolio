// Générateur de mots de passe : aléa cryptographique (crypto.getRandomValues) sans biais de modulo, jeux de caractères,
// mots de passe prononçables, codes PIN et estimation de l'entropie. Rien n'est stocké ni envoyé.

export const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
};
const AMBIGUOUS = /[O0oIl1|`'"]/g;

/** Entier uniforme dans [0, max[ : rejet des valeurs qui introduiraient un biais de modulo. */
export function randomInt(max) {
  if (!Number.isInteger(max) || max < 1 || max > 2 ** 32) throw new RangeError('max invalide');
  const limit = Math.floor(2 ** 32 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer);
  while (buffer[0] >= limit);
  return buffer[0] % max;
}

const pick = (chars) => chars[randomInt(chars.length)];

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Jeux de caractères actifs, après retrait des caractères ambigus si demandé. */
export function activeSets({ lower = true, upper = true, digits = true, symbols = false, avoidAmbiguous = false }) {
  const chosen = Object.entries({ lower, upper, digits, symbols }).filter(([, on]) => on).map(([name]) => SETS[name]);
  return avoidAmbiguous ? chosen.map((s) => s.replace(AMBIGUOUS, '')) : chosen;
}

/** Mot de passe aléatoire : au moins un caractère de chaque jeu choisi, puis mélange. */
export function generatePassword(options) {
  const length = Math.min(256, Math.max(4, Math.floor(options.length ?? 16)));
  const sets = activeSets(options);
  if (!sets.length) return '';
  const pool = sets.join('');
  const required = sets.slice(0, length).map(pick);
  const rest = Array.from({ length: length - required.length }, () => pick(pool));
  return shuffle([...required, ...rest]).join('');
}

const CONSONANTS = 'bcdfghjklmnprstvz';
const VOWELS = 'aeiou';

/** Mot de passe prononçable (consonne-voyelle) avec des chiffres : plus facile à retenir et à dicter, à entropie égale plus long. */
export function generatePronounceable({ syllables = 6, digits = 2, capitalize = true, separator = '' } = {}) {
  const parts = Array.from({ length: syllables }, () => pick(CONSONANTS) + pick(VOWELS));
  const words = [];
  for (let i = 0; i < parts.length; i += 3) words.push(parts.slice(i, i + 3).join(''));
  const text = words.map((w) => (capitalize ? w[0].toUpperCase() + w.slice(1) : w)).join(separator);
  return text + Array.from({ length: digits }, () => pick(SETS.digits)).join('');
}

export const generatePin = (length = 6) => Array.from({ length: Math.min(32, Math.max(3, length)) }, () => pick(SETS.digits)).join('');

/** Entropie (bits) : longueur x log2(taille du jeu de caractères). */
export const entropyBits = (poolSize, length) => (poolSize > 1 ? length * Math.log2(poolSize) : 0);

export const poolSizeOf = (options) => new Set(activeSets(options).join('')).size;
export const pronounceableEntropy = ({ syllables = 6, digits = 2 } = {}) => syllables * Math.log2(CONSONANTS.length * VOWELS.length) + digits * Math.log2(10);

/** Niveau de robustesse d'après l'entropie : 'veryWeak' | 'weak' | 'fair' | 'good' | 'strong'. */
export const strengthOf = (bits) => (bits < 28 ? 'veryWeak' : bits < 45 ? 'weak' : bits < 64 ? 'fair' : bits < 90 ? 'good' : 'strong');

/** Temps moyen d'une attaque par force brute (à `rate` essais par seconde), en secondes : 2^(bits - 1) / rate. */
export const crackSeconds = (bits, rate = 1e10) => 2 ** (bits - 1) / rate;
