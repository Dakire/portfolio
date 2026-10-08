// Fournisseurs de messagerie : reconnus par leurs MX et leurs include SPF, ils permettent de deviner les sélecteurs DKIM.
// Les sélecteurs listés sont ceux que le fournisseur documente ; un fournisseur dont le sélecteur varie par client n'en liste pas.
export interface Provider {
  id: string;
  name: string;
  mx: RegExp[];
  spf: RegExp[];
  selectors: string[];
}

export const PROVIDERS: Provider[] = [
  {
    id: 'google',
    name: 'Google Workspace',
    mx: [/(^|\.)aspmx\.l\.google\.com$/, /(^|\.)googlemail\.com$/, /(^|\.)smtp\.google\.com$/],
    spf: [/^_spf\.google\.com$/, /^_netblocks\d?\.google\.com$/],
    selectors: ['google'],
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    mx: [/\.mail\.protection\.outlook\.com$/],
    spf: [/^spf\.protection\.outlook\.com$/],
    selectors: ['selector1', 'selector2'],
  },
  {
    id: 'ovh',
    name: 'OVHcloud',
    mx: [/(^|\.)mail\.ovh\.net$/, /(^|\.)mx\d*\.ovh\.(net|com)$/, /(^|\.)ovh\.net$/],
    spf: [/^mx\.ovh\.com$/, /^spf\.ovh\.com$/, /(^|\.)mail\.ovh\.net$/],
    selectors: ['ovhmo-selector-1', 'ovhmo-selector-2'],
  },
  {
    id: 'zoho',
    name: 'Zoho Mail',
    mx: [/(^|\.)zoho\.(com|eu|in|com\.au)$/],
    spf: [/^(_spf\.)?zoho\.(com|eu|in|com\.au)$/],
    selectors: ['zoho', 'zmail'],
  },
  {
    id: 'proton',
    name: 'Proton Mail',
    mx: [/(^|\.)protonmail\.ch$/],
    spf: [/^_spf\.protonmail\.ch$/],
    selectors: ['protonmail', 'protonmail2', 'protonmail3'],
  },
  {
    id: 'fastmail',
    name: 'Fastmail',
    mx: [/(^|\.)messagingengine\.com$/],
    spf: [/^spf\.messagingengine\.com$/],
    selectors: ['fm1', 'fm2', 'fm3'],
  },
  {
    id: 'ionos',
    name: 'IONOS',
    mx: [/(^|\.)ionos\.(fr|com|de)$/, /(^|\.)kundenserver\.de$/],
    spf: [/^_spf-eu\.ionos\.com$/, /^_spf\.perfora\.net$/],
    selectors: [],
  },
  {
    id: 'gandi',
    name: 'Gandi',
    mx: [/(^|\.)gandi\.net$/],
    spf: [/^_mailcust\.gandi\.net$/],
    selectors: [],
  },
  {
    id: 'godaddy',
    name: 'GoDaddy',
    mx: [/(^|\.)secureserver\.net$/],
    spf: [/^secureserver\.net$/],
    selectors: [],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Email Routing',
    mx: [/(^|\.)mx\.cloudflare\.net$/],
    spf: [/^_spf\.mx\.cloudflare\.net$/],
    selectors: [],
  },
  {
    id: 'mimecast',
    name: 'Mimecast',
    mx: [/(^|\.)mimecast\.com$/],
    spf: [/(^|\.)mimecast\.com$/],
    selectors: [],
  },
  {
    id: 'proofpoint',
    name: 'Proofpoint',
    mx: [/(^|\.)pphosted\.com$/],
    spf: [/(^|\.)pphosted\.com$/],
    selectors: [],
  },
  { id: 'sendgrid', name: 'SendGrid', mx: [], spf: [/^sendgrid\.net$/], selectors: ['s1', 's2'] },
  {
    id: 'mailchimp',
    name: 'Mailchimp / Mandrill',
    mx: [],
    spf: [/^servers\.mcsv\.net$/, /^spf\.mandrillapp\.com$/],
    selectors: ['k1', 'k2', 'k3', 'mte1', 'mte2'],
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    mx: [],
    spf: [/^mailgun\.org$/],
    selectors: ['smtp', 'k1', 'krs'],
  },
  {
    id: 'brevo',
    name: 'Brevo (Sendinblue)',
    mx: [],
    spf: [/^(spf\.)?(sendinblue|brevo)\.com$/],
    selectors: ['brevo1', 'brevo2', 'mail'],
  },
  { id: 'mailjet', name: 'Mailjet', mx: [], spf: [/^spf\.mailjet\.com$/], selectors: ['mailjet'] },
  { id: 'amazonses', name: 'Amazon SES', mx: [], spf: [/^amazonses\.com$/], selectors: [] },
  { id: 'postmark', name: 'Postmark', mx: [], spf: [/^spf\.mtasv\.net$/], selectors: [] },
  {
    id: 'zendesk',
    name: 'Zendesk',
    mx: [],
    spf: [/^mail\.zendesk\.com$/],
    selectors: ['zendesk1', 'zendesk2'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    mx: [],
    spf: [/(^|\.)hubspotemail\.net$/],
    selectors: ['hs1', 'hs2'],
  },
];

/** Sélecteurs courants, essayés après ceux des fournisseurs reconnus. */
export const GENERIC_SELECTORS = [
  'default',
  'dkim',
  'mail',
  'email',
  'smtp',
  'key1',
  'selector',
  's1',
  's2',
];

const stripDot = (s: string): string => s.toLowerCase().replace(/\.$/, '');

/** Fournisseurs reconnus d'après les hôtes MX et les domaines inclus dans le SPF. */
export function detectProviders({
  mxHosts = [],
  spfIncludes = [],
}: {
  mxHosts?: string[];
  spfIncludes?: string[];
}): (Provider & { via: string[] })[] {
  const found: (Provider & { via: string[] })[] = [];
  for (const p of PROVIDERS) {
    const viaMx = mxHosts.map(stripDot).some((h) => p.mx.some((re) => re.test(h)));
    const viaSpf = spfIncludes.map(stripDot).some((d) => p.spf.some((re) => re.test(d)));
    if (viaMx || viaSpf)
      found.push({
        ...p,
        via: [viaMx && 'mx', viaSpf && 'spf'].filter((x): x is string => Boolean(x)),
      });
  }
  return found;
}

/** Sélecteurs à essayer quand l'utilisateur n'en précise pas : fournisseurs reconnus d'abord, puis noms courants. */
export function guessSelectors(
  providers: Provider[],
): { selector: string; provider: string | null }[] {
  const list: { selector: string; provider: string | null }[] = [];
  const seen = new Set<string>();
  const add = (selector: string, provider: string | null) => {
    if (!seen.has(selector)) {
      seen.add(selector);
      list.push({ selector, provider });
    }
  };
  for (const p of providers) p.selectors.forEach((s) => add(s, p.name));
  GENERIC_SELECTORS.forEach((s) => add(s, null));
  return list;
}
