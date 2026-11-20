// Rendu SVG d'une matrice de QR code : forme des modules, contour et centre des trois repères, couleur ou dégradé, fond, logo.
// Pur et déterministe (une chaîne en sortie, aucun DOM) : le même code sert à l'aperçu, à l'export, aux vignettes du sélecteur
// de formes et aux tests de décodage.
import type { QrMatrix } from './matrix';

export const MODULE_STYLES = [
  'square',
  'soft',
  'rounded',
  'dots',
  'leaf',
  'vbars',
  'hbars',
] as const;
export const FINDER_OUTER_STYLES = [
  'square',
  'rounded',
  'squircle',
  'circle',
  'leaf',
  'drop',
  'chamfer',
] as const;
export const FINDER_INNER_STYLES = [
  'square',
  'rounded',
  'squircle',
  'circle',
  'leaf',
  'drop',
  'chamfer',
] as const;
export const LOGO_SHAPES = ['square', 'rounded', 'circle'] as const;

export type ModuleStyle = (typeof MODULE_STYLES)[number];
export type FinderOuterStyle = (typeof FINDER_OUTER_STYLES)[number];
export type FinderInnerStyle = (typeof FINDER_INNER_STYLES)[number];
export type LogoShape = (typeof LOGO_SHAPES)[number];

export interface LogoOptions {
  /** Image PNG déjà rastérisée (data:image/png;base64,…) : un SVG importé n'est jamais inséré tel quel. */
  href: string;
  /** Côté du logo, en proportion du côté du QR code (0,10 à 0,50). */
  ratio: number;
  /** Marge vide autour du logo, en modules. */
  padding: number;
  /** Fond clair derrière le logo. */
  plate: boolean;
  /** Forme du logo et de son fond : carré, angles arrondis ou rond. */
  shape: LogoShape;
}

