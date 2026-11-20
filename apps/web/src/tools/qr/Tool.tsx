import { buildMatrix, effectiveLevel, type ErrorLevel } from '@grichard/tools-core/qr/matrix';
import {
  emailPayload,
  eventPayload,
  geoPayload,
  phonePayload,
  smsPayload,
  textPayload,
  urlPayload,
  utf8Length,
  vcardPayload,
  whatsappPayload,
  wifiPayload,
  type Built,
  type WifiSecurity,
} from '@grichard/tools-core/qr/payloads';
import { checkQr } from '@grichard/tools-core/qr/checks';
import { PRESETS, type PresetId } from '@grichard/tools-core/qr/presets';
import {
  renderSvg,
  type FinderInnerStyle,
  type FinderOuterStyle,
  type LogoShape,
  FINDER_INNER_STYLES,
  FINDER_OUTER_STYLES,
  LOGO_SHAPES,
  MODULE_STYLES,
  shapeThumbnail,
  type ModuleStyle,
  type RenderOptions,
} from '@grichard/tools-core/qr/render';
import { BYTE_CAPACITY } from '@grichard/tools-core/qr/matrix';
import {
  CalendarDays,
  Contact,
  Download,
  ExternalLink,
  Link2,
  type LucideIcon,
  MapPin,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  RotateCcw,
  Trash2,
  Type,
  Wifi,
} from 'lucide-preact';
import { useMemo, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import Button from '../ui/Button';
import { Check, Radio } from '../ui/Choice';
import Collapsible from '../ui/Collapsible';
import Field, { SelectField } from '../ui/Field';
import ShapePicker from '../ui/ShapePicker';
import { downloadBlob } from '../ui/download';
import { useDebounced } from '../ui/hooks';
import { QR_TOOL } from './text';

type QrType = keyof (typeof QR_TOOL)['fr']['ui']['form']['types'];
const TYPES: QrType[] = [
  'url',
  'text',
  'wifi',
  'email',
  'phone',
  'sms',
  'whatsapp',
  'geo',
  'vcard',
  'event',
];
const TYPE_ICONS: Record<QrType, LucideIcon> = {
  url: Link2,
  text: Type,
  wifi: Wifi,
  email: Mail,
  phone: Phone,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  geo: MapPin,
  vcard: Contact,
  event: CalendarDays,
};
const EXPORT_SIZES = [512, 1024, 2048, 4096] as const;
/** Côté d'export libre : entre 128 et 8192 pixels (au-delà, certains navigateurs refusent de créer le canvas). */
const clampSize = (value: string): number =>
  Math.min(8192, Math.max(128, Math.round(Number(value)) || 1024));

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

interface Data {
  type: QrType;
  url: string;
  text: string;
  wifi: { ssid: string; password: string; security: WifiSecurity; hidden: boolean };
  email: { to: string; subject: string; body: string };
  phone: string;
  sms: { phone: string; message: string };
  whatsapp: { phone: string; message: string };
  geo: { latitude: string; longitude: string };
  vcard: Record<
    | 'firstName'
    | 'lastName'
    | 'organization'
    | 'phone'
    | 'email'
    | 'url'
    | 'street'
    | 'city'
    | 'region'
    | 'postalCode'
    | 'country',
    string
  >;
  event: { summary: string; start: string; end: string; location: string; description: string };
}

const INITIAL_DATA: Data = {
  type: 'url',
  url: '',
  text: '',
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
  email: { to: '', subject: '', body: '' },
  phone: '',
  sms: { phone: '', message: '' },
  whatsapp: { phone: '', message: '' },
  geo: { latitude: '', longitude: '' },
  vcard: {
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    email: '',
    url: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
  },
  event: { summary: '', start: '', end: '', location: '', description: '' },
};

interface Look {
  preset: PresetId | 'custom';
  moduleStyle: ModuleStyle;
  finderOuter: FinderOuterStyle;
  finderInner: FinderInnerStyle;
  foreground: string;
  gradient: boolean;
  gradientTo: string;
  gradientAngle: number;
  background: string;
  transparent: boolean;
  margin: number;
}

const lookFromPreset = (id: PresetId): Look => {
  const p = PRESETS[id];
  return {
    preset: id,
    moduleStyle: p.moduleStyle,
    finderOuter: p.finderOuter,
    finderInner: p.finderInner,
    foreground: p.foreground,
    gradient: Boolean(p.gradient),
    gradientTo: p.gradient?.to ?? '#1d3557',
    gradientAngle: p.gradient?.angle ?? 45,
    background: p.background ?? '#ffffff',
    transparent: p.background === null,
    margin: p.margin,
  };
};

interface Logo {
  href: string;
  name: string;
}
interface LogoSettings {
  ratio: number;
  padding: number;
  plate: boolean;
  shape: LogoShape;
}

/** Options de rendu à partir des réglages de l'interface (fonction pure : les dépendances des useMemo restent explicites). */
function makeOptions(
  look: Look,
  logo: Logo | null,
  logoSettings: LogoSettings,
  pixelSize: number,
): RenderOptions {
  return {
    moduleStyle: look.moduleStyle,
    finderOuter: look.finderOuter,
    finderInner: look.finderInner,
    foreground: look.foreground,
    ...(look.gradient ? { gradient: { to: look.gradientTo, angle: look.gradientAngle } } : {}),
    background: look.transparent ? null : look.background,
    margin: look.margin,
    pixelSize,
    ...(logo
      ? {
          logo: {
            href: logo.href,
            ratio: logoSettings.ratio,
            padding: logoSettings.padding,
            plate: logoSettings.plate,
            shape: logoSettings.shape,
          },
        }
      : {}),
  };
}

const THUMB_BODY = Object.fromEntries(
  MODULE_STYLES.map((id) => [id, shapeThumbnail('body', id)]),
) as Record<(typeof MODULE_STYLES)[number], string>;
const THUMB_OUTER = Object.fromEntries(
  FINDER_OUTER_STYLES.map((id) => [id, shapeThumbnail('outer', id)]),
) as Record<FinderOuterStyle, string>;
const THUMB_INNER = Object.fromEntries(
  FINDER_INNER_STYLES.map((id) => [id, shapeThumbnail('inner', id)]),
) as Record<FinderInnerStyle, string>;
const THUMB_LOGO = Object.fromEntries(
  LOGO_SHAPES.map((id) => [id, shapeThumbnail('logo', id)]),
) as Record<LogoShape, string>;

const parseLocal = (value: string): Date | null => (value ? new Date(value) : null);
const pair = (p: string[]): [string, string] => [p[0] ?? '', p[1] ?? ''];

function buildPayload(d: Data): Built {
  switch (d.type) {
    case 'url':
      return urlPayload(d.url);
    case 'text':
      return textPayload(d.text);
    case 'wifi':
      return wifiPayload(d.wifi);
    case 'email':
      return emailPayload(d.email);
    case 'phone':
      return phonePayload(d.phone);
    case 'sms':
      return smsPayload(d.sms);
    case 'whatsapp':
      return whatsappPayload(d.whatsapp);
    case 'geo':
      return geoPayload(d.geo);
    case 'vcard':
      return vcardPayload(d.vcard);
    case 'event':
      return eventPayload({
        ...d.event,
        start: parseLocal(d.event.start),
        end: parseLocal(d.event.end),
      });
  }
}

/** Charge une image dans le navigateur (jamais insérée dans la page) et la rastérise en PNG : un SVG importé ne peut donc exécuter aucun script. */
function loadLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('read'));
      image.onload = () => {
        const max = 512;
        const w = image.naturalWidth || max;
        const h = image.naturalHeight || max;
        const scale = Math.min(max / w, max / h);
        const canvas = document.createElement('canvas');
        canvas.width = max;
        canvas.height = max;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('read'));
        ctx.drawImage(image, (max - w * scale) / 2, (max - h * scale) / 2, w * scale, h * scale);
        resolve(canvas.toDataURL('image/png'));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function svgToPng(svg: string, px: number): Promise<Blob> {
  const image = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('render'));
  });
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await loaded;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('render');
  ctx.drawImage(image, 0, 0, px, px);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('render'))), 'image/png'),
  );
}

