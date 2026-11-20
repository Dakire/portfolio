// Contenus encodés dans un QR code : une fonction pure par type, sans DOM ni texte d'interface.
// Chaque fonction renvoie le texte exact à encoder, ou un code d'erreur (le texte du message est dans l'interface).
// Formats : Wi-Fi (convention ZXing, reprise par Android et iOS), mailto (RFC 6068), tel (RFC 3966 / E.164), SMSTO,
// wa.me, geo (RFC 5870), vCard 3.0 (RFC 2426), VEVENT (RFC 5545).

export type PayloadError =
  | 'required'
  | 'url'
  | 'ssid'
  | 'email'
  | 'phone'
  | 'latitude'
  | 'longitude'
  | 'name'
  | 'dates'
  | 'order';

export type Built =
  { ok: true; value: string } | { ok: false; error: PayloadError; field?: string };

const ok = (value: string): Built => ({ ok: true, value });
const fail = (error: PayloadError, field?: string): Built => ({ ok: false, error, field });
const CRLF = '\r\n';

/** URL http ou https uniquement. Sans schéma, https:// est ajouté. */
export function urlPayload(input: string): Built {
  const raw = input.trim();
  if (!raw) return fail('required', 'url');
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fail('url', 'url');
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return fail('url', 'url');
    return ok(url.href);
  } catch {
    return fail('url', 'url');
  }
}

export function textPayload(input: string): Built {
  return input.length === 0 ? fail('required', 'text') : ok(input);
}

/** Longueur en octets UTF-8 (un QR code encode des octets : un accent en vaut 2, un emoji 4). */
export const utf8Length = (text: string): number => new TextEncoder().encode(text).length;

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

