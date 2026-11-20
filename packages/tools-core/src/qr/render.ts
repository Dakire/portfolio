// Rendu SVG d'une matrice de QR code : formes des modules, des trois repères, couleur ou dégradé, fond, logo.
// Pur et déterministe (une chaîne en sortie, aucun DOM) : le même code sert à l'aperçu, à l'export et aux tests de décodage.
import type { QrMatrix } from './matrix';

export type ModuleStyle = 'square' | 'rounded' | 'dots';
export type FinderStyle = 'square' | 'rounded' | 'dot';

export interface LogoOptions {
  /** Image PNG déjà rastérisée (data:image/png;base64,…) : un SVG importé n'est jamais inséré tel quel. */
  href: string;
  /** Côté du logo, en proportion du côté du QR code (0,10 à 0,35). */
  ratio: number;
  /** Marge vide autour du logo, en modules. */
  padding: number;
  /** Fond clair derrière le logo. */
  plate: boolean;
}

export interface RenderOptions {
  moduleStyle: ModuleStyle;
  finderStyle: FinderStyle;
  /** Couleur de premier plan, #rrggbb. */
  foreground: string;
  /** Seconde couleur du dégradé (même angle sur tout le code), #rrggbb. */
  gradient?: { to: string; angle: number };
  /** Couleur de fond #rrggbb, ou null pour un fond transparent. */
  background: string | null;
  /** Zone de silence, en modules (4 recommandés par la norme). */
  margin: number;
  /** Côté de l'image, en pixels (attributs width et height du SVG). */
  pixelSize: number;
  logo?: LogoOptions;
}

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const LOGO_RE = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

const color = (value: string, label: string): string => {
  if (!COLOR_RE.test(value)) throw new RangeError(`couleur invalide (${label})`);
  return value.toLowerCase();
};

const fmt = (n: number): string => String(Math.round(n * 1000) / 1000);

/** Boîte du logo, en modules, alignée sur la grille et centrée (même parité que la taille). */
export function logoBox(size: number, logo: LogoOptions): { start: number; side: number } {
  let side = Math.round(logo.ratio * size);
  if ((size - side) % 2 !== 0) side += 1;
  side = Math.max(1, Math.min(side, size));
  return { start: (size - side) / 2, side };
}

