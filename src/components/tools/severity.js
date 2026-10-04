import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react';

// Gravité -> icône et couleur. Le texte « Erreur », « Avertissement »… est toujours présent à côté (la couleur ne porte jamais seule l'information).
export const SEVERITY = {
  ok: { icon: CircleCheck, color: 'text-link' },
  info: { icon: Info, color: 'text-info' },
  warn: { icon: TriangleAlert, color: 'text-warn' },
  error: { icon: CircleX, color: 'text-danger' },
};