/** Échappe \ ; , : " avec un antislash (format Wi-Fi). */
const escapeWifi = (value: string): string => value.replace(/([\\;,:"])/g, '\\$1');
/** Un SSID ou un mot de passe qui ne contient que des chiffres hexadécimaux est mis entre guillemets, sinon il serait lu comme de l'hexadécimal. */
const wifiValue = (value: string): string =>
  /^[0-9a-f]+$/i.test(value) ? `"${escapeWifi(value)}"` : escapeWifi(value);

export interface WifiInput {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}

/** WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<mot de passe>;H:true;; ; WPA2 et WPA3 s'écrivent T:WPA (lu par le plus grand nombre d'appareils). */
export function wifiPayload(input: WifiInput): Built {
  if (!input.ssid) return fail('ssid', 'ssid');
  const parts = [`T:${input.security}`, `S:${wifiValue(input.ssid)}`];
  if (input.security !== 'nopass' && input.password) parts.push(`P:${wifiValue(input.password)}`);
  if (input.hidden) parts.push('H:true');
  return ok(`WIFI:${parts.join(';')};;`);
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
export const isEmail = (value: string): boolean => EMAIL_RE.test(value.trim());

/** mailto:destinataire?subject=…&body=… (objet et corps encodés en pourcentage). */
export function emailPayload(input: { to: string; subject: string; body: string }): Built {
  const to = input.to.trim();
  if (!to) return fail('required', 'to');
  if (!isEmail(to)) return fail('email', 'to');
  const query: string[] = [];
  if (input.subject) query.push(`subject=${encodeURIComponent(input.subject)}`);
  if (input.body) query.push(`body=${encodeURIComponent(input.body)}`);
  return ok(`mailto:${to}${query.length ? `?${query.join('&')}` : ''}`);
}

/** Numéro au format E.164 (+ puis 7 à 15 chiffres) : les séparateurs sont retirés, 00 devient +. Null si le format est invalide. */
export function normalizePhone(input: string): string | null {
  let value = input.replace(/[\s().-]/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  return /^\+[1-9]\d{6,14}$/.test(value) ? value : null;
}

export function phonePayload(input: string): Built {
  if (!input.trim()) return fail('required', 'phone');
  const number = normalizePhone(input);
  return number ? ok(`tel:${number}`) : fail('phone', 'phone');
}

/** SMSTO:<numéro>:<message> */
export function smsPayload(input: { phone: string; message: string }): Built {
  if (!input.phone.trim()) return fail('required', 'phone');
  const number = normalizePhone(input.phone);
  if (!number) return fail('phone', 'phone');
  return ok(`SMSTO:${number}:${input.message}`);
}

/** https://wa.me/<numéro sans +>?text=<message encodé> */
export function whatsappPayload(input: { phone: string; message: string }): Built {
  if (!input.phone.trim()) return fail('required', 'phone');
  const number = normalizePhone(input.phone);
  if (!number) return fail('phone', 'phone');
  const text = input.message ? `?text=${encodeURIComponent(input.message)}` : '';
  return ok(`https://wa.me/${number.slice(1)}${text}`);
}

const parseCoordinate = (value: string): number | null => {
  const text = value.trim().replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : null;
};

/** geo:<latitude>,<longitude> (latitude de −90 à 90, longitude de −180 à 180). */
export function geoPayload(input: { latitude: string; longitude: string }): Built {
  if (!input.latitude.trim()) return fail('required', 'latitude');
  if (!input.longitude.trim()) return fail('required', 'longitude');
  const lat = parseCoordinate(input.latitude);
  const lng = parseCoordinate(input.longitude);
  if (lat === null || lat < -90 || lat > 90) return fail('latitude', 'latitude');
  if (lng === null || lng < -180 || lng > 180) return fail('longitude', 'longitude');
  return ok(`geo:${lat},${lng}`);
}

/** Échappement des valeurs vCard (RFC 2426) et iCalendar (RFC 5545) : \ , ; et sauts de ligne. */
const escapeText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r\n|\r|\n/g, '\\n');

export interface VCardInput {
  firstName: string;
  lastName: string;
  organization: string;
  phone: string;
  email: string;
  url: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

/** vCard 3.0, lignes séparées par CRLF. Champs : N, FN, ORG, TEL, EMAIL, URL, ADR (les champs vides sont omis). */
export function vcardPayload(input: VCardInput): Built {
  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (!first && !last) return fail('name', 'firstName');
  if (input.email.trim() && !isEmail(input.email)) return fail('email', 'email');
  let phone = '';
  if (input.phone.trim()) {
    const normalized = normalizePhone(input.phone);
    if (!normalized) return fail('phone', 'phone');
    phone = normalized;
  }
  let url = '';
  if (input.url.trim()) {
    const built = urlPayload(input.url);
    if (!built.ok) return fail('url', 'url');
    url = built.value;
  }
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeText(last)};${escapeText(first)};;;`,
    `FN:${escapeText([first, last].filter(Boolean).join(' '))}`,
  ];
  if (input.organization.trim()) lines.push(`ORG:${escapeText(input.organization.trim())}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
  if (input.email.trim()) lines.push(`EMAIL:${input.email.trim()}`);
  if (url) lines.push(`URL:${url}`);
  const address = [input.street, input.city, input.region, input.postalCode, input.country].map(
    (v) => v.trim(),
  );
  if (address.some(Boolean)) lines.push(`ADR;TYPE=WORK:;;${address.map(escapeText).join(';')}`);
  lines.push('END:VCARD');
  return ok(lines.join(CRLF));
}

/** Date UTC au format iCalendar : 20261120T090000Z. */
export const icsUtc = (date: Date): string =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

export interface EventInput {
  summary: string;
  start: Date | null;
  end: Date | null;
  location: string;
  description: string;
}

/** BEGIN:VEVENT … END:VEVENT ; dates en UTC (le navigateur convertit l'heure locale saisie). */
export function eventPayload(input: EventInput): Built {
  if (!input.summary.trim()) return fail('required', 'summary');
  if (!input.start || Number.isNaN(input.start.getTime())) return fail('dates', 'start');
  if (!input.end || Number.isNaN(input.end.getTime())) return fail('dates', 'end');
  if (input.end.getTime() < input.start.getTime()) return fail('order', 'end');
  const lines = [
    'BEGIN:VEVENT',
    `SUMMARY:${escapeText(input.summary.trim())}`,
    `DTSTART:${icsUtc(input.start)}`,
    `DTEND:${icsUtc(input.end)}`,
  ];
  if (input.location.trim()) lines.push(`LOCATION:${escapeText(input.location.trim())}`);
  if (input.description.trim()) lines.push(`DESCRIPTION:${escapeText(input.description.trim())}`);
  lines.push('END:VEVENT');
  return ok(lines.join(CRLF));
}
