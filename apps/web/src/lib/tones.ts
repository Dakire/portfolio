// Tons des cartes colorées (classes .band-* de packages/ui) : deux tons qui alternent, pas plus.
export const TONES = ['petrole', 'olive'] as const;
export const tone = (i: number) => TONES[i % TONES.length];