export default function QrGenerator({ lang }: { lang: Lang }) {
  const t = QR_TOOL[lang].ui;
  const f = t.form;
  const r = t.result;
  const [data, setData] = useState<Data>(INITIAL_DATA);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [look, setLook] = useState<Look>(lookFromPreset('minimal'));
  const [logo, setLogo] = useState<Logo | null>(null);
  const [logoError, setLogoError] = useState('');
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
    ratio: 0.2,
    padding: 1,
    plate: true,
    shape: 'rounded' as LogoShape,
  });
  const [level, setLevel] = useState<ErrorLevel>('M');
  const [sizePick, setSizePick] = useState('1024');
  const [customSize, setCustomSize] = useState('1536');
  const exportSize = sizePick === 'custom' ? clampSize(customSize) : Number(sizePick);
  const [filename, setFilename] = useState('');
  const [previewDark, setPreviewDark] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const touch = (name: string) => setTouched((s) => ({ ...s, [name]: true }));
  const patch = <K extends keyof Data>(key: K, value: Data[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  const patchIn = <K extends 'wifi' | 'email' | 'sms' | 'whatsapp' | 'geo' | 'vcard' | 'event'>(
    key: K,
    value: Partial<Data[K]>,
  ) => setData((d) => ({ ...d, [key]: { ...d[key], ...value } }));
  const changeLook = (value: Partial<Look>) =>
    setLook((l) => ({ ...l, preset: 'custom', ...value }));

  const built = useMemo(() => buildPayload(data), [data]);
  const effLevel = effectiveLevel(level, logo !== null);
  const matrix = useMemo(
    () => (built.ok ? buildMatrix(built.value, effLevel) : null),
    [built, effLevel],
  );
  const bytes = built.ok ? utf8Length(built.value) : 0;

  const options = (pixelSize: number): RenderOptions =>
    makeOptions(look, logo, logoSettings, pixelSize);

  const svg = useMemo(() => {
    if (!matrix || !matrix.ok) return '';
    try {
      return renderSvg(matrix.matrix, makeOptions(look, logo, logoSettings, 512));
    } catch {
      return '';
    }
  }, [matrix, look, logo, logoSettings]);

  const warnings = useMemo(
    () =>
      matrix && matrix.ok
        ? checkQr({
            foreground: look.foreground,
            ...(look.gradient ? { gradientTo: look.gradientTo } : {}),
            background: look.transparent ? null : look.background,
            margin: look.margin,
            pixelSize: exportSize,
            size: matrix.matrix.size,
            ...(logo ? { logoRatio: logoSettings.ratio } : {}),
            bytes,
            level: effLevel,
          })
        : [],
    [matrix, look, logo, logoSettings, exportSize, bytes, effLevel],
  );

  // Erreur d'un champ : affichée dès que le champ contient quelque chose, ou après l'avoir quitté.
  const fieldError = (name: string, value: string): string | undefined => {
    if (built.ok || built.field !== name) return undefined;
    return value.trim() !== '' || touched[name] ? f.errors[built.error] : undefined;
  };
  const capacityError = built.ok && matrix && !matrix.ok ? f.errors.capacity : undefined;

  const announce = useDebounced(
    capacityError ??
      (matrix && matrix.ok ? r.generated(matrix.matrix.size, matrix.matrix.version, effLevel) : ''),
    500,
  );

  const input = (
    name: string,
    id: string,
    p: string[],
    value: string,
    set: (v: string) => void,
    extra: Record<string, unknown> = {},
  ) => {
    const [label, placeholder] = pair(p);
    return (
      <Field
        id={`qr-${id}`}
        label={label}
        placeholder={placeholder}
        value={value}
        error={fieldError(name, value)}
        onInput={(e) => {
          set((e.currentTarget as HTMLInputElement).value);
        }}
        onBlur={() => touch(name)}
        autocomplete="off"
        {...extra}
      />
    );
  };

  const baseName = filename.trim() || `qr-code-${data.type}`;
  const safeName = baseName.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'qr-code';

  const exportSvg = () => {
    if (!matrix || !matrix.ok) return;
    downloadBlob(`${safeName}.svg`, renderSvg(matrix.matrix, options(1024)), 'image/svg+xml');
  };
  const exportPng = async () => {
    if (!matrix || !matrix.ok) return;
    setExporting(true);
    setExportError(false);
    try {
      const blob = await svgToPng(renderSvg(matrix.matrix, options(exportSize)), exportSize);
      downloadBlob(`${safeName}.png`, blob, 'image/png');
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  const onLogoFile = async (file: File | undefined) => {
    setLogoError('');
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) return setLogoError(f.logo.errors.type);
    if (file.size > LOGO_MAX_BYTES) return setLogoError(f.logo.errors.size);
    try {
      setLogo({ href: await loadLogo(file), name: file.name });
    } catch {
      setLogoError(f.logo.errors.read);
    }
  };

  const reset = () => {
    setData(INITIAL_DATA);
    setTouched({});
    setLook(lookFromPreset('minimal'));
    setLogo(null);
    setLogoError('');
    setLogoSettings({ ratio: 0.2, padding: 1, plate: true, shape: 'rounded' });
    setLevel('M');
    setSizePick('1024');
    setCustomSize('1536');
    setFilename('');
  };

  const zone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  })();
  const logoArea = Math.round(logoSettings.ratio ** 2 * 100);
  const ready = Boolean(svg);
  const urlTarget = data.type === 'url' && built.ok ? built.value : null;

  return (
    <div class="qr">
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
      <div class="qr-form">
        <Collapsible title={f.steps.type} defaultOpen>
          <fieldset class="type-picker">
            <legend class="visually-hidden">{f.typeLabel}</legend>
            <div class="type-grid">
              {TYPES.map((id) => {
                const Icon = TYPE_ICONS[id];
                return (
                  <label key={id} class="type-tile">
                    <input
                      type="radio"
                      name="qr-type"
                      value={id}
                      checked={data.type === id}
                      onChange={() => patch('type', id)}
                    />
                    <Icon size={22} aria-hidden="true" />
                    <span>{f.types[id]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </Collapsible>

        <Collapsible title={f.steps.data} defaultOpen>
          <div class="qr-fields">
            {data.type === 'url' && (
              <>
                {input('url', 'url', f.fields.url, data.url, (v) => patch('url', v), {
                  type: 'url',
                  inputmode: 'url',
                })}
                {urlTarget && (
                  <p>
                    <a class="btn" href={urlTarget} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} aria-hidden="true" /> {f.testLink}
                    </a>
                  </p>
                )}
              </>
            )}
            {data.type === 'text' && (
              <Field
                id="qr-text"
                as="textarea"
                rows={5}
                label={f.fields.text[0] ?? ''}
                placeholder={f.fields.text[1] ?? ''}
                value={data.text}
                error={fieldError('text', data.text)}
                counter={f.hints.textCounter(
                  utf8Length(data.text),
                  Math.max(0, BYTE_CAPACITY[effLevel] - utf8Length(data.text)),
                )}
                onInput={(e) => patch('text', (e.currentTarget as HTMLTextAreaElement).value)}
                onBlur={() => touch('text')}
              />
            )}
            {data.type === 'wifi' && (
              <>
                {input('ssid', 'ssid', f.fields.ssid, data.wifi.ssid, (v) =>
                  patchIn('wifi', { ssid: v }),
                )}
                <SelectField
                  id="qr-security"
                  label={f.fields.security}
                  value={data.wifi.security}
                  onChange={(v) => patchIn('wifi', { security: v as WifiSecurity })}
                >
                  <option value="WPA">{f.securityOptions.WPA}</option>
                  <option value="WEP">{f.securityOptions.WEP}</option>
                  <option value="nopass">{f.securityOptions.nopass}</option>
                </SelectField>
                {data.wifi.security !== 'nopass' &&
                  input(
                    'password',
                    'wifi-password',
                    f.fields.wifiPassword,
                    data.wifi.password,
                    (v) => patchIn('wifi', { password: v }),
                    {
                      hint: f.hints.wifiSecret,
                      autocomplete: 'off',
                      spellcheck: false,
                    },
                  )}
                <Check checked={data.wifi.hidden} onChange={(v) => patchIn('wifi', { hidden: v })}>
                  {f.fields.hidden}
                </Check>
                {data.wifi.security === 'WPA' && <p class="field-hint">{f.hints.wpa3}</p>}
              </>
            )}
            {data.type === 'email' && (
              <>
                {input(
                  'to',
                  'email-to',
                  f.fields.emailTo,
                  data.email.to,
                  (v) => patchIn('email', { to: v }),
                  { type: 'email', inputmode: 'email' },
                )}
                {input('subject', 'email-subject', f.fields.emailSubject, data.email.subject, (v) =>
                  patchIn('email', { subject: v }),
                )}
                <Field
                  id="qr-email-body"
                  as="textarea"
                  rows={4}
                  label={f.fields.emailBody[0] ?? ''}
                  placeholder={f.fields.emailBody[1] ?? ''}
                  value={data.email.body}
                  onInput={(e) =>
                    patchIn('email', { body: (e.currentTarget as HTMLTextAreaElement).value })
                  }
                />
              </>
            )}
            {data.type === 'phone' &&
              input('phone', 'phone', f.fields.phone, data.phone, (v) => patch('phone', v), {
                type: 'tel',
                inputmode: 'tel',
                hint: f.hints.phone,
              })}
            {(data.type === 'sms' || data.type === 'whatsapp') && (
              <>
                {input(
                  'phone',
                  `${data.type}-phone`,
                  f.fields.phone,
                  data[data.type].phone,
                  (v) => patchIn(data.type as 'sms' | 'whatsapp', { phone: v }),
                  {
                    type: 'tel',
                    inputmode: 'tel',
                    hint: f.hints.phone,
                  },
                )}
                <Field
                  id={`qr-${data.type}-message`}
                  as="textarea"
                  rows={3}
                  label={f.fields.message[0] ?? ''}
                  placeholder={f.fields.message[1] ?? ''}
                  value={data[data.type].message}
                  onInput={(e) =>
                    patchIn(data.type as 'sms' | 'whatsapp', {
                      message: (e.currentTarget as HTMLTextAreaElement).value,
                    })
                  }
                />
              </>
            )}
            {data.type === 'geo' && (
              <>
                {input(
                  'latitude',
                  'lat',
                  f.fields.latitude,
                  data.geo.latitude,
                  (v) => patchIn('geo', { latitude: v }),
                  { inputmode: 'decimal', hint: f.hints.geo },
                )}
                {input(
                  'longitude',
                  'lng',
                  f.fields.longitude,
                  data.geo.longitude,
                  (v) => patchIn('geo', { longitude: v }),
                  { inputmode: 'decimal' },
                )}
              </>
            )}
            {data.type === 'vcard' && (
              <>
                {input(
                  'firstName',
                  'first',
                  f.fields.firstName,
                  data.vcard.firstName,
                  (v) => patchIn('vcard', { firstName: v }),
                  { autocomplete: 'off' },
                )}
                {input('lastName', 'last', f.fields.lastName, data.vcard.lastName, (v) =>
                  patchIn('vcard', { lastName: v }),
                )}
                {input('organization', 'org', f.fields.organization, data.vcard.organization, (v) =>
                  patchIn('vcard', { organization: v }),
                )}
                {input(
                  'phone',
                  'vphone',
                  f.fields.phone,
                  data.vcard.phone,
                  (v) => patchIn('vcard', { phone: v }),
                  { type: 'tel', inputmode: 'tel', hint: f.hints.phone },
                )}
                {input(
                  'email',
                  'vemail',
                  f.fields.vcardEmail,
                  data.vcard.email,
                  (v) => patchIn('vcard', { email: v }),
                  { type: 'email', inputmode: 'email' },
                )}
                {input(
                  'url',
                  'vurl',
                  f.fields.vcardUrl,
                  data.vcard.url,
                  (v) => patchIn('vcard', { url: v }),
                  { type: 'url', inputmode: 'url' },
                )}
                {input('street', 'street', f.fields.street, data.vcard.street, (v) =>
                  patchIn('vcard', { street: v }),
                )}
                {input('city', 'city', f.fields.city, data.vcard.city, (v) =>
                  patchIn('vcard', { city: v }),
                )}
                {input('region', 'region', f.fields.region, data.vcard.region, (v) =>
                  patchIn('vcard', { region: v }),
                )}
                {input('postalCode', 'postal', f.fields.postalCode, data.vcard.postalCode, (v) =>
                  patchIn('vcard', { postalCode: v }),
                )}
                {input('country', 'country', f.fields.country, data.vcard.country, (v) =>
                  patchIn('vcard', { country: v }),
                )}
              </>
            )}
            {data.type === 'event' && (
              <>
                {input('summary', 'summary', f.fields.summary, data.event.summary, (v) =>
                  patchIn('event', { summary: v }),
                )}
                {input(
                  'start',
                  'start',
                  f.fields.start,
                  data.event.start,
                  (v) => patchIn('event', { start: v }),
                  { type: 'datetime-local', placeholder: undefined },
                )}
                {input(
                  'end',
                  'end',
                  f.fields.end,
                  data.event.end,
                  (v) => patchIn('event', { end: v }),
                  { type: 'datetime-local', placeholder: undefined, hint: f.hints.eventTime(zone) },
                )}
                {input('location', 'location', f.fields.location, data.event.location, (v) =>
                  patchIn('event', { location: v }),
                )}
                <Field
                  id="qr-event-description"
                  as="textarea"
                  rows={3}
                  label={f.fields.description[0] ?? ''}
                  placeholder={f.fields.description[1] ?? ''}
                  value={data.event.description}
                  onInput={(e) =>
                    patchIn('event', {
                      description: (e.currentTarget as HTMLTextAreaElement).value,
                    })
                  }
                />
              </>
            )}
            {capacityError && (
              <p class="field-error" role="alert">
                {capacityError}
              </p>
            )}
          </div>
        </Collapsible>

        <Collapsible title={f.steps.look}>
          <div class="qr-fields">
            <SelectField
              id="qr-preset"
              label={f.look.preset}
              value={look.preset}
              onChange={(v) =>
                v === 'custom'
                  ? setLook((l) => ({ ...l, preset: 'custom' }))
                  : setLook(lookFromPreset(v as PresetId))
              }
            >
              {(Object.keys(PRESETS) as PresetId[]).map((id) => (
                <option key={id} value={id}>
                  {f.look.presets[id]}
                </option>
              ))}
              <option value="custom">{f.look.presets.custom}</option>
            </SelectField>
            <ShapePicker
              name="qr-body"
              legend={f.look.modules}
              value={look.moduleStyle}
              options={MODULE_STYLES.map((id) => ({
                id,
                label: f.look.moduleStyles[id],
                svg: THUMB_BODY[id],
              }))}
              onChange={(v) => changeLook({ moduleStyle: v as ModuleStyle })}
            />
            <ShapePicker
              name="qr-outer"
              legend={f.look.outer}
              value={look.finderOuter}
              options={FINDER_OUTER_STYLES.map((id) => ({
                id,
                label: f.look.outers[id],
                svg: THUMB_OUTER[id],
              }))}
              onChange={(v) => changeLook({ finderOuter: v as FinderOuterStyle })}
            />
            <ShapePicker
              name="qr-inner"
              legend={f.look.inner}
              value={look.finderInner}
              options={FINDER_INNER_STYLES.map((id) => ({
                id,
                label: f.look.inners[id],
                svg: THUMB_INNER[id],
              }))}
              onChange={(v) => changeLook({ finderInner: v as FinderInnerStyle })}
            />
            <p class="field-hint">{f.look.shapeNote}</p>
            <div class="field">
              <label for="qr-fg">{f.look.foreground}</label>
              <input
                id="qr-fg"
                type="color"
                value={look.foreground}
                onInput={(e) => changeLook({ foreground: e.currentTarget.value })}
              />
            </div>
            <Check checked={look.gradient} onChange={(v) => changeLook({ gradient: v })}>
              {f.look.gradient}
            </Check>
            {look.gradient && (
              <>
                <div class="field">
                  <label for="qr-fg2">{f.look.gradientTo}</label>
                  <input
                    id="qr-fg2"
                    type="color"
                    value={look.gradientTo}
                    onInput={(e) => changeLook({ gradientTo: e.currentTarget.value })}
                  />
                </div>
                <div class="field">
                  <label for="qr-angle">{f.look.gradientAngle}</label>
                  <input
                    id="qr-angle"
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={look.gradientAngle}
                    onInput={(e) => changeLook({ gradientAngle: Number(e.currentTarget.value) })}
                  />
                </div>
              </>
            )}
            <Check checked={look.transparent} onChange={(v) => changeLook({ transparent: v })}>
              {f.look.transparent}
            </Check>
            {!look.transparent && (
              <div class="field">
                <label for="qr-bg">{f.look.background}</label>
                <input
                  id="qr-bg"
                  type="color"
                  value={look.background}
                  onInput={(e) => changeLook({ background: e.currentTarget.value })}
                />
              </div>
            )}
            <div class="field">
              <label for="qr-margin">
                {f.look.margin} : {look.margin}
              </label>
              <input
                id="qr-margin"
                type="range"
                min="0"
                max="10"
                step="1"
                value={look.margin}
                aria-describedby="qr-margin-hint"
                onInput={(e) => changeLook({ margin: Number(e.currentTarget.value) })}
              />
              <p id="qr-margin-hint" class="field-hint">
                {f.look.marginHint}
              </p>
            </div>
          </div>
        </Collapsible>

        <Collapsible title={f.steps.logo}>
          <div class="qr-fields">
            <div class="field">
              <label for="qr-logo">{f.logo.file}</label>
              <input
                id="qr-logo"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                aria-describedby="qr-logo-hint"
                onChange={(e) => onLogoFile(e.currentTarget.files?.[0])}
              />
              <p id="qr-logo-hint" class="field-hint">
                {f.logo.hint}
              </p>
              {logoError && (
                <p class="field-error" role="alert">
                  {logoError}
                </p>
              )}
            </div>
            {logo && (
              <>
                <p class="field-hint">{f.logo.loaded(logo.name)}</p>
                <div class="field">
                  <label for="qr-logo-size">
                    {f.logo.size} : {Math.round(logoSettings.ratio * 100)}
                  </label>
                  <input
                    id="qr-logo-size"
                    type="range"
                    min="10"
                    max="50"
                    step="1"
                    value={Math.round(logoSettings.ratio * 100)}
                    aria-describedby="qr-logo-size-hint"
                    onInput={(e) =>
                      setLogoSettings((s) => ({ ...s, ratio: Number(e.currentTarget.value) / 100 }))
                    }
                  />
                  <p id="qr-logo-size-hint" class="field-hint">
                    {f.logo.sizeHint(logoArea)}
                  </p>
                </div>
                <div class="field">
                  <label for="qr-logo-pad">
                    {f.logo.padding} : {logoSettings.padding}
                  </label>
                  <input
                    id="qr-logo-pad"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={logoSettings.padding}
                    onInput={(e) =>
                      setLogoSettings((s) => ({ ...s, padding: Number(e.currentTarget.value) }))
                    }
                  />
                </div>
                <Check
                  checked={logoSettings.plate}
                  onChange={(v) => setLogoSettings((s) => ({ ...s, plate: v }))}
                >
                  {f.logo.plate}
                </Check>
                <ShapePicker
                  name="qr-logo-shape"
                  legend={f.logo.shape}
                  value={logoSettings.shape}
                  options={LOGO_SHAPES.map((id) => ({
                    id,
                    label: f.logo.shapes[id],
                    svg: THUMB_LOGO[id],
                  }))}
                  onChange={(v) => setLogoSettings((st) => ({ ...st, shape: v as LogoShape }))}
                />
                <p class="field-hint">{f.logo.autoLevel}</p>
                <Button onClick={() => setLogo(null)}>
                  <Trash2 size={16} aria-hidden="true" /> {f.logo.remove}
                </Button>
              </>
            )}
          </div>
        </Collapsible>

        <Collapsible title={f.steps.advanced}>
          <div class="qr-fields">
            <div class="field">
              <span id="qr-level-label" class="label">
                {f.advanced.level}
              </span>
              <div class="pill-group" role="radiogroup" aria-labelledby="qr-level-label">
                {(['L', 'M', 'Q', 'H'] as const).map((id) => (
                  <Radio
                    key={id}
                    name="qr-level"
                    value={id}
                    current={effLevel}
                    onChange={(v) => !logo && setLevel(v as ErrorLevel)}
                  >
                    {f.advanced.levels[id]}
                  </Radio>
                ))}
              </div>
              <p class="field-hint">{logo ? f.advanced.forcedH : f.advanced.levelHint}</p>
            </div>
            <Field
              id="qr-filename"
              label={f.advanced.filename}
              placeholder={`qr-code-${data.type}`}
              value={filename}
              onInput={(e) => setFilename((e.currentTarget as HTMLInputElement).value)}
              autocomplete="off"
            />
            <p>
              <Button onClick={reset}>
                <RotateCcw size={16} aria-hidden="true" /> {f.advanced.reset}
              </Button>
            </p>
          </div>
        </Collapsible>
      </div>

      <aside class="qr-preview" aria-label={r.title}>
        <div class="qr-sticky">
          <div class="qr-preview-card">
            <div class="qr-preview-head">
              <h3>{r.title}</h3>
              <div class="pill-group" role="radiogroup" aria-label={r.previewBackground}>
                <Radio
                  name="qr-bg"
                  value="light"
                  current={previewDark ? 'dark' : 'light'}
                  onChange={() => setPreviewDark(false)}
                >
                  {r.previewLight}
                </Radio>
                <Radio
                  name="qr-bg"
                  value="dark"
                  current={previewDark ? 'dark' : 'light'}
                  onChange={() => setPreviewDark(true)}
                >
                  {r.previewDark}
                </Radio>
              </div>
            </div>
            <div class={previewDark ? 'qr-stage qr-stage-dark' : 'qr-stage'}>
              {ready ? (
                <img
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
                  alt={r.previewAlt}
                  width="512"
                  height="512"
                />
              ) : (
                <p class="qr-empty">{r.empty}</p>
              )}
            </div>
            {matrix && matrix.ok && (
              <p class="meta qr-details">
                {r.details(matrix.matrix.size, matrix.matrix.version, effLevel, bytes)}
              </p>
            )}
          </div>
        </div>
        <div class="qr-export">
          <fieldset class="qr-resolution">
            <legend>{r.resolution}</legend>
            <div class="qr-res-grid">
              {EXPORT_SIZES.map((size) => (
                <label key={size} class="qr-res-opt">
                  <input
                    type="radio"
                    name="qr-res"
                    value={String(size)}
                    checked={sizePick === String(size)}
                    onChange={() => setSizePick(String(size))}
                  />
                  <span class="qr-res-px">{size}</span>
                  <span class="qr-res-use">{r.resolutionUse[size]}</span>
                </label>
              ))}
              <label class="qr-res-opt">
                <input
                  type="radio"
                  name="qr-res"
                  value="custom"
                  checked={sizePick === 'custom'}
                  onChange={() => setSizePick('custom')}
                />
                <span class="qr-res-px">···</span>
                <span class="qr-res-use">{r.resolutionCustom}</span>
              </label>
            </div>
            {sizePick === 'custom' && (
              <Field
                id="qr-res-custom"
                type="number"
                inputmode="numeric"
                min={128}
                max={8192}
                step={1}
                label={r.resolutionPx}
                hint={r.resolutionHint}
                value={customSize}
                onInput={(e) => setCustomSize((e.currentTarget as HTMLInputElement).value)}
              />
            )}
            <p class="field-hint">
              {r.resolutionSummary(
                exportSize,
                ((exportSize / 300) * 2.54).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
                  maximumFractionDigits: 1,
                }),
              )}
            </p>
          </fieldset>
          <div class="qr-actions">
            <Button variant="primary" disabled={!ready} loading={exporting} onClick={exportPng}>
              <Download size={16} aria-hidden="true" />{' '}
              {exporting ? r.generating : `${r.downloadPng} · ${exportSize} px`}
            </Button>
            <Button disabled={!ready} onClick={exportSvg}>
              <Download size={16} aria-hidden="true" /> {r.downloadSvg}
            </Button>
          </div>
          {exportError && (
            <p class="field-error" role="alert">
              {r.exportError}
            </p>
          )}
          {ready && (
            <section class="qr-warnings" aria-labelledby="qr-warn-title">
              <h3 id="qr-warn-title">{r.warningsTitle}</h3>
              {warnings.length === 0 ? (
                <p>{r.noWarnings}</p>
              ) : (
                <ul role="list">
                  {warnings.map((w) => {
                    const msg = r.warnings[w.id];
                    return (
                      <li
                        key={w.id}
                        class={w.severity === 'error' ? 'qr-warn qr-warn-error' : 'qr-warn'}
                      >
                        <strong>{w.severity === 'error' ? r.error : r.warn} : </strong>
                        {typeof msg === 'function' ? msg(w.value ?? 0) : msg}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
