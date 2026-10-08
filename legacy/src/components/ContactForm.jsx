import { useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, RefreshCw, Send } from 'lucide-react';
import { useTurnstile } from '../hooks/useTurnstile';
import Button from './ui/Button';
import Field from './ui/Field';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const REQUEST_TIMEOUT_MS = 15000;
const MESSAGE_MAX = 5000;

// Statut HTTP renvoyé par contact.php -> clé du message à afficher (form.<clé>)
const statusFromHttp = (code) => (code === 429 ? 'rateLimited' : code === 403 ? 'captcha' : 'error');

// Règles de validation, une par champ : retournent la clé du message d'erreur (form.<clé>) ou rien.
const RULES = {
  name: (el) => (el.value.trim() ? undefined : 'errName'),
  email: (el) => (el.value.trim() && el.validity.valid ? undefined : 'errEmail'),
  message: (el) => (el.value.trim() ? undefined : 'errMessage'),
  gdpr: (el) => (el.checked ? undefined : 'errGdpr'),
};

export default function ContactForm({ form: f, lang }) {
  // idle | loading | success | error | captcha | captchaUnavailable | rateLimited | network
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({}); // { champ: clé du message }
  const [length, setLength] = useState(0);
  const successRef = useRef(null);
  const { widgetRef, token, ready, loadFailed, retry, reset } = useTurnstile({ siteKey: TURNSTILE_SITE_KEY, lang });

  // Après un envoi réussi, le focus passe au message de confirmation : les lecteurs d'écran l'annoncent et le clavier ne se perd pas.
  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  const setError = (name, key) => setErrors((prev) => (key ? { ...prev, [name]: key } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== name))));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;
    const form = e.currentTarget;

    // Validation : toutes les erreurs sont affichées d'un coup, le focus va au premier champ à corriger
    const found = Object.fromEntries(Object.entries(RULES).map(([name, rule]) => [name, rule(form.elements[name])]).filter(([, key]) => key));
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      form.elements[first].focus();
      return;
    }

    if (TURNSTILE_SITE_KEY && !token) {
      setStatus(loadFailed ? 'captchaUnavailable' : 'captcha');
      return;
    }
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
        setLength(0);
      } else {
        setStatus(statusFromHttp(response.status));
      }
    } catch {
      setStatus('network'); // réseau coupé ou délai dépassé
    } finally {
      reset();
    }
  };

  const success = status === 'success';
  const successPanel = success && (
    <div ref={successRef} tabIndex={-1} role="status" className="flex flex-col items-center gap-4 py-6 text-center outline-none">
      <span className="icon-tile h-14 w-14 motion-safe:animate-[pop_0.5s_var(--ease-soft)]" aria-hidden="true">
        <CircleCheck className="h-8 w-8" />
      </span>
      <p className="text-xl font-bold text-ink">{f.success}</p>
      <Button variant="secondary" onClick={() => setStatus('idle')}>{f.sendAnother}</Button>
    </div>
  );

  const busy = status === 'loading';
  const current = loadFailed && status === 'idle' ? 'captchaUnavailable' : status;
  const message = { error: f.error, captcha: f.captcha, captchaUnavailable: f.captchaUnavailable, rateLimited: f.rateLimited, network: f.network }[current];
  const err = (name) => (errors[name] ? f[errors[name]] : undefined);

  // Validation au départ du champ ; l'erreur disparaît dès que l'utilisateur corrige
  const handleBlur = (e) => {
    const rule = RULES[e.target.name];
    if (rule && (e.target.type === 'checkbox' || e.target.value !== '')) setError(e.target.name, rule(e.target));
  };
  const handleInput = (e) => {
    const { name } = e.target;
    if (name === 'message') setLength(e.target.value.length);
    if (errors[name] && !RULES[name]?.(e.target)) setError(name);
  };
  const events = { onBlur: handleBlur, onInput: handleInput };

  // Le formulaire reste monté (masqué) après un envoi : le widget Turnstile et son état survivent, un second message reste possible.
  return (
    <>
    {successPanel}
    <form hidden={success} onSubmit={handleSubmit} noValidate className="space-y-5" aria-busy={busy}>
      <p className="text-meta text-muted">{f.requiredNote}</p>

      <Field id="name" label={f.name} required autoComplete="name" maxLength={100} readOnly={busy} error={err('name')} {...events} />
      <Field id="email" label={f.email} required type="email" autoComplete="email" maxLength={254} readOnly={busy} error={err('email')} {...events} />
      <Field as="textarea" id="message" label={f.message} required rows={5} maxLength={MESSAGE_MAX} readOnly={busy} error={err('message')} counter={`${length} / ${MESSAGE_MAX}`} className="resize-y" {...events} />

      {/* Honeypot : invisible pour les humains, rempli par les robots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="gdpr" className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg py-2 text-copy text-body">
          <input
            type="checkbox"
            id="gdpr"
            name="gdpr"
            required
            {...events}
            aria-invalid={errors.gdpr ? 'true' : undefined}
            aria-describedby={errors.gdpr ? 'gdpr-error' : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong accent-[var(--brand-strong)]"
          />
          <span>{f.gdpr}</span>
        </label>
        {errors.gdpr && <p id="gdpr-error" className="text-meta font-medium text-danger">{err('gdpr')}</p>}
      </div>

      {TURNSTILE_SITE_KEY && (
        <div className="relative min-h-[65px]">
          <div ref={widgetRef} role="group" aria-label={f.captchaLabel} className="min-h-[65px]" />
          {/* Squelette pendant le chargement du widget : la mise en page ne saute pas à son arrivée */}
          {!ready && !loadFailed && (
            <div className="skeleton absolute inset-0 h-[65px] max-w-[300px]" role="img" aria-label={f.captchaLoading} />
          )}
          {loadFailed && (
            <Button variant="secondary" onClick={retry} className="absolute left-0 top-0.5">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> {f.retryCaptcha}
            </Button>
          )}
        </div>
      )}

      <Button type="submit" size="lg" loading={busy} className="w-full">
        {busy ? f.sending : (<><Send className="h-4 w-4" aria-hidden="true" /> {f.submit}</>)}
      </Button>

      {/* Région live au rôle stable : elle existe avant que son contenu change, donc l'annonce est fiable */}
      <div role="status" aria-live="polite" aria-atomic="true" className="min-h-5">
        {message && (
          <p className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-copy font-medium text-danger">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {message}
          </p>
        )}
      </div>
    </form>
    </>
  );
}
