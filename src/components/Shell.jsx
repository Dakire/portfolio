// Gabarit des pages statiques (blog, mentions légales, 404) : rendu uniquement au build, sans JavaScript React côté client.
import Decor from './Decor';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';
import { PORTFOLIO_DATA } from '../data/content';

// switchHref : page équivalente dans l'autre langue (par défaut, l'accueil de l'autre langue). current : 'blog' pour marquer le lien Blog.
export default function Shell({ lang = 'fr', switchHref, current, children }) {
  const t = PORTFOLIO_DATA[lang];

  return (
    <div className="relative isolate min-h-dvh font-sans">
      <Decor />
      <a href="#main" className="skip-link">{t.ui.skip}</a>
      <SiteHeader t={t} lang={lang} current={current} switchHref={switchHref} />
      <main id="main" className="mx-auto max-w-3xl px-4 pb-8 pt-[calc(var(--header-h)+2.5rem)] sm:px-6">{children}</main>
      <SiteFooter t={t} lang={lang} />
    </div>
  );
}
