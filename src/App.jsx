import { LANGS, PORTFOLIO_DATA } from './data/content';
import Decor from './components/Decor';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import Hero from './components/home/Hero';
import About from './components/home/About';
import Skills from './components/home/Skills';
import Experience from './components/home/Experience';
import Projects from './components/home/Projects';
import LatestPosts from './components/home/LatestPosts';
import EducationAndContact from './components/home/EducationAndContact';
import { terminalData } from './lib/terminal/data';

// Accueil. En production il est rendu au build (HTML statique) et seul le formulaire de contact est hydraté
// (src/main.jsx). La langue est portée par l'URL ('/' = fr, '/en/' = en), pas par un état.
export default function App({ lang = 'fr', posts = [] }) {
  const t = PORTFOLIO_DATA[lang];

  return (
    <div className="relative isolate min-h-dvh font-sans">
      <Decor />
      <a href="#main" className="skip-link">{t.ui.skip}</a>
      <SiteHeader t={t} lang={lang} onHome switchHref={LANGS[LANGS[lang].other].home} />

      <main id="main" className="mx-auto max-w-6xl space-y-section px-4 pb-8 pt-[calc(var(--header-h)+2.5rem)] sm:px-6 2xl:max-w-7xl">
        <Hero t={t} lang={lang} terminal={terminalData(lang, t, posts)} />
        <About t={t} />
        <Skills t={t} />
        <Experience t={t} />
        <Projects t={t} />
        <LatestPosts t={t} lang={lang} posts={posts} />
        <EducationAndContact t={t} lang={lang} />
      </main>

      <SiteFooter t={t} lang={lang} />
    </div>
  );
}
