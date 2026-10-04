// Page « Outils » : la liste des outils, en cartes. Pré-rendue, sans JavaScript côté client.
import { ArrowRight, Binary, Calculator, Diff, KeyRound, Mail, Network, Scissors } from 'lucide-react';
import { LANGS } from '../../data/content';
import { HUB } from '../../data/tools/hub';
import { TOOLS, toolPath, toolUi } from '../../data/tools/index';
import Shell from '../Shell';
import Card from '../ui/Card';

const ICONS = { network: Network, scissors: Scissors, diff: Diff, mail: Mail, calculator: Calculator, binary: Binary, key: KeyRound };

export default function ToolsHub({ lang }) {
  const hub = HUB[lang];
  return (
    <Shell lang={lang} current="tools" wide switchHref={LANGS[LANGS[lang].other].tools}>
      <nav aria-label={hub.breadcrumb.tools} className="mb-6">
        <ol className="flex flex-wrap items-center gap-x-2 text-sm text-body">
          <li><a href={LANGS[lang].home} className="tap link">{hub.breadcrumb.home}</a></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{hub.breadcrumb.tools}</li>
        </ol>
      </nav>

      <h1 className="mb-4 text-title font-extrabold tracking-tight text-ink">{hub.h1}</h1>
      <p className="mb-10 max-w-3xl text-lg text-body">{hub.intro}</p>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const ui = toolUi(tool, lang);
          const Icon = ICONS[tool.icon] ?? Network;
          return (
            <li key={tool.id}>
              <Card as="a" href={toolPath(tool, lang)} glow solid className="group flex h-full flex-col p-6">
                <span className="icon-tile mb-4 h-11 w-11" aria-hidden="true"><Icon className="h-6 w-6" /></span>
                <h2 className="mb-2 text-lg font-bold text-ink transition-colors duration-200 group-hover:text-link">{ui.name}</h2>
                <p className="mb-5 flex-1 text-copy text-body">{ui.card}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-link">
                  {hub.open} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Card>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="privacy-title" className="mt-14 max-w-3xl">
        <h2 id="privacy-title" className="mb-3 text-2xl font-bold tracking-tight text-ink">{hub.privacyTitle}</h2>
        <p className="text-body">{hub.privacy}</p>
      </section>
    </Shell>
  );
}
