import { ArrowRight, Wrench } from 'lucide-react';
import { LANGS } from '../../data/content';
import { TOOLS, toolPath, toolUi } from '../../data/tools/index';
import { DEFAULT_TOOL_ICON, TOOL_ICONS } from '../tools/icons';
import SectionHeading from '../SectionHeading';
import Card from '../ui/Card';

/** Accueil : les outils en ligne, un lien par outil. Pas de JavaScript côté client : la page « Outils » détaille chacun. */
export default function ToolsShowcase({ t, lang }) {
  return (
    <section id="tools" aria-labelledby="tools-title" className="reveal">
      <SectionHeading id="tools-title" icon={Wrench}>{t.tools.title}</SectionHeading>
      <p className="mb-6 max-w-3xl text-body">{t.tools.intro}</p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const ui = toolUi(tool, lang);
          const Icon = TOOL_ICONS[tool.icon] ?? DEFAULT_TOOL_ICON;
          return (
            <li key={tool.id}>
              <Card as="a" href={toolPath(tool, lang)} glow solid className="group flex h-full gap-4 p-5">
                <span className="icon-tile h-11 w-11 shrink-0" aria-hidden="true"><Icon className="h-6 w-6" /></span>
                <span className="min-w-0">
                  <h3 className="mb-1 font-bold text-ink transition-colors duration-200 group-hover:text-link">{ui.name}</h3>
                  <span className="block text-copy text-body">{ui.card}</span>
                </span>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="mt-4">
        <a href={LANGS[lang].tools} className="tap link inline-flex items-center gap-1.5">{t.tools.all} <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
      </p>
    </section>
  );
}
