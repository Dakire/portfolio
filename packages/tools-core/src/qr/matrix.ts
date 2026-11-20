// Matrice d'un QR code : l'encodage (modes, correction d'erreur Reed-Solomon, masques) est fait par la bibliothèque qrcode-generator,
// jamais ici. Le texte est encodé en UTF-8 (accents, emojis).
import qrcode from 'qrcode-generator';

// Par défaut la bibliothèque convertit le texte en un octet par caractère (accents et emojis seraient corrompus) : on impose UTF-8.
qrcode.stringToBytes = (text: string): number[] => Array.from(new TextEncoder().encode(text));

export type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

/** Capacité maximale en octets (version 40, mode octets, norme ISO 18004). */
export const BYTE_CAPACITY: Record<ErrorLevel, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };

export interface QrMatrix {
  /** Nombre de modules par côté (sans zone de silence). */
  size: number;
  version: number;
  level: ErrorLevel;
  isDark: (row: number, col: number) => boolean;
}

export type MatrixResult = { ok: true; matrix: QrMatrix } | { ok: false; error: 'capacity' };

/** Un logo impose le niveau H : il masque des modules que la correction d'erreur doit reconstituer. */
export const effectiveLevel = (level: ErrorLevel, hasLogo: boolean): ErrorLevel =>
  hasLogo ? 'H' : level;

export function buildMatrix(text: string, level: ErrorLevel): MatrixResult {
  try {
    const qr = qrcode(0, level);
    qr.addData(text, 'Byte');
    qr.make();
    const size = qr.getModuleCount();
    return {
      ok: true,
      matrix: { size, version: (size - 17) / 4, level, isDark: (r, c) => qr.isDark(r, c) },
    };
  } catch {
    return { ok: false, error: 'capacity' };
  }
}
