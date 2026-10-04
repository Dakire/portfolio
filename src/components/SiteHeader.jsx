import { Globe, Menu, Search, Terminal, X } from 'lucide-react';
import { LANGS, SECTION_IDS } from '../data/content';
import ThemeToggle from './ui/ThemeToggle';

/**
 * En-tête commun à toutes les pages (accueil, blog, mentions légales, 404). Rendu au build, sans React côté client :
 * le menu mobile, le surlignage de section et la bascule de thème sont gérés par public/js/nav.js et theme.js.
 *  - onHome : sur l'accueil les liens sont des ancres (#about) ; ailleurs ils pointent vers l'accueil (/#about).
 *  - current : 'blog' marque le lien Blog comme page courante.
 *  - switchHref : cible du sélecteur de langue (la traduction de la page, sinon l'accueil de l'autre langue).
 */
export default function SiteHeader({ t, lang, onHome = false, current, switchHref }) {
  const { ui, nav } = t;
  const home = LANGS[lang].home;
  const other = LANGS[lang].other;
  const base = onHome ? '' : home;
  const links = [
    ...SECTION_IDS.map((id) => ({ id, label: nav[id], href: `${base}#${id}`, spy: onHome })),
    { id: 'blog', label: nav.blog, href: LANGS[lang].blog, current: current === 'blog' },
    { id: 'tools', label: nav.tools, href: LANGS[lang].dns, current: current === 'tools' },
  ];

  return (
    <header className="site-header">
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
        <a href={onHome ? '#home' : home} aria-label={ui.home} className="flex min-h-11 items-center gap-2.5 rounded-xl pr-2 text-ink">
          <span className="icon-tile h-9 w-9" aria-hidden="true">
            <Terminal className="h-5 w-5" />
          </span>
          <span className="hidden font-mono font-bold tracking-tight sm:block">{ui.logo}</span>
        </a>

        <nav aria-label={ui.menu} className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <a key={l.id} href={l.href} data-spy={l.spy ? '' : undefined} aria-current={l.current ? 'page' : undefined} className="nav-link">{l.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <a
            href={switchHref ?? LANGS[other].home}
            hrefLang={other}
            lang={other}
            data-lang-switch
            aria-label={ui.switchLang}
            className="btn btn-secondary gap-1.5 px-3"
          >
            <Globe className="h-4 w-4 text-brand" aria-hidden="true" />
            <span aria-hidden="true">{other.toUpperCase()}</span>
          </a>
          <button type="button" data-palette-open aria-haspopup="dialog" aria-expanded="false" aria-label={ui.search} title={ui.search} className="btn btn-ghost btn-icon palette-trigger">
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          <ThemeToggle label={ui.theme} />
          <button
            type="button"
            data-nav-toggle
            data-label-open={ui.openMenu}
            data-label-close={ui.closeMenu}
            aria-expanded="false"
            aria-controls="mobile-nav"
            aria-label={ui.openMenu}
            className="btn btn-secondary btn-icon nav-toggle md:hidden"
          >
            <Menu className="icon-menu h-5 w-5" aria-hidden="true" />
            <X className="icon-close h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Menu mobile : affiché en clair sans JavaScript, replié ensuite (data-state piloté par nav.js) */}
      <nav id="mobile-nav" aria-label={`${ui.menu} (${ui.mobile})`} data-state="closed" className="nav-panel border-t border-line px-3 py-2 md:hidden">
        <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {links.map((l) => (
            <li key={l.id}>
              <a href={l.href} data-spy={l.spy ? '' : undefined} aria-current={l.current ? 'page' : undefined} className="nav-link w-full">{l.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="scroll-progress" aria-hidden="true" />
    </header>
  );
}
