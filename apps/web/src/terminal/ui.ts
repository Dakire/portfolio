// Interface du terminal (page /terminal/) : branche l'interpréteur (commands.ts) sur le balisage de components/Terminal.astro.
// JavaScript sans dépendance, chargé en module externe (CSP). Sans JavaScript, le terminal reste une présentation statique
// suivie de liens. Accessibilité : champ étiqueté, sorties annoncées (role="log"), suggestions cliquables, Tab ne piège
// jamais le focus, aucune animation imposée, et un bouton pour désactiver le terminal (choix mémorisé).
import { complete, run, type Action, type Line, type TerminalData } from './commands';
import { TERMINAL } from './text';

const STORAGE_KEY = 'terminal';
const HISTORY_KEY = 'terminal-history';
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

const readHistory = (): string[] => {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};
const writeHistory = (items: string[]) => {
  try {
    if (items.length) sessionStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(-100)));
    else sessionStorage.removeItem(HISTORY_KEY);
  } catch {
    // stockage indisponible : l'historique vaut pour cette page
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
  const history = { items: readHistory(), index: -1, draft: '' };
  let cwd = '';
  const psNode = root.querySelector<HTMLElement>('[data-terminal-ps]');
  const prompt = () => `guillaume@grichard.eu:~${cwd ? `/${cwd}` : ''} (main)$`;
  const syncPrompt = () => {
    if (psNode) psNode.textContent = prompt();
  };
  syncPrompt();

  // Effets d'easter egg : courts (quelques secondes) et interruptibles (Échap, Ctrl+C, nouvelle commande).
  let stopEffect: (() => void) | null = null;
  const interrupt = (): boolean => {
    if (!stopEffect) return false;
    stopEffect();
    return true;
  };
  const matrix = (entry: HTMLElement) => {
    if (reducedMotion()) return;
    const pre = document.createElement('pre');
    pre.className = 'term-matrix';
    pre.setAttribute('aria-hidden', 'true');
    entry.append(pre);
    const cols = Math.max(20, Math.min(60, Math.floor(screen.clientWidth / 9)));
    const glyphs = 'ｱｲｳｴｵｶｷｸｹｺ01アイウエオ';
    const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * 8));
    const rows: string[] = [];
    const tick = () => {
      rows.unshift(
        drops
          .map((d, i) => {
            drops[i] = d > 0 ? d - 1 : Math.random() > 0.9 ? 6 : 0;
            return d > 0 ? glyphs[Math.floor(Math.random() * glyphs.length)] : ' ';
          })
          .join(''),
      );
      rows.length = Math.min(rows.length, 8);
      pre.textContent = rows.join('\n');
    };
    const timer = window.setInterval(tick, 90);
    const done = () => {
      window.clearInterval(timer);
      window.clearTimeout(limit);
      pre.remove();
      stopEffect = null;
    };
    const limit = window.setTimeout(done, 3500);
    stopEffect = done;
  };
  const konami = () => {
    if (reducedMotion()) return;
    root.setAttribute('data-konami', '');
    const limit = window.setTimeout(done, 1200);
    function done() {
      window.clearTimeout(limit);
      root.removeAttribute('data-konami');
      stopEffect = null;
    }
    stopEffect = done;
  };

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
      case 'reset':
        log.replaceChildren();
        history.items = [];
        history.index = -1;
        writeHistory([]);
        break;
      case 'effect':
        break; // lancé par exec : il a besoin de l'entrée qui vient d'être ajoutée
    }
  };

  const exec = (command: string) => {
    const typed = command.trim();
    if (!typed) return;
    interrupt();
    if (history.items.at(-1) !== typed) history.items.push(typed);
    history.index = -1;
    writeHistory(history.items);

    const result = run(typed, {
      s,
      d: data,
      theme: currentTheme(),
      cwd,
      history: history.items,
    });
    const before = prompt();
    if (result.cwd !== undefined) cwd = result.cwd;
    if (result.action?.type !== 'clear' && result.action?.type !== 'reset') {
      const entry = document.createElement('div');
      entry.className = 'term-entry';
      const prompt = document.createElement('p');
      const sign = document.createElement('span');
      sign.className = 'term-accent';
      sign.setAttribute('aria-hidden', 'true');
      sign.textContent = `${before} `;
      prompt.append(sign, typed);
      entry.append(prompt, ...result.lines.map(renderLine));
      log.append(entry);
      while (log.childElementCount > MAX_ENTRIES) log.firstElementChild?.remove();
      if (result.action?.type === 'effect') {
        if (result.action.name === 'matrix') matrix(entry);
        else konami();
      }
      screen.scrollTop = screen.scrollHeight; // la dernière sortie reste visible, comme dans un vrai terminal
    }
    syncPrompt();
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
    } else if (event.key === 'c' && event.ctrlKey && !event.metaKey) {
      // Ctrl+C : interrompt l'effet en cours, sinon abandonne la saisie (comme un shell) ; avec du texte sélectionné, copie.
      if (input.selectionStart !== input.selectionEnd) return;
      event.preventDefault();
      if (interrupt()) return;
      const entry = document.createElement('div');
      entry.className = 'term-entry';
      const line = document.createElement('p');
      line.append(`${prompt()} ${input.value}${s.interrupted}`);
      entry.append(line);
      log.append(entry);
      input.value = '';
      history.index = -1;
      screen.scrollTop = screen.scrollHeight;
    } else if (event.key === 'k' && event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      document.querySelector<HTMLButtonElement>('[data-search-open]')?.click();
    } else if (event.key === 'Escape' && interrupt()) {
      event.preventDefault();
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

  // Boutons de la fenêtre. Fermer = désactiver (le bouton « Activer le terminal » le rouvre) ; réduire = barre de titre
  // seule ; agrandir = plein écran de la fenêtre (Échap ou re-clic pour revenir). Réduire et agrandir s'excluent.
  const closeBtn = root.querySelector<HTMLButtonElement>('[data-terminal-close]');
  const minBtn = root.querySelector<HTMLButtonElement>('[data-terminal-min]');
  const maxBtn = root.querySelector<HTMLButtonElement>('[data-terminal-max]');
  if (closeBtn && minBtn && maxBtn) {
    const setMode = (mode: 'normal' | 'min' | 'max') => {
      root.toggleAttribute('data-minimized', mode === 'min');
      root.toggleAttribute('data-maximized', mode === 'max');
      document.documentElement.toggleAttribute('data-terminal-max', mode === 'max');
      minBtn.setAttribute('aria-pressed', String(mode === 'min'));
      maxBtn.setAttribute('aria-pressed', String(mode === 'max'));
    };
    closeBtn.addEventListener('click', () => {
      setMode('normal');
      storeOff(true);
      setOff(true);
      toggle.focus(); // le bouton qui rouvre le terminal prend le focus : il ne se perd pas
    });
    minBtn.addEventListener('click', () => {
      const min = !root.hasAttribute('data-minimized');
      setMode(min ? 'min' : 'normal');
      if (!min) input.focus();
    });
    maxBtn.addEventListener('click', () => {
      const max = !root.hasAttribute('data-maximized');
      setMode(max ? 'max' : 'normal');
      if (max) input.focus();
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && root.hasAttribute('data-maximized')) {
        setMode('normal');
        maxBtn.focus();
      }
    });
    for (const button of [closeBtn, minBtn, maxBtn]) button.hidden = false;
  }
}

for (const root of document.querySelectorAll<HTMLElement>('[data-terminal]')) mountTerminal(root);
