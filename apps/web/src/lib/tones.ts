// Teintes des bandeaux de section (classes .band-* de packages/ui) : une couleur par section, en cycle.
export const TONES = ['petrole', 'olive', 'prune', 'ocre', 'ardoise'] as const;
export const tone = (i: number) => TONES[i % TONES.length];