/** Rectangle à coins arrondis (rayon r) sous forme de chemin SVG. */
const roundedRect = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${fmt(x + r)} ${fmt(y)}h${fmt(w - 2 * r)}a${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(r)} ${fmt(r)}v${fmt(h - 2 * r)}a${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(-r)} ${fmt(r)}h${fmt(-(w - 2 * r))}a${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(-r)} ${fmt(-r)}v${fmt(-(h - 2 * r))}a${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(r)} ${fmt(-r)}z`;

const circle = (cx: number, cy: number, r: number): string =>
  `M${fmt(cx - r)} ${fmt(cy)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(2 * r)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-2 * r)} 0z`;

/** Un repère de position (7 × 7 modules) : anneau extérieur et carré central. */
function finderPath(style: FinderStyle, x: number, y: number): string {
  if (style === 'dot') {
    return `${circle(x + 3.5, y + 3.5, 3.5)}${circle(x + 3.5, y + 3.5, 2.5)}${circle(x + 3.5, y + 3.5, 1.5)}`;
  }
  if (style === 'rounded') {
    return `${roundedRect(x, y, 7, 7, 2)}${roundedRect(x + 1, y + 1, 5, 5, 1)}${roundedRect(x + 2, y + 2, 3, 3, 0.8)}`;
  }
  return `M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z M${x + 2} ${y + 2}h3v3h-3z`;
}

export function renderSvg(matrix: QrMatrix, options: RenderOptions): string {
  const { size } = matrix;
  const fg = color(options.foreground, 'premier plan');
  const bg = options.background === null ? null : color(options.background, 'fond');
  const to = options.gradient ? color(options.gradient.to, 'dégradé') : null;
  const margin = Math.max(0, Math.min(20, Math.round(options.margin)));
  const total = size + 2 * margin;

  const inFinder = (r: number, c: number): boolean =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  let cleared: { start: number; end: number } | null = null;
  let logoMarkup = '';
  if (options.logo) {
    if (!LOGO_RE.test(options.logo.href))
      throw new RangeError('logo invalide (PNG en data URL attendu)');
    const box = logoBox(size, options.logo);
    const pad = Math.max(0, options.logo.padding);
    cleared = { start: box.start - pad, end: box.start + box.side + pad };
    const plate =
      options.logo.plate || bg !== null
        ? `<rect x="${fmt(margin + cleared.start)}" y="${fmt(margin + cleared.start)}" width="${fmt(cleared.end - cleared.start)}" height="${fmt(cleared.end - cleared.start)}" fill="${bg ?? '#ffffff'}"/>`
        : '';
    logoMarkup = `${options.logo.plate ? plate : ''}<image href="${options.logo.href}" x="${fmt(margin + box.start)}" y="${fmt(margin + box.start)}" width="${box.side}" height="${box.side}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  const hidden = (r: number, c: number): boolean =>
    cleared !== null &&
    c + 0.5 > cleared.start &&
    c + 0.5 < cleared.end &&
    r + 0.5 > cleared.start &&
    r + 0.5 < cleared.end;

  const dark = (r: number, c: number): boolean =>
    r >= 0 &&
    c >= 0 &&
    r < size &&
    c < size &&
    matrix.isDark(r, c) &&
    !inFinder(r, c) &&
    !hidden(r, c);

  let path = '';
  if (options.moduleStyle === 'square') {
    for (let r = 0; r < size; r++) {
      let c = 0;
      while (c < size) {
        if (!dark(r, c)) {
          c++;
          continue;
        }
        let end = c;
        while (end < size && dark(r, end)) end++;
        path += `M${c} ${r}h${end - c}v1h${-(end - c)}z`;
        c = end;
      }
    }
  } else if (options.moduleStyle === 'dots') {
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (dark(r, c)) path += circle(c + 0.5, r + 0.5, 0.5);
  } else {
    const k = 0.46; // rayon des coins exposés
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!dark(r, c)) continue;
        const up = dark(r - 1, c);
        const down = dark(r + 1, c);
        const left = dark(r, c - 1);
        const right = dark(r, c + 1);
        const tl = !up && !left ? k : 0;
        const tr = !up && !right ? k : 0;
        const br = !down && !right ? k : 0;
        const bl = !down && !left ? k : 0;
        const x = c;
        const y = r;
        path +=
          `M${fmt(x + tl)} ${y}H${fmt(x + 1 - tr)}` +
          (tr ? `a${k} ${k} 0 0 1 ${k} ${k}` : '') +
          `V${fmt(y + 1 - br)}` +
          (br ? `a${k} ${k} 0 0 1 ${-k} ${k}` : '') +
          `H${fmt(x + bl)}` +
          (bl ? `a${k} ${k} 0 0 1 ${-k} ${-k}` : '') +
          `V${fmt(y + tl)}` +
          (tl ? `a${k} ${k} 0 0 1 ${k} ${-k}` : '') +
          'z';
      }
    }
  }
  const finders = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ]
    .map(([x, y]) => finderPath(options.finderStyle, x!, y!))
    .join('');

  let defs = '';
  let fill = fg;
  if (to && options.gradient) {
    const a = (options.gradient.angle * Math.PI) / 180;
    const half = total / 2;
    const dx = Math.cos(a) * half;
    const dy = Math.sin(a) * half;
    defs = `<defs><linearGradient id="qg" gradientUnits="userSpaceOnUse" x1="${fmt(half - dx)}" y1="${fmt(half - dy)}" x2="${fmt(half + dx)}" y2="${fmt(half + dy)}"><stop offset="0" stop-color="${fg}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`;
    fill = 'url(#qg)';
  }
  const px = Math.max(16, Math.round(options.pixelSize));
  const background = bg ? `<rect width="${total}" height="${total}" fill="${bg}"/>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${px}" height="${px}">` +
    defs +
    background +
    `<g transform="translate(${margin} ${margin})" fill="${fill}"><path d="${path}"/><path fill-rule="evenodd" d="${finders}"/></g>` +
    logoMarkup +
    '</svg>'
  );
}
