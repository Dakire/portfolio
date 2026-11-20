// Garde-fous de lisibilité d'un QR code : chaque avertissement a un identifiant (le texte est dans l'interface).
import { BYTE_CAPACITY, type ErrorLevel } from './matrix';

export type WarningId =
  'contrast' | 'inverted' | 'transparent' | 'logoSize' | 'quietZone' | 'exportSize' | 'capacity';

export interface Warning {
  id: WarningId;
  /** error : le code risque de ne pas se lire (le téléchargement reste possible, mais l'interface le dit clairement). */
  severity: 'error' | 'warn';
  /** Valeur mesurée (rapport de contraste, pourcentage de surface, pixels par module…). */
  value?: number;
}

export const luminance = (hex: string): number => {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

export const contrastRatio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

export interface CheckInput {
  foreground: string;
  /** Seconde couleur du dégradé. */
  gradientTo?: string;
  background: string | null;
  /** Zone de silence en modules. */
  margin: number;
  /** Côté de l'export en pixels. */
  pixelSize: number;
  /** Modules par côté (sans zone de silence). */
  size: number;
  /** Côté du logo en proportion du côté du QR code, absent sans logo. */
  logoRatio?: number;
  bytes: number;
  level: ErrorLevel;
}

export const CONTRAST_MIN = 4;
/** Surface maximale du logo (proportion de la surface du code) au-delà de laquelle la lecture devient incertaine. */
export const LOGO_AREA_MAX = 0.2;

export function checkQr(input: CheckInput): Warning[] {
  const warnings: Warning[] = [];
  if (input.background === null) {
    warnings.push({ id: 'transparent', severity: 'warn' });
  } else {
    const stops = [input.foreground, ...(input.gradientTo ? [input.gradientTo] : [])];
    const ratio = Math.min(...stops.map((c) => contrastRatio(c, input.background!)));
    if (ratio < CONTRAST_MIN)
      warnings.push({ id: 'contrast', severity: 'error', value: Math.round(ratio * 10) / 10 });
    if (stops.some((c) => luminance(c) > luminance(input.background!)))
      warnings.push({ id: 'inverted', severity: 'warn' });
  }
  if (input.logoRatio !== undefined) {
    const area = input.logoRatio ** 2;
    if (area > LOGO_AREA_MAX)
      warnings.push({ id: 'logoSize', severity: 'error', value: Math.round(area * 100) });
  }
  if (input.margin < 4)
    warnings.push({
      id: 'quietZone',
      severity: input.margin < 2 ? 'error' : 'warn',
      value: input.margin,
    });
  const perModule = input.pixelSize / (input.size + 2 * input.margin);
  if (perModule < 4)
    warnings.push({
      id: 'exportSize',
      severity: perModule < 3 ? 'error' : 'warn',
      value: Math.round(perModule * 10) / 10,
    });
  if (input.bytes > BYTE_CAPACITY[input.level] * 0.9)
    warnings.push({
      id: 'capacity',
      severity: 'warn',
      value: Math.round((input.bytes / BYTE_CAPACITY[input.level]) * 100),
    });
  return warnings;
}
