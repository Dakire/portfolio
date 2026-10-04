import { useEffect, useRef, useState } from 'react';
import { TERMINAL } from '../../data/terminal';
import { complete, run } from '../../lib/terminal/commands';

const KIND = { accent: 'text-emerald-300', dim: 'text-slate-400', error: 'text-rose-300' };

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const currentTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

function Segment({ seg }) {
  if (seg.href) {
    const external = seg.external || /^https?:/.test(seg.href);
    return (
      <a href={seg.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="text-emerald-300 underline decoration-emerald-400/50 underline-offset-2 hover:text-emerald-200">
        {seg.t}
      </a>
    );
  }
  return <span className={KIND[seg.kind] ?? 'text-slate-200'}>{seg.t}</span>;
}

/**
 * Terminal de l'accueil : vraies commandes (help, skills, projects, blog, goto, theme…), historique, complétion par Tab.
 * Îlot hydraté. Accessible : champ étiqueté, résultats annoncés (role="log"), suggestions cliquables pour qui n'a pas de clavier,
 * et Tab ne piège jamais le focus (il ne complète que s'il y a quelque chose à compléter).
 * Les trois commandes d'accueil, tapées par CSS, sont décoratives (leur contenu est déjà dans la page) : masquées aux lecteurs d'écran.
 */
export default function InteractiveTerminal({ lang, data }) {
  const s = TERMINAL[lang];
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState([]);
  const [value, setValue] = useState('');
  const screenRef = useRef(null);
  const nextId = useRef(0);
  const history = useRef({ items: [], index: -1, draft: '' });

  // Avant l'hydratation, le champ est inactif : Entrée ne doit pas envoyer le formulaire (rechargement de la page)
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setReady(true);
  }, []);

  // Le défilement suit la dernière sortie, comme un vrai terminal
  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const perform = (action) => {
    if (!action) return;
    if (action.type === 'goto') {
      const target = document.getElementById(action.id);
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      else if (action.id === 'blog') window.location.href = data.paths.blog;
    } else if (action.type === 'theme') {
      if (currentTheme() !== action.value) document.querySelector('[data-theme-toggle]')?.click();
    } else if (action.type === 'open') {
      window.open(action.href, '_blank', 'noopener');
    } else if (action.type === 'navigate') {
      window.location.href = action.href;
    }
  };

  const exec = (raw) => {
    const input = raw.trim();
    if (!input) return;
    const h = history.current;
    if (h.items.at(-1) !== input) h.items.push(input);
    h.index = -1;

    const result = run(input, { s, d: data, theme: currentTheme() });
    if (result.action?.type === 'clear') setEntries([]);
    else setEntries((list) => [...list.slice(-30), { id: nextId.current++, input, lines: result.lines }]);
    perform(result.action);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    exec(value);
    setValue('');
  };

  const onKeyDown = (e) => {
    const h = history.current;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!h.items.length) return;
      e.preventDefault();
      if (h.index === -1) h.draft = value;
      h.index = e.key === 'ArrowUp' ? Math.min(h.items.length - 1, h.index === -1 ? h.items.length - 1 : h.index - 1) : h.index + 1;
      if (h.index >= h.items.length || h.index < -1) h.index = -1;
      setValue(h.index === -1 ? h.draft : h.items[h.index]);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      const done = complete(value);
      if (done !== null && done !== value) {
        e.preventDefault();
        setValue(done);
      } // sinon : Tab quitte le champ normalement (aucun piège clavier)
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  };

  return (
    <section aria-label={s.label} className="terminal-float w-full min-w-0 max-w-xl overflow-hidden rounded-card border border-slate-700 bg-slate-900 shadow-glow lg:justify-self-end">
      <div aria-hidden="true" className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-300" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <span className="ml-3 truncate font-mono text-xs text-slate-400">guillaume@grichard.eu: ~</span>
      </div>

      <div ref={screenRef} className="term-screen h-72 overflow-y-auto p-4 font-mono text-sm leading-relaxed sm:h-80">
        <div aria-hidden="true" className="space-y-3">
          {data.boot.map((l) => (
            <div key={l.cmd} className="term-line">
              <p className="text-slate-100"><span className="text-emerald-400">$</span> <span className="term-cmd">{l.cmd}</span></p>
              <p className="term-out break-words text-slate-300">{l.out}</p>
            </div>
          ))}
        </div>

        <div role="log" aria-label={s.log} aria-live="polite" className="mt-3 space-y-3">
          {entries.map((entry) => (
            <div key={entry.id}>
              <p className="break-words text-slate-100"><span aria-hidden="true" className="text-emerald-400">$</span> {entry.input}</p>
              {entry.lines.map((segments, i) => (
                <p key={i} className="whitespace-pre-wrap break-words">
                  {segments.map((seg, j) => <Segment key={j} seg={seg} />)}
                </p>
              ))}
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="term-prompt mt-3 flex items-center gap-2">
          <label htmlFor="term-input" className="sr-only">{s.inputLabel}</label>
          <span aria-hidden="true" className="text-emerald-400">$</span>
          <input
            id="term-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!ready}
            placeholder={s.placeholder}
            aria-describedby="term-hint"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            className="min-w-0 flex-1 bg-transparent py-2 text-slate-100 placeholder:text-slate-500 focus-visible:outline-none"
          />
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 bg-slate-950 px-3 py-3">
        {s.suggestions.map((cmd) => (
          <button key={cmd} type="button" disabled={!ready} onClick={() => exec(cmd)} className="term-chip">{cmd}</button>
        ))}
        <p id="term-hint" className="w-full text-xs text-slate-400 sm:ml-1 sm:w-auto">{s.hint}</p>
      </div>
    </section>
  );
}
