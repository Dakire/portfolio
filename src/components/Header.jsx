import { useState, useEffect } from 'react';
import { Terminal, Globe, Menu, X } from 'lucide-react';
import { SECTION_IDS, LANGS } from '../data/content';

export default function Header({ t, lang }) {
  const [open, setOpen] = useState(false);
  const links = SECTION_IDS.map((id) => ({ id, label: t.nav[id] }));
  const other = LANGS[lang].other;

  // Échap ferme le menu mobile (attendu au clavier pour un menu déplié).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center gap-4">
        <a href="#home" aria-label={t.ui.home} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors rounded-lg px-1">
          <Terminal className="w-6 h-6" aria-hidden="true" />
          <span className="font-mono font-bold tracking-tight text-white hidden sm:block">GR_PORTFOLIO</span>
        </a>

        <nav aria-label={t.ui.menu} className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-200">
          {links.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="rounded px-1 py-1 hover:text-emerald-400 transition-colors">{label}</a>
          ))}
          <a href={LANGS[lang].blog} className="rounded px-1 py-1 hover:text-emerald-400 transition-colors">{t.nav.blog}</a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={LANGS[other].home}
            hrefLang={other}
            lang={other}
            aria-label={t.ui.switchLang}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-600 text-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <Globe className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span aria-hidden="true">{other.toUpperCase()}</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t.ui.closeMenu : t.ui.openMenu}
            className="md:hidden bg-slate-900 hover:bg-slate-800 border border-slate-600 text-slate-100 p-2 rounded-lg"
          >
            {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <nav id="mobile-nav" aria-label={t.ui.menu} hidden={!open} className="md:hidden border-t border-slate-800 bg-slate-950">
        <ul className="px-4 py-3 flex flex-col text-slate-100 font-medium">
          {links.map(({ id, label }) => (
            <li key={id}>
              <a href={`#${id}`} onClick={() => setOpen(false)} className="block rounded px-2 py-3 hover:bg-slate-900 hover:text-emerald-400">{label}</a>
            </li>
          ))}
          <li>
            <a href={LANGS[lang].blog} className="block rounded px-2 py-3 hover:bg-slate-900 hover:text-emerald-400">{t.nav.blog}</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
