import { describe, expect, it } from 'vitest';
import {
  emailPayload,
  eventPayload,
  geoPayload,
  icsUtc,
  normalizePhone,
  phonePayload,
  smsPayload,
  textPayload,
  urlPayload,
  utf8Length,
  vcardPayload,
  whatsappPayload,
  wifiPayload,
} from '../src/qr/payloads';

const value = (built: { ok: boolean; value?: string }) => (built.ok ? built.value : undefined);

describe('URL', () => {
  it('accepte http et https, ajoute https:// sans schéma', () => {
    expect(value(urlPayload('https://grichard.eu/outils/'))).toBe('https://grichard.eu/outils/');
    expect(value(urlPayload('grichard.eu'))).toBe('https://grichard.eu/');
    expect(value(urlPayload('http://exemple.fr/a?b=1'))).toBe('http://exemple.fr/a?b=1');
  });
  it('refuse les autres schémas et les adresses incomplètes', () => {
    for (const bad of [
      'javascript:alert(1)',
      'ftp://exemple.fr',
      'data:text/html,x',
      'pas une url',
      'monserveur',
    ])
      expect(urlPayload(bad).ok, bad).toBe(false);
  });
  it('signale un champ vide', () => {
    expect(urlPayload('  ')).toEqual({ ok: false, error: 'required', field: 'url' });
  });
});

describe('texte', () => {
  it('garde accents, emojis et sauts de ligne tels quels', () => {
    expect(value(textPayload('Été à Évry 🚗\nligne 2'))).toBe('Été à Évry 🚗\nligne 2');
    expect(textPayload('').ok).toBe(false);
  });
  it('compte les octets UTF-8 (un accent en vaut 2, un emoji 4)', () => {
    expect(utf8Length('abc')).toBe(3);
    expect(utf8Length('é')).toBe(2);
    expect(utf8Length('🚗')).toBe(4);
  });
});

describe('Wi-Fi', () => {
  it('produit le format WIFI:T:…;S:…;P:…;;', () => {
    expect(
      value(wifiPayload({ ssid: 'Maison', password: 'secret12', security: 'WPA', hidden: false })),
    ).toBe('WIFI:T:WPA;S:Maison;P:secret12;;');
  });
  it('échappe \\ ; , : " avec un antislash', () => {
    expect(
      value(wifiPayload({ ssid: 'a;b,c:d"e\\f', password: 'x;y', security: 'WPA', hidden: false })),
    ).toBe('WIFI:T:WPA;S:a\\;b\\,c\\:d\\"e\\\\f;P:x\\;y;;');
  });
  it('met entre guillemets un SSID ou un mot de passe qui ressemble à de l’hexadécimal', () => {
    expect(
      value(wifiPayload({ ssid: 'cafe01', password: '12345678', security: 'WPA', hidden: false })),
    ).toBe('WIFI:T:WPA;S:"cafe01";P:"12345678";;');
  });
  it('omet le mot de passe sans sécurité, ajoute H:true pour un réseau masqué', () => {
    expect(
      value(wifiPayload({ ssid: 'Invités', password: 'ignoré', security: 'nopass', hidden: true })),
    ).toBe('WIFI:T:nopass;S:Invités;H:true;;');
    expect(
      value(wifiPayload({ ssid: 'Box', password: 'abcdefgh', security: 'WEP', hidden: false })),
    ).toBe('WIFI:T:WEP;S:Box;P:abcdefgh;;');
  });
  it('exige un SSID', () => {
    expect(wifiPayload({ ssid: '', password: 'x', security: 'WPA', hidden: false })).toEqual({
      ok: false,
      error: 'ssid',
      field: 'ssid',
    });
  });
});

describe('e-mail', () => {
  it('encode objet et corps (accents, espaces, esperluette, emojis)', () => {
    expect(
      value(
        emailPayload({
          to: 'contact@grichard.eu',
          subject: 'Bonjour & merci',
          body: 'Été 🚗\nFin',
        }),
      ),
    ).toBe(
      'mailto:contact@grichard.eu?subject=Bonjour%20%26%20merci&body=%C3%89t%C3%A9%20%F0%9F%9A%97%0AFin',
    );
  });
  it('accepte un destinataire seul', () => {
    expect(value(emailPayload({ to: ' a@b.fr ', subject: '', body: '' }))).toBe('mailto:a@b.fr');
  });
  it('refuse une adresse invalide ou absente', () => {
    expect(emailPayload({ to: 'pas-un-mail', subject: '', body: '' }).ok).toBe(false);
    expect(emailPayload({ to: '', subject: '', body: '' })).toEqual({
      ok: false,
      error: 'required',
      field: 'to',
    });
  });
});

describe('téléphone, SMS, WhatsApp', () => {
  it('normalise au format E.164', () => {
    expect(normalizePhone('+33 6 12 34 56 78')).toBe('+33612345678');
    expect(normalizePhone('0033 6.12.34.56.78')).toBe('+33612345678');
    expect(normalizePhone('+1 (415) 555-0100')).toBe('+14155550100');
    expect(normalizePhone('06 12 34 56 78')).toBeNull();
    expect(normalizePhone('+0123456789')).toBeNull();
    expect(normalizePhone('+123')).toBeNull();
  });
  it('tel:', () => {
    expect(value(phonePayload('+33 6 12 34 56 78'))).toBe('tel:+33612345678');
    expect(phonePayload('0612345678').ok).toBe(false);
  });
  it('SMSTO conserve le message tel quel, deux-points compris', () => {
    expect(value(smsPayload({ phone: '+33612345678', message: 'RDV à 10:30 ✅' }))).toBe(
      'SMSTO:+33612345678:RDV à 10:30 ✅',
    );
    expect(value(smsPayload({ phone: '+33612345678', message: '' }))).toBe('SMSTO:+33612345678:');
  });
  it('WhatsApp : numéro sans +, message encodé', () => {
    expect(value(whatsappPayload({ phone: '+33 6 12 34 56 78', message: 'Salut ! 👋' }))).toBe(
      'https://wa.me/33612345678?text=Salut%20!%20%F0%9F%91%8B',
    );
    expect(value(whatsappPayload({ phone: '+33612345678', message: '' }))).toBe(
      'https://wa.me/33612345678',
    );
  });
});

