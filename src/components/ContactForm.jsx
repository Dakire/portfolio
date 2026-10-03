import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const fieldClass =
  'w-full bg-slate-950 border border-slate-500 rounded-lg px-4 py-2.5 text-white transition-colors disabled:opacity-50';

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

export default function ContactForm({ t, lang }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | captcha
  const [token, setToken] = useState('');
  const widgetRef = useRef(null);
  const widgetId = useRef(null);

  // Rendu (et re-rendu au changement de langue) du widget Turnstile.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return undefined;
    const el = widgetRef.current;
    let cancelled = false;

    const render = () =>
      loadTurnstile()
        .then((ts) => {
          if (cancelled) return;
          widgetId.current = ts.render(el, {
            sitekey: TURNSTILE_SITE_KEY,
            theme: 'dark',
            language: lang,
            callback: setToken,
            'expired-callback': () => setToken(''),
            'error-callback': () => setToken(''),
          });
        })
        .catch(() => setStatus('error'));

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
  }, [lang]);

  const resetCaptcha = () => {
    setToken('');
    if (widgetId.current != null && window.turnstile) window.turnstile.reset(widgetId.current);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !token) {
      setStatus('captcha');
      return;
    }
    const form = e.currentTarget;
    setStatus('loading');

    try {
      const response = await fetch('/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.elements.name.value,
          email: form.elements.email.value,
          message: form.elements.message.value,
          website: form.elements.website.value, // honeypot
          turnstileToken: token,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    } finally {
      resetCaptcha();
    }
  };

  const busy = status === 'loading';
  const message =
    status === 'success' ? t.form.success
    : status === 'error' ? t.form.error
    : status === 'captcha' ? t.form.captcha
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-busy={busy}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1">{t.form.name}</label>
        <input type="text" id="name" name="name" autoComplete="name" maxLength={100} required disabled={busy} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">{t.form.email}</label>
        <input type="email" id="email" name="email" autoComplete="email" maxLength={254} required disabled={busy} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-200 mb-1">{t.form.message}</label>
        <textarea id="message" name="message" rows="5" maxLength={5000} required disabled={busy} className={`${fieldClass} resize-y`} />
      </div>

      {/* Honeypot : invisible pour les humains, rempli par les robots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-3">
        <input type="checkbox" id="gdpr" name="gdpr" required className="mt-1 w-4 h-4 rounded border-slate-500 bg-slate-950 accent-emerald-600" />
        <label htmlFor="gdpr" className="text-sm text-slate-300 leading-relaxed cursor-pointer">{t.form.gdpr}</label>
      </div>

      {TURNSTILE_SITE_KEY && <div ref={widgetRef} role="group" aria-label={t.form.captchaLabel} className="min-h-[65px]" />}

      <button
        type="submit"
        disabled={busy}
        className="w-full font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <span className="motion-safe:animate-pulse">{t.form.sending}</span>
        ) : (
          <>
            <Send className="w-4 h-4" aria-hidden="true" /> {t.form.submit}
          </>
        )}
      </button>

      {/* Région live : annoncée par les lecteurs d'écran, visible pour tous */}
      <p
        role={status === 'success' ? 'status' : 'alert'}
        className={`text-sm font-medium min-h-5 ${status === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
      >
        {message}
      </p>
    </form>
  );
}