export interface RenderOptions {
  moduleStyle: ModuleStyle;
  /** Contour (anneau 7 × 7) des trois repères de position. */
  finderOuter: FinderOuterStyle;
  /** Centre (3 × 3) des trois repères de position. */
  finderInner: FinderInnerStyle;
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
export function logoBox(
  size: number,
  logo: Pick<LogoOptions, 'ratio'>,
): { start: number; side: number } {
  let side = Math.round(logo.ratio * size);
  if ((size - side) % 2 !== 0) side += 1;
  side = Math.max(1, Math.min(side, size));
  return { start: (size - side) / 2, side };
}

/** Rayon des angles du logo (et de son fond) pour une boîte de côté `side`, en modules. */
export const logoRadius = (shape: LogoShape, side: number): number =>
  shape === 'circle' ? side / 2 : shape === 'rounded' ? side * 0.22 : 0;

interface Radii {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

/** Rectangle dont chaque coin a son propre rayon, sous forme de chemin SVG. */
function rect(x: number, y: number, w: number, h: number, r: Radii): string {
  const { tl, tr, br, bl } = r;
  return (
    `M${fmt(x + tl)} ${fmt(y)}H${fmt(x + w - tr)}` +
    (tr ? `a${fmt(tr)} ${fmt(tr)} 0 0 1 ${fmt(tr)} ${fmt(tr)}` : '') +
    `V${fmt(y + h - br)}` +
    (br ? `a${fmt(br)} ${fmt(br)} 0 0 1 ${fmt(-br)} ${fmt(br)}` : '') +
    `H${fmt(x + bl)}` +
    (bl ? `a${fmt(bl)} ${fmt(bl)} 0 0 1 ${fmt(-bl)} ${fmt(-bl)}` : '') +
    `V${fmt(y + tl)}` +
    (tl ? `a${fmt(tl)} ${fmt(tl)} 0 0 1 ${fmt(tl)} ${fmt(-tl)}` : '') +
    'z'
  );
}
const uniform = (r: number): Radii => ({ tl: r, tr: r, br: r, bl: r });

const circle = (cx: number, cy: number, r: number): string =>
  `M${fmt(cx - r)} ${fmt(cy)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(2 * r)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-2 * r)} 0z`;

/** Octogone : carré dont les quatre coins sont coupés de c. */
const chamfer = (x: number, y: number, w: number, h: number, c: number): string =>
  `M${fmt(x + c)} ${fmt(y)}H${fmt(x + w - c)}L${fmt(x + w)} ${fmt(y + c)}V${fmt(y + h - c)}L${fmt(x + w - c)} ${fmt(y + h)}H${fmt(x + c)}L${fmt(x)} ${fmt(y + h - c)}V${fmt(y + c)}z`;

type Dark = (row: number, col: number) => boolean;

/** Chemin de tous les modules de données, dans la forme choisie. */
function modulesPath(dark: Dark, size: number, style: ModuleStyle): string {
  let path = '';
  if (style === 'square') {
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
    return path;
  }
  if (style === 'vbars' || style === 'hbars') {
    const vertical = style === 'vbars';
    const at = (a: number, b: number): boolean => (vertical ? dark(b, a) : dark(a, b));
    for (let a = 0; a < size; a++) {
      let b = 0;
      while (b < size) {
        if (!at(a, b)) {
          b++;
          continue;
        }
        let end = b;
        while (end < size && at(a, end)) end++;
        const len = end - b;
        path += vertical
          ? rect(a + 0.03, b, 0.94, len, uniform(0.3))
          : rect(b, a + 0.03, len, 0.94, uniform(0.3));
        b = end;
      }
    }
    return path;
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!dark(r, c)) continue;
      if (style === 'dots') path += circle(c + 0.5, r + 0.5, 0.5);
      else if (style === 'soft') path += rect(c, r, 1, 1, uniform(0.22));
      else if (style === 'leaf') path += rect(c, r, 1, 1, { tl: 0.34, tr: 0, br: 0.34, bl: 0 });
      else {
        // « rounded » : seuls les coins exposés (sans voisin sur les deux côtés) sont arrondis
        const k = 0.46;
        const up = dark(r - 1, c);
        const down = dark(r + 1, c);
        const left = dark(r, c - 1);
        const right = dark(r, c + 1);
        path += rect(c, r, 1, 1, {
          tl: !up && !left ? k : 0,
          tr: !up && !right ? k : 0,
          br: !down && !right ? k : 0,
          bl: !down && !left ? k : 0,
        });
      }
    }
  }
  return path;
}

/** Contour d'un repère : anneau de 7 × 7 modules, épaisseur 1. */
function outerPath(style: FinderOuterStyle, x: number, y: number): string {
  switch (style) {
    case 'rounded':
      return rect(x, y, 7, 7, uniform(2)) + rect(x + 1, y + 1, 5, 5, uniform(1));
    case 'squircle':
      return rect(x, y, 7, 7, uniform(2.8)) + rect(x + 1, y + 1, 5, 5, uniform(1.8));
    case 'drop':
      return (
        rect(x, y, 7, 7, { tl: 3.5, tr: 3.5, br: 0, bl: 3.5 }) +
        rect(x + 1, y + 1, 5, 5, { tl: 2.5, tr: 2.5, br: 0, bl: 2.5 })
      );
    case 'circle':
      return circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
    case 'leaf':
      return (
        rect(x, y, 7, 7, { tl: 3, tr: 0, br: 3, bl: 0 }) +
        rect(x + 1, y + 1, 5, 5, { tl: 2, tr: 0, br: 2, bl: 0 })
      );
    case 'chamfer':
      return chamfer(x, y, 7, 7, 1.6) + chamfer(x + 1, y + 1, 5, 5, 0.8);
    default:
      return rect(x, y, 7, 7, uniform(0)) + rect(x + 1, y + 1, 5, 5, uniform(0));
  }
}