describe('géolocalisation', () => {
  it('produit geo:lat,lng (virgule décimale acceptée)', () => {
    expect(value(geoPayload({ latitude: '48.8566', longitude: '2.3522' }))).toBe(
      'geo:48.8566,2.3522',
    );
    expect(value(geoPayload({ latitude: '48,8566', longitude: '-2,3522' }))).toBe(
      'geo:48.8566,-2.3522',
    );
  });
  it('valide les bornes', () => {
    expect(geoPayload({ latitude: '90.1', longitude: '0' })).toEqual({
      ok: false,
      error: 'latitude',
      field: 'latitude',
    });
    expect(geoPayload({ latitude: '0', longitude: '-180.5' })).toEqual({
      ok: false,
      error: 'longitude',
      field: 'longitude',
    });
    expect(value(geoPayload({ latitude: '-90', longitude: '180' }))).toBe('geo:-90,180');
    expect(geoPayload({ latitude: 'abc', longitude: '0' }).ok).toBe(false);
    expect(geoPayload({ latitude: '', longitude: '0' }).ok).toBe(false);
  });
});

describe('vCard 3.0', () => {
  const base = {
    firstName: 'Guillaume',
    lastName: 'Richard',
    organization: '',
    phone: '',
    email: '',
    url: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
  };
  it('produit les lignes en CRLF, champs vides omis', () => {
    expect(value(vcardPayload(base))).toBe(
      'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Richard;Guillaume;;;\r\nFN:Guillaume Richard\r\nEND:VCARD',
    );
  });
  it('échappe virgules, points-virgules, antislash et sauts de ligne', () => {
    const built = vcardPayload({
      ...base,
      organization: 'Dupont, Fils; Cie',
      street: 'Rue A\nBât. B',
    });
    expect(value(built)).toContain('ORG:Dupont\\, Fils\\; Cie');
    expect(value(built)).toContain('ADR;TYPE=WORK:;;Rue A\\nBât. B;;;;');
  });
  it('gère accents et emojis, normalise le téléphone, contrôle e-mail et URL', () => {
    const built = vcardPayload({ ...base, firstName: 'Zoé 🚗', phone: '06 12 34 56 78' });
    expect(built.ok).toBe(false);
    const good = vcardPayload({
      ...base,
      firstName: 'Zoé 🚗',
      phone: '+33 6 12 34 56 78',
      email: 'zoe@exemple.fr',
      url: 'exemple.fr',
    });
    expect(value(good)).toContain('FN:Zoé 🚗 Richard');
    expect(value(good)).toContain('TEL;TYPE=CELL:+33612345678');
    expect(value(good)).toContain('EMAIL:zoe@exemple.fr');
    expect(value(good)).toContain('URL:https://exemple.fr/');
    expect(vcardPayload({ ...base, email: 'x' }).ok).toBe(false);
    expect(vcardPayload({ ...base, url: 'javascript:1' }).ok).toBe(false);
  });
  it('exige un nom ou un prénom', () => {
    expect(vcardPayload({ ...base, firstName: '', lastName: '' })).toEqual({
      ok: false,
      error: 'name',
      field: 'firstName',
    });
  });
});

describe('événement', () => {
  const start = new Date(Date.UTC(2026, 10, 20, 9, 0, 0));
  const end = new Date(Date.UTC(2026, 10, 20, 10, 30, 0));
  it('formate les dates en UTC', () => {
    expect(icsUtc(start)).toBe('20261120T090000Z');
  });
  it('produit VEVENT en CRLF avec échappement', () => {
    expect(
      value(
        eventPayload({
          summary: 'Réunion, étape 1',
          start,
          end,
          location: 'Salle A; étage 2',
          description: 'Ligne 1\nLigne 2',
        }),
      ),
    ).toBe(
      'BEGIN:VEVENT\r\nSUMMARY:Réunion\\, étape 1\r\nDTSTART:20261120T090000Z\r\nDTEND:20261120T103000Z\r\nLOCATION:Salle A\\; étage 2\r\nDESCRIPTION:Ligne 1\\nLigne 2\r\nEND:VEVENT',
    );
  });
  it('omet lieu et description vides, refuse une fin avant le début ou des dates absentes', () => {
    expect(
      value(eventPayload({ summary: 'X', start, end, location: '', description: '' })),
    ).not.toContain('LOCATION');
    expect(
      eventPayload({ summary: 'X', start: end, end: start, location: '', description: '' }),
    ).toEqual({ ok: false, error: 'order', field: 'end' });
    expect(eventPayload({ summary: 'X', start: null, end, location: '', description: '' }).ok).toBe(
      false,
    );
    expect(eventPayload({ summary: '', start, end, location: '', description: '' }).ok).toBe(false);
  });
});
