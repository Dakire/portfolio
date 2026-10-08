import { useEffect, useRef, useState } from 'preact/hooks';

interface TurnstileApi {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      theme: 'light' | 'dark';
      language: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Charge le script Turnstile une seule fois, uniquement quand le formulaire approche de l'écran.
let turnstileScript: Promise<TurnstileApi> | undefined;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  turnstileScript ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile'));
    script.onerror = () => {
      script.remove();
      turnstileScript = undefined;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(script);
  });
  return turnstileScript;
}

/**
 * Cycle de vie du widget Cloudflare Turnstile.
 * Retourne la ref à poser sur le conteneur, le jeton courant, `ready` (widget affiché), `loadFailed` (script injoignable),
 * `retry` (nouvelle tentative de chargement) et `reset` (nouveau défi après un envoi).
 * Sans `siteKey`, le hook est inactif.
 */
export function useTurnstile({ siteKey, lang }: { siteKey: string | undefined; lang: string }) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const el = widgetRef.current;
    if (!siteKey || !el) return undefined;
    let cancelled = false;

    const render = () =>
      loadTurnstile()
        .then((turnstile) => {
          if (cancelled) return;
          widgetId.current = turnstile.render(el, {
            sitekey: siteKey,
            theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
            language: lang,
            callback: setToken,
            'expired-callback': () => setToken(''),
            'error-callback': () => setToken(''),
          });
          setReady(true);
        })
        .catch(() => {
          if (!cancelled) setLoadFailed(true);
        });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          void render();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (widgetId.current !== null && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
      setToken('');
      setReady(false);
    };
  }, [siteKey, lang, attempt]);

  const reset = () => {
    setToken('');
    if (widgetId.current !== null && window.turnstile) window.turnstile.reset(widgetId.current);
  };

  const retry = () => {
    setLoadFailed(false);
    setAttempt((n) => n + 1);
  };

  return { widgetRef, token, ready, loadFailed, retry, reset };
}
