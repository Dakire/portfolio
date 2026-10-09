// Interface du terminal de l'accueil : branche l'interpréteur (commands.ts) sur le balisage de components/Terminal.astro.
// JavaScript sans dépendance, chargé en module externe (CSP). Sans JavaScript, le terminal reste une présentation statique
// suivie de liens. Accessibilité : champ étiqueté, sorties annoncées (role="log"), suggestions cliquables, Tab ne piège
// jamais le focus, aucune animation imposée, et un bouton pour désactiver le terminal (choix mémorisé).
import { complete, run, type Action, type Line, type TerminalData } from './commands';
import { TERMINAL } from './text';

const STORAGE_KEY = 'terminal';
const MAX_ENTRIES = 30;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const currentTheme = (): 'dark' | 'light' =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

const storedOff = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'off';
  } catch {
    return false;
  }
};
const storeOff = (off: boolean) => {
  try {
    if (off) localStorage.setItem(STORAGE_KEY, 'off');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // stockage indisponible : le choix vaut pour cette visite
  }
};

function renderLine(line: Line): HTMLElement {
  const p = document.createElement('p');
  for (const seg of line) {
    if (seg.href) {
      const a = document.createElement('a');
      a.href = seg.href;
      a.textContent = seg.t;
      if (seg.external) a.rel = 'noopener';
      p.append(a);
    } else {
      const span = document.createElement('span');
      span.textContent = seg.t;
      if (seg.kind) span.className = `term-${seg.kind}`;
      p.append(span);
    }
  }
  return p;
}

export function mountTerminal(root: HTMLElement): void {
  const raw = root.dataset.terminal;
  const screen = root.querySelector<HTMLElement>('[data-terminal-screen]');
  const log = root.querySelector<HTMLElement>('[data-terminal-log]');
  const form = root.querySelector<HTMLFormElement>('[data-terminal-form]');
  const input = root.querySelector<HTMLInputElement>('[data-terminal-input]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-terminal-toggle]');
  if (!raw || !screen || !log || !form || !input || !toggle) return;

  const data = JSON.parse(raw) as TerminalData;
  const s = TERMINAL[data.lang];
  const history = { items: [] as string[], index: -1, draft: '' };

  const perform = (action?: Action) => {
    if (!action) return;
    switch (action.type) {
      case 'goto': {
        const behavior: ScrollBehavior = reducedMotion() ? 'auto' : 'smooth';
        if (action.id === 'home') window.scrollTo({ top: 0, behavior });
        else document.getElementById(action.id)?.scrollIntoView({ behavior, block: 'start' });
        break;
      }
      case 'theme':
        // même chemin qu'un clic sur le sélecteur de thème : /js/theme.js applique et mémorise le choix
        document.querySelector<HTMLButtonElement>(`[data-theme-set="${action.value}"]`)?.click();
        break;
      case 'open':
        window.open(action.href, '_blank', 'noopener');
        break;
      case 'navigate':
        window.location.assign(action.href);
        break;
      case 'cursor':
        document.dispatchEvent(new CustomEvent('cursor:set', { detail: action.value }));
        break;
      case 'clear':
        log.replaceChildren();
        break;
    }
  };

  const exec = (command: string) => {
    const typed = command.trim();
    if (!typed) return;
    if (history.items.at(-1) !== typed) history.items.push(typed);
    history.index = -1;

    const result = run(typed, { s, d: data, theme: currentTheme() });
    if (result.action?.type !== 'clear') {
      const entry = document.createElement('div');
      entry.className = 'term-entry';
      const prompt = document.createElement('p');
      const sign = document.createElement('span');
      sign.className = 'term-accent';
      sign.setAttribute('aria-hidden', 'true');
      sign.textContent = '$ ';
      prompt.append(sign, typed);
      entry.append(prompt, ...result.lines.map(renderLine));
      log.append(entry);
      while (log.childElementCount > MAX_ENTRIES) log.firstElementChild?.remove();
      screen.scrollTop = screen.scrollHeight; // la dernière sortie reste visible, comme dans un vrai terminal
    }
    perform(result.action);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    exec(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (!history.items.length) return;
      event.preventDefault();
      if (history.index === -1) history.draft = input.value;
      const last = history.items.length - 1;
      if (event.key === 'ArrowUp')
        history.index = history.index === -1 ? last : Math.max(0, history.index - 1);
      else history.index = history.index === -1 || history.index >= last ? -1 : history.index + 1;
      input.value = history.index === -1 ? history.draft : (history.items[history.index] ?? '');
    } else if (event.key === 'Tab' && !event.shiftKey) {
      const done = complete(input.value, data);
      if (done !== null && done !== input.value) {
        event.preventDefault();
        input.value = done;
      } // sinon : Tab quitte le champ normalement (aucun piège clavier)
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      log.replaceChildren();
    }
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-terminal-run]')) {
    button.addEventListener('click', () => exec(button.dataset.terminalRun ?? ''));
  }

  const setOff = (off: boolean) => {
    root.toggleAttribute('data-off', off);
    toggle.textContent = off ? s.enable : s.disable;
  };
  toggle.addEventListener('click', () => {
    const off = !root.hasAttribute('data-off');
    storeOff(off);
    setOff(off);
    if (!off) input.focus();
  });

  // Prêt : le champ et les suggestions ne s'activent qu'une fois le script chargé (Entrée ne recharge jamais la page).
  for (const el of root.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
    '[data-terminal-enable]',
  ))
    el.disabled = false;
  toggle.hidden = false;
  setOff(storedOff());
}

for (const root of document.querySelectorAll<HTMLElement>('[data-terminal]')) mountTerminal(root);