/** Centre d'un repère : carré de 3 × 3 modules, à l'intérieur du contour (origine du repère : x, y). */
function innerPath(style: FinderInnerStyle, x: number, y: number): string {
  const cx = x + 2;
  const cy = y + 2;
  switch (style) {
    case 'rounded':
      return rect(cx, cy, 3, 3, uniform(0.9));
    case 'circle':
      return circle(cx + 1.5, cy + 1.5, 1.5);
    case 'leaf':
      return rect(cx, cy, 3, 3, { tl: 1.3, tr: 0, br: 1.3, bl: 0 });
    case 'chamfer':
      return chamfer(cx, cy, 3, 3, 0.7);
    case 'squircle':
      return rect(cx, cy, 3, 3, uniform(1.2));
    case 'drop':
      return rect(cx, cy, 3, 3, { tl: 1.5, tr: 1.5, br: 0, bl: 1.5 });
    default:
      return rect(cx, cy, 3, 3, uniform(0));
  }
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
    if (!LOGO_SHAPES.includes(options.logo.shape)) throw new RangeError('forme de logo invalide');
    const box = logoBox(size, options.logo);
    const pad = Math.max(0, options.logo.padding);
    cleared = { start: box.start - pad, end: box.start + box.side + pad };
    const radius = logoRadius(options.logo.shape, box.side);
    const x = margin + box.start;
    const plateSide = cleared.end - cleared.start;
    const plate = options.logo.plate
      ? `<rect x="${fmt(margin + cleared.start)}" y="${fmt(margin + cleared.start)}" width="${fmt(plateSide)}" height="${fmt(plateSide)}" rx="${fmt(radius + pad)}" fill="${bg ?? '#ffffff'}"/>`
      : '';
    const clip =
      radius > 0
        ? `<clipPath id="ql"><rect x="${fmt(x)}" y="${fmt(x)}" width="${box.side}" height="${box.side}" rx="${fmt(radius)}"/></clipPath>`
        : '';
    logoMarkup = `${clip}${plate}<image href="${options.logo.href}" x="${fmt(x)}" y="${fmt(x)}" width="${box.side}" height="${box.side}" preserveAspectRatio="xMidYMid slice"${radius > 0 ? ' clip-path="url(#ql)"' : ''}/>`;
  }
  const hidden = (r: number, c: number): boolean =>
    cleared !== null &&
    c + 0.5 > cleared.start &&
    c + 0.5 < cleared.end &&
    r + 0.5 > cleared.start &&
    r + 0.5 < cleared.end;
  const dark: Dark = (r, c) =>
    r >= 0 &&
    c >= 0 &&
    r < size &&
    c < size &&
    matrix.isDark(r, c) &&
    !inFinder(r, c) &&
    !hidden(r, c);

  const path = modulesPath(dark, size, options.moduleStyle);
  const origins: [number, number][] = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];
  const finders = origins
    .map(([x, y]) => outerPath(options.finderOuter, x, y) + innerPath(options.finderInner, x, y))
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

// Motif de la vignette « corps » : quelques modules isolés, des groupes et des lignes, pour que chaque forme se distingue.
const THUMB_PATTERN = ['1101011', '1011101', '0111010', '1100111', '0101101', '1110010', '1011011'];

/** Vignette d'une forme (sélecteur visuel) : un SVG carré en #rrggbb sur fond transparent. */
export function shapeThumbnail(
  kind: 'body' | 'outer' | 'inner' | 'logo',
  id: string,
  fill = '#111111',
): string {
  const c = color(fill, 'vignette');
  let size = 7;
  let d = '';
  if (kind === 'body') {
    const dark: Dark = (r, col) => THUMB_PATTERN[r]?.[col] === '1';
    d = modulesPath(dark, 7, id as ModuleStyle);
  } else if (kind === 'outer') {
    d = outerPath(id as FinderOuterStyle, 0, 0);
  } else if (kind === 'inner') {
    size = 3;
    d = innerPath(id as FinderInnerStyle, -2, -2);
  } else {
    size = 7;
    d = rect(0, 0, 7, 7, uniform(logoRadius(id as LogoShape, 7)));
    if ((id as LogoShape) === 'circle') d = circle(3.5, 3.5, 3.5);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.3 -0.3 ${size + 0.6} ${size + 0.6}"><path fill="${c}" fill-rule="evenodd" d="${d}"/></svg>`;
}
