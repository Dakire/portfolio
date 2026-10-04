import { Moon, Sun } from 'lucide-react';

// Bascule clair / sombre, pilotée par public/js/theme.js (data-theme-toggle) : fonctionne sur toutes les pages, hydratées ou non.
// Sans JavaScript elle est masquée et le thème suit le système. aria-pressed indique si le thème clair est actif.
export default function ThemeToggle({ label }) {
  return (
    <button type="button" data-theme-toggle aria-pressed="false" aria-label={label} className="btn btn-ghost btn-icon theme-toggle">
      <Sun className="theme-icon-sun h-5 w-5" aria-hidden="true" />
      <Moon className="theme-icon-moon h-5 w-5" aria-hidden="true" />
    </button>
  );
}
