// Gabarit des pages statiques (blog, mentions légales, 404) : rendu uniquement au build, sans JavaScript côté client.
import { Terminal } from 'lucide-react';
import { LANGS, PORTFOLIO_DATA, PROFILE } from '../data/content';

const YEAR = new Date().getFullYear();
const link = 'rounded px-1 py-1 hover:text-emerald-400 transition-colors';

export default function Shell({ lang = 'fr', children }) {
  const t = PORTFOLIO_DATA[lang];
  const { home, legal } = LANGS[lang];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30">
      <a href="#main" className="skip-link">{t.ui.skip}</a>
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center gap-4">
          <a href={home} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors rounded-lg px-1">
            <Terminal className="w-6 h-6" aria-hidden="true" />
            <span className="font-mono font-bold tracking-tight text-white">GR_PORTFOLIO</span>
          </a>
          <nav aria-label={t.ui.menu} className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-slate-200">
            <a href={home} className={link}>Portfolio</a>
            <a href={LANGS[lang].blog} className={link}>{t.nav.blog}</a>
            <a href={`${home}#contact`} className={link}>{t.nav.contact}</a>
          </nav>
        </div>
      </header>
      <main id="main" className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">{children}</main>
      <footer className="border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-sm text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p>© {YEAR} {PROFILE.name} · {PROFILE.location}</p>
          <a href={home} className="underline underline-offset-2 hover:text-emerald-300">{t.ui.back}</a>
          <a href={legal} className="underline underline-offset-2 hover:text-emerald-300">{t.footer.legal}</a>
          <button type="button" data-consent-open className="underline underline-offset-2 hover:text-emerald-300 rounded">{t.ui.cookies}</button>
        </div>
      </footer>
    </div>
  );
}
