// Grille des réalisations filtrable par domaine et par technologie (îlot Preact). Rendue côté serveur : sans JavaScript, tous les
// projets sont dans le HTML ; avec JavaScript, les filtres masquent les cartes (aria-pressed, compteur annoncé).
import { useState } from 'preact/hooks';

export interface GridProject {
  slug: string;
  title: string;
  desc: string;
  tags: string[];
  skill: string;
  category: string;
  url: string;
  href?: string;
  kind?: string;
}
interface Labels {
  category: string;
  tech: string;
  all: string;
  count: string; // « {n} réalisation(s) »
  open: string;
  external: string;
  empty: string;
}
interface Props {
  items: GridProject[];
  labels: Labels;
}

export default function ProjectGrid({ items, labels }: Props) {
  const [skill, setSkill] = useState('');
  const [tech, setTech] = useState('');

  const categories = [...new Map(items.map((p) => [p.skill, p.category])).entries()];
  const counts = new Map<string, number>();
  for (const p of items) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const techs = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([t]) => t);

  const shown = items.filter(
    (p) => (!skill || p.skill === skill) && (!tech || p.tags.includes(tech)),
  );

  const chip = (value: string, current: string, set: (v: string) => void, label: string) => (
    <button
      type="button"
      class="chip"
      aria-pressed={current === value}
      onClick={() => set(current === value ? '' : value)}
    >
      {label}
    </button>
  );

  return (
    <div class="pgrid">
      <div class="pgrid-filters">
        <div role="group" aria-label={labels.category} class="pgrid-group">
          {chip('', skill, setSkill, labels.all)}
          {categories.map(([id, name]) => chip(id, skill, setSkill, name))}
        </div>
        <div role="group" aria-label={labels.tech} class="pgrid-group">
          {techs.map((t) => chip(t, tech, setTech, t))}
        </div>
      </div>
      <p class="pgrid-count label" role="status">
        {labels.count.replace('{n}', String(shown.length))}
      </p>
      {shown.length === 0 ? (
        <p class="pgrid-empty">{labels.empty}</p>
      ) : (
        <ul class="pgrid-list" role="list">
          {shown.map((p) => (
            <li key={p.slug}>
              <article class="pcard">
                <p class="pcard-kicker">
                  {p.category}
                  {p.kind ? <span class="stamp stamp-pen">{p.kind}</span> : null}
                </p>
                <h2 class="pcard-title">
                  <a href={p.url}>{p.title}</a>
                </h2>
                <p class="pcard-desc">{p.desc}</p>
                <ul class="pcard-tags" role="list">
                  {p.tags.map((t) => (
                    <li>{t}</li>
                  ))}
                </ul>
                {p.href ? (
                  <p class="pcard-links">
                    <a href={p.href} rel="noopener">
                      GitHub<span class="visually-hidden"> {labels.external}</span>
                    </a>
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
