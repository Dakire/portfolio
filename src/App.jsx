import { PORTFOLIO_DATA } from './data/content';
import Decor from './components/Decor';
import { HeaderIsland } from './islands';
import { HEADER_ROOT_ID } from './lib/islands';
import Hero from './components/home/Hero';
import About from './components/home/About';
import Skills from './components/home/Skills';
import Experience from './components/home/Experience';
import Projects from './components/home/Projects';
import LatestPosts from './components/home/LatestPosts';
import EducationAndContact from './components/home/EducationAndContact';
import Footer from './components/home/Footer';

// Accueil. En production il est rendu au build (HTML statique) et seuls le menu et le formulaire sont hydratés
// (src/islands.jsx, src/main.jsx). La langue est portée par l'URL ('/' = fr, '/en/' = en), pas par un état.
export default function App({ lang = 'fr', posts = [] }) {
  const t = PORTFOLIO_DATA[lang];

  return (
    <div className="relative isolate min-h-screen text-slate-300 font-sans selection:bg-emerald-500/30">
      <Decor />
      <a href="#main" className="skip-link">{t.ui.skip}</a>
      <div id={HEADER_ROOT_ID}>
        <HeaderIsland lang={lang} ui={t.ui} nav={t.nav} />
      </div>

      <main id="main" className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 md:pt-32 pb-20 space-y-24 md:space-y-32">
        <Hero t={t} />
        <About t={t} />
        <Skills t={t} />
        <Experience t={t} />
        <Projects t={t} />
        <LatestPosts t={t} lang={lang} posts={posts} />
        <EducationAndContact t={t} lang={lang} />
      </main>

      <Footer t={t} lang={lang} />
    </div>
  );
}
