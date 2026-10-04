import { Cloud, Code, Headset, Network } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeading from '../SectionHeading';

// Une icône par catégorie, dans l'ordre de content.js (Systèmes, Messagerie, Web, Support).
const CATEGORY_ICONS = [Network, Cloud, Code, Headset];

export default function Skills({ t }) {
  return (
    <section id="skills" aria-labelledby="skills-title" className="reveal">
      <SectionHeading id="skills-title" icon={Code}>{t.skillsTitle}</SectionHeading>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {t.skills.map((skill, i) => {
          const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
          return (
            <li key={skill.category}>
              <Card glow solid className="h-full p-6">
                <span className="icon-tile mb-4" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mb-2 text-lg font-bold text-ink">{skill.category}</h3>
                <p className="text-copy text-body">{skill.items}</p>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
