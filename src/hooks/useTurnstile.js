import { useEffect, useRef, useState } from 'react';

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Charge le script Turnstile une seule fois, uniquement quand le formulaire approche de l'écran.
let turnstileScript;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  turnstileScript ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => {
      turnstileScript = undefined;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(s);
  });
  return turnstileScript;
}

/**
 * Cycle de vie du widget Cloudflare Turnstile.
 * Retourne la ref à poser sur le conteneur, le jeton courant, un indicateur d'échec de chargement et un `reset`.
 * Sans `siteKey`, le hook est inactif.
 */
export function useTurnstile({ siteKey, lang }) {
  const widgetRef = useRef(null);
  const widgetId = useRef(null);
  const [token, setToken] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!siteKey) return undefined;
    const el = widgetRef.current;
    let cancelled = false;

    const render = () =>
      loadTurnstile()
        .then((ts) => {
          if (cancelled) return;
          widgetId.current = ts.render(el, {
            sitekey: siteKey,
            theme: 'dark',
            language: lang,
            callback: setToken,
            'expired-callback': () => setToken(''),
            'error-callback': () => setToken(''),
          });
        })
        .catch(() => {
          if (!cancelled) setLoadFailed(true);
        });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          render();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (widgetId.current != null && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
      setToken('');
    };
  }, [siteKey, lang]);

  const reset = () => {
    setToken('');
    if (widgetId.current != null && window.turnstile) window.turnstile.reset(widgetId.current);
  };

  return { widgetRef, token, loadFailed, reset };
}
