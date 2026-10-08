// Page d'un outil : pré-rendue au build (titre, explications, FAQ lisibles sans JavaScript) ; seul l'outil lui-même est hydraté.
import { LANGS } from '../../data/content';
import { HUB } from '../../data/tools/hub';
import { findTool, toolPath, toolUi } from '../../data/tools/index';
import { TOOL_ROOT_ID } from '../../lib/islands';
import Shell from '../Shell';
import Card from '../ui/Card';
import { TOOL_COMPONENTS } from './registry';

export default function ToolPage({ toolId, lang, posts = [] }) {
  const tool = findTool(toolId);
  const ui = toolUi(tool, lang);
  const hub = HUB[lang];
  const Tool = TOOL_COMPONENTS[toolId];
  const related = (ui.relatedLinks ?? []).map((slug) => posts.find((p) => p.slug === slug)).filter(Boolean);

  return (
    <Shell lang={lang} current="tools" wide switchHref={toolPath(tool, LANGS[lang].other)}>
      <nav aria-label={hub.breadcrumb.tools} className="mb-6">
        <ol className="flex flex-wrap items-center gap-x-2 text-sm text-body">
          <li><a href={LANGS[lang].home} className="tap link">{hub.breadcrumb.home}</a></li>
          <li aria-hidden="true">/</li>
          <li><a href={LANGS[lang].tools} className="tap link">{hub.breadcrumb.tools}</a></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{ui.name}</li>
        </ol>
      </nav>

      <h1 className="mb-4 text-title font-extrabold tracking-tight text-ink">{ui.h1}</h1>
      <p className="mb-8 max-w-3xl text-lg text-body">{ui.intro}</p>

      <div id={TOOL_ROOT_ID}>
        <Tool lang={lang} />
      </div>

      <section aria-labelledby="what-title" className="mt-16">
        <h2 id="what-title" className="mb-5 text-2xl font-bold tracking-tight text-ink">{ui.seo.whatTitle}</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {ui.seo.what.map(([name, text]) => (
            <li key={name}>
              <Card className="h-full p-5">
                <h3 className="mb-1 font-bold text-ink">{name}</h3>
                <p className="text-copy text-body">{text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-title" className="mt-12 max-w-3xl">
        <h2 id="how-title" className="mb-3 text-2xl font-bold tracking-tight text-ink">{ui.seo.howTitle}</h2>
        <p className="text-body">{ui.seo.how}</p>
      </section>

      <section aria-labelledby="faq-title" className="mt-12 max-w-3xl">
        <h2 id="faq-title" className="mb-4 text-2xl font-bold tracking-tight text-ink">FAQ</h2>
        <div className="space-y-3">
          {ui.seo.faq.map(([question, answer]) => (
            <Card key={question} as="details" className="group">
              <summary className="min-h-11 cursor-pointer select-none rounded-card px-5 py-3 font-semibold text-ink">{question}</summary>
              <p className="px-5 pb-4 text-body">{answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="privacy-title" className="mt-12 max-w-3xl">
        <h2 id="privacy-title" className="mb-3 text-2xl font-bold tracking-tight text-ink">{hub.privacyTitle}</h2>
        <p className="text-body">{ui.seo.privacy ?? ui.privacy}</p>
      </section>

      {related.length > 0 && (
        <aside aria-labelledby="related-title" className="mt-12 border-t border-line pt-8">
          <h2 id="related-title" className="mb-3 text-xl font-bold text-ink">{ui.related}</h2>
          <ul>
            {related.map((p) => (
              <li key={p.slug}>
                <a href={`${LANGS[lang].blog}${p.slug}/`} className="tap link">{p.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </Shell>
  );
}
