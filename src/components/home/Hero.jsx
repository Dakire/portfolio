import { Download } from 'lucide-react';
import Button from '../ui/Button';
import Terminal from '../Terminal';

export default function Hero({ t }) {
  return (
    <section id="home" aria-labelledby="hero-title" className="grid min-h-[min(60dvh,38rem)] grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col items-start">
        <p className="mb-4 font-mono text-lg text-link">{t.hero.greeting}</p>
        <h1 id="hero-title" className="mb-4 text-display font-extrabold tracking-tight text-ink">
          Guillaume <span className="gradient-shift bg-linear-to-r from-brand to-accent bg-clip-text text-transparent">Richard.</span>
        </h1>
        <p className="caret-after mb-8 max-w-3xl text-lead font-bold text-body">{t.hero.role}</p>

        <div className="mt-2 flex flex-wrap gap-3">
          <Button href="#contact" size="lg">{t.hero.contactBtn}</Button>
          <Button href={t.hero.cvLink} target="_blank" rel="noopener noreferrer" variant="secondary" size="lg">
            <Download className="h-5 w-5" aria-hidden="true" />
            {t.hero.cvBtn}
            <span className="sr-only"> ({t.ui.cvOpen})</span>
          </Button>
        </div>
      </div>
      <Terminal lines={t.hero.terminal} />
    </section>
  );
}
