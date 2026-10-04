import { Cloud, Code, Headset, Network } from 'lucide-react';
import SectionHeading from '../SectionHeading';

// Une icône par catégorie, dans l'ordre de content.js (Systèmes, Messagerie, Web, Support).
const CATEGORY_ICONS = [Network, Cloud, Code, Headset];

export default function Skills({ t }) {
  return (
    <section id="skills" aria-labelledby="skills-title" className="reveal scroll-mt-32">
      <SectionHeading id="skills-title" icon={Code}>{t.skillsTitle}</SectionHeading>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {t.skills.map((skill, i) => {
          const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
          return (
            <li key={skill.category} className="card-lift bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="w-5 h-5 shrink-0 text-emerald-400" aria-hidden="true" />
                <h3 className="text-white font-bold text-lg">{skill.category}</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{skill.items}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
