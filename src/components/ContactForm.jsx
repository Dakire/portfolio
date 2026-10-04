import { useState } from 'react';
import { Send } from 'lucide-react';
import { useTurnstile } from '../hooks/useTurnstile';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const REQUEST_TIMEOUT_MS = 15000;

const fieldClass =
  'w-full bg-slate-950 border border-slate-500 rounded-lg px-4 py-2.5 text-white transition-colors read-only:opacity-60';

// Statut HTTP renvoyé par contact.php -> clé du message à afficher (form.<clé>)
const statusFromHttp = (code) => (code === 429 ? 'rateLimited' : code === 403 ? 'captcha' : 'error');

export default function ContactForm({ form: f, lang }) {
  // idle | loading | success | error | captcha | captchaUnavailable | rateLimited | network
  const [status, setStatus] = useState('idle');
  const { widgetRef, token, loadFailed, reset } = useTurnstile({ siteKey: TURNSTILE_SITE_KEY, lang });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;
    if (TURNSTILE_SITE_KEY && !token) {
      setStatus(loadFailed ? 'captchaUnavailable' : 'captcha');
      return;
    }
    const form = e.currentTarget;
    setStatus('loading');

    try {
      const response = await fetch('/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          name: form.elements.name.value,
          email: form.elements.email.value,
          message: form.elements.message.value,
          website: form.elements.website.value, // honeypot
          turnstileToken: token,
        }),
      });
      if (response.ok) {
        setStatus('success');
        form.reset();
      } else {
        setStatus(statusFromHttp(response.status));
      }
    } catch {
      setStatus('network'); // réseau coupé ou délai dépassé
    } finally {
      reset();
    }
  };

  const busy = status === 'loading';
  const current = loadFailed && status === 'idle' ? 'captchaUnavailable' : status;
  const message = { success: f.success, error: f.error, captcha: f.captcha, captchaUnavailable: f.captchaUnavailable, rateLimited: f.rateLimited, network: f.network }[current] ?? '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-busy={busy}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1">{f.name}</label>
        <input type="text" id="name" name="name" autoComplete="name" maxLength={100} required readOnly={busy} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">{f.email}</label>
        <input type="email" id="email" name="email" autoComplete="email" maxLength={254} required readOnly={busy} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-200 mb-1">{f.message}</label>
        <textarea id="message" name="message" rows="5" maxLength={5000} required readOnly={busy} className={`${fieldClass} resize-y`} />
      </div>

      {/* Honeypot : invisible pour les humains, rempli par les robots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-3">
        <input type="checkbox" id="gdpr" name="gdpr" required className="mt-1 w-4 h-4 rounded border-slate-500 bg-slate-950 accent-emerald-600" />
        <label htmlFor="gdpr" className="text-sm text-slate-300 leading-relaxed cursor-pointer">{f.gdpr}</label>
      </div>

      {TURNSTILE_SITE_KEY && <div ref={widgetRef} role="group" aria-label={f.captchaLabel} className="min-h-[65px]" />}

      {/* aria-disabled (et non disabled) : le bouton garde le focus clavier pendant l'envoi */}
      <button
        type="submit"
        aria-disabled={busy}
        className="w-full font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
      >
        {busy ? (
          <span className="motion-safe:animate-pulse">{f.sending}</span>
        ) : (
          <>
            <Send className="w-4 h-4" aria-hidden="true" /> {f.submit}
          </>
        )}
      </button>

      {/* Région live au rôle stable : elle existe avant que son contenu change, donc l'annonce est fiable */}
      <p role="status" aria-live="polite" aria-atomic="true" className={`text-sm font-medium min-h-5 ${current === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
        {message}
      </p>
    </form>
  );
}
