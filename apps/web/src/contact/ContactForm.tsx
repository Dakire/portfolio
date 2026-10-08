import { CircleAlert, CircleCheck, RefreshCw, Send } from 'lucide-preact';
import { Component, type ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { PORTFOLIO_DATA } from '../data/content';
import { withBase } from '../lib/base';
import type { Lang } from '../lib/i18n';
import Button from '../tools/ui/Button';
import Field from '../tools/ui/Field';
import { useTurnstile } from './useTurnstile';

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined;
const REQUEST_TIMEOUT_MS = 15_000;
const MESSAGE_MAX = 5000;

type Status =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'captcha'
  | 'captchaUnavailable'
  | 'rateLimited'
  | 'network';
type FormText = (typeof PORTFOLIO_DATA)['fr']['form'];
type ErrorKey = 'errName' | 'errEmail' | 'errMessage' | 'errGdpr';
type FieldName = 'name' | 'email' | 'message' | 'gdpr';
type Control = HTMLInputElement | HTMLTextAreaElement;

// Statut HTTP renvoyé par contact.php -> état à afficher
const statusFromHttp = (code: number): Status =>
  code === 429 ? 'rateLimited' : code === 403 ? 'captcha' : 'error';

// Règles de validation, une par champ : retournent la clé du message d'erreur ou rien.
const RULES: Record<FieldName, (el: Control) => ErrorKey | undefined> = {
  name: (el) => (el.value.trim() ? undefined : 'errName'),
  email: (el) => (el.value.trim() && el.validity.valid ? undefined : 'errEmail'),
  message: (el) => (el.value.trim() ? undefined : 'errMessage'),
  gdpr: (el) => ((el as HTMLInputElement).checked ? undefined : 'errGdpr'),
};
const isField = (name: string): name is FieldName => name in RULES;

function ContactForm({ form: f, lang }: { form: FormText; lang: Lang }) {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Partial<Record<FieldName, ErrorKey>>>({});
  const [length, setLength] = useState(0);
  const successRef = useRef<HTMLDivElement>(null);
  const { widgetRef, token, ready, loadFailed, retry, reset } = useTurnstile({
    siteKey: TURNSTILE_SITE_KEY,
    lang,
  });

  // Après un envoi réussi, le focus passe au message de confirmation : les lecteurs d'écran l'annoncent et le clavier ne se perd pas.
  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  const setError = (name: FieldName, key?: ErrorKey) =>
    setErrors((previous) => {
      const next = { ...previous };
      if (key) next[name] = key;
      else delete next[name];
      return next;
    });

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (status === 'loading') return;
    const form = event.currentTarget as HTMLFormElement;
    const control = (name: string) => form.elements.namedItem(name) as Control;

    // Validation : toutes les erreurs sont affichées d'un coup, le focus va au premier champ à corriger
    const found: Partial<Record<FieldName, ErrorKey>> = {};
    for (const name of Object.keys(RULES) as FieldName[]) {
      const key = RULES[name](control(name));
      if (key) found[name] = key;
    }
    setErrors(found);
    const first = (Object.keys(found) as FieldName[])[0];
    if (first) {
      control(first).focus();
      return;
    }

    if (TURNSTILE_SITE_KEY && !token) {
      setStatus(loadFailed ? 'captchaUnavailable' : 'captcha');
      return;
    }
    setStatus('loading');

    try {
      const response = await fetch(withBase('/contact.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          name: control('name').value,
          email: control('email').value,
          message: control('message').value,
          website: control('website').value, // honeypot
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
  const busy = status === 'loading';
  const current: Status = loadFailed && status === 'idle' ? 'captchaUnavailable' : status;
  const messages: Partial<Record<Status, string>> = {
    error: f.error,
    captcha: f.captcha,
    captchaUnavailable: f.captchaUnavailable,
    rateLimited: f.rateLimited,
    network: f.network,
  };
  const message = messages[current];
  const err = (name: FieldName) => {
    const key = errors[name];
    return key ? f[key] : undefined;
  };

  // Validation au départ du champ ; l'erreur disparaît dès que l'utilisateur corrige
  const handleBlur = (event: Event) => {
    const el = event.target as Control;
    if (isField(el.name) && (el.type === 'checkbox' || el.value !== ''))
      setError(el.name, RULES[el.name](el));
  };
  const handleInput = (event: Event) => {
    const el = event.target as Control;
    if (el.name === 'message') setLength(el.value.length);
    if (isField(el.name) && errors[el.name] && !RULES[el.name](el)) setError(el.name);
  };

  // Le formulaire reste monté (masqué) après un envoi : le widget Turnstile et son état survivent, un second message reste possible.
  return (
    <>
      {success && (
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        <div ref={successRef} tabIndex={-1} role="status" class="contact-success">
          <CircleCheck size={40} class="tone-ok" aria-hidden="true" />
          <p class="strong">{f.success}</p>
          <Button onClick={() => setStatus('idle')}>{f.sendAnother}</Button>
        </div>
      )}
      <form hidden={success} onSubmit={handleSubmit} noValidate class="stack" aria-busy={busy}>
        <p class="note">{f.requiredNote}</p>

        <Field
          id="name"
          label={f.name}
          required
          autoComplete="name"
          maxLength={100}
          readOnly={busy}
          error={err('name')}
          onBlur={handleBlur}
          onInput={handleInput}
        />
        <Field
          id="email"
          label={f.email}
          required
          type="email"
          autoComplete="email"
          maxLength={254}
          readOnly={busy}
          error={err('email')}
          onBlur={handleBlur}
          onInput={handleInput}
        />
        <Field
          as="textarea"
          id="message"
          label={f.message}
          required
          rows={5}
          maxLength={MESSAGE_MAX}
          readOnly={busy}
          error={err('message')}
          counter={`${length} / ${MESSAGE_MAX}`}
          onBlur={handleBlur}
          onInput={handleInput}
        />

        {/* Honeypot : invisible pour les humains, rempli par les robots */}
        <div class="honeypot" aria-hidden="true">
          <label for="website">Website</label>
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <label for="gdpr" class="check">
            <input
              type="checkbox"
              id="gdpr"
              name="gdpr"
              required
              onBlur={handleBlur}
              onInput={handleInput}
              aria-invalid={errors.gdpr ? 'true' : undefined}
              aria-describedby={errors.gdpr ? 'gdpr-error' : undefined}
            />
            <span>{f.gdpr}</span>
          </label>
          {errors.gdpr && (
            <p id="gdpr-error" class="field-error">
              {err('gdpr')}
            </p>
          )}
        </div>

        {TURNSTILE_SITE_KEY && (
          <div class="captcha">
            <div ref={widgetRef} role="group" aria-label={f.captchaLabel} class="captcha-widget" />
            {/* Réserve la place pendant le chargement du widget : la mise en page ne saute pas à son arrivée */}
            {!ready && !loadFailed && (
              <p class="captcha-loading note" role="status">
                {f.captchaLoading}
              </p>
            )}
            {loadFailed && (
              <Button onClick={retry}>
                <RefreshCw size={18} aria-hidden="true" /> {f.retryCaptcha}
              </Button>
            )}
          </div>
        )}

        <Button type="submit" variant="primary" class="btn-lg btn-block" loading={busy}>
          {busy ? (
            f.sending
          ) : (
            <>
              <Send size={18} aria-hidden="true" /> {f.submit}
            </>
          )}
        </Button>

        {/* Région live au rôle stable : elle existe avant que son contenu change, donc l'annonce est fiable */}
        <div role="status" aria-live="polite" aria-atomic="true" class="form-status">
          {message && (
            <p class="alert-box icon-line">
              <CircleAlert size={18} aria-hidden="true" /> {message}
            </p>
          )}
        </div>
      </form>
    </>
  );
}

/** Filet de sécurité : si le formulaire plante, le reste de la page (déjà rendu) reste utilisable et l'adresse e-mail est proposée. */
class ErrorBoundary extends Component<
  { fallback: string; children: ComponentChildren },
  { failed: boolean }
> {
  override state = { failed: false };

  static override getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? <p role="alert">{this.props.fallback}</p> : this.props.children;
  }
}

export default function ContactIsland({ lang }: { lang: Lang }) {
  const form = PORTFOLIO_DATA[lang].form;
  return (
    <ErrorBoundary fallback={form.fallback}>
      <ContactForm lang={lang} form={form} />
    </ErrorBoundary>
  );
}
