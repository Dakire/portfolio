// TXT à la racine du domaine : classement (SPF, validations de propriété…), doublons exacts, enregistrements mal placés.
import { finding, type Finding } from './findings.js';
import { isDmarcRecord } from './dmarc.js';
import { isSpfRecord } from './spf.js';

const VERIFICATIONS: [RegExp, string][] = [
  [/^google-site-verification=/i, 'Google'],
  [/^MS=ms\d+/i, 'Microsoft 365'],
  [/^facebook-domain-verification=/i, 'Meta'],
  [/^apple-domain-verification=/i, 'Apple'],
  [/^atlassian-domain-verification=/i, 'Atlassian'],
  [/^docusign=/i, 'DocuSign'],
  [/^_github-challenge-/i, 'GitHub'],
  [/^zoho-verification=/i, 'Zoho'],
  [/^stripe-verification=/i, 'Stripe'],
  [/^adobe-idp-site-verification=/i, 'Adobe'],
  [/^onetrust-domain-verification=/i, 'OneTrust'],
  [/^ahrefs-site-verification_/i, 'Ahrefs'],
  [/^openai-domain-verification=/i, 'OpenAI'],
  [/^brevo-code:/i, 'Brevo'],
  [/^mailchimp=/i, 'Mailchimp'],
];

/** Famille d'un TXT : 'spf' | 'dmarc' | 'dkim' | 'verification' | 'bimi' | 'other' (+ le fournisseur pour les validations). */
export type TxtKind = 'spf' | 'dmarc' | 'dkim' | 'bimi' | 'verification' | 'other';

export function classifyTxt(text: string): { kind: TxtKind; vendor?: string } {
  if (isSpfRecord(text)) return { kind: 'spf' };
  if (isDmarcRecord(text)) return { kind: 'dmarc' };
  if (/^\s*v\s*=\s*DKIM1/i.test(text)) return { kind: 'dkim' };
  if (/^\s*v\s*=\s*BIMI1/i.test(text)) return { kind: 'bimi' };
  const vendor = VERIFICATIONS.find(([re]) => re.test(text.trim()));
  return vendor ? { kind: 'verification', vendor: vendor[1] } : { kind: 'other' };
}

export function analyzeTxt({
  records,
}: {
  records: { text: string; parts: string[]; ttl: number; name: string }[];
}) {
  const findings: Finding[] = [];
  const items = records.map((r) => ({ ...r, ...classifyTxt(r.text) }));

  if (items.length === 0) {
    findings.push(finding('txt.none', 'info'));
    return { items, findings };
  }
  findings.push(finding('txt.count', 'info', { count: items.length }));

  const seen = new Map<string, number>();
  for (const r of items) {
    const key = r.text.trim();
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if (!key) findings.push(finding('txt.empty', 'warn'));
    else if (r.text !== key)
      findings.push(finding('txt.whitespace', 'info', { value: key.slice(0, 40) }));
  }
  for (const [text, count] of seen)
    if (count > 1 && text)
      findings.push(finding('txt.duplicate', 'warn', { value: text.slice(0, 60), count }));

  if (items.some((r) => r.kind === 'dmarc')) findings.push(finding('txt.dmarcAtApex', 'warn'));
  if (items.some((r) => r.kind === 'dkim')) findings.push(finding('txt.dkimAtApex', 'warn'));
  const vendors = [...new Set(items.filter((r) => r.kind === 'verification').map((r) => r.vendor))];
  if (vendors.length)
    findings.push(finding('txt.verification', 'info', { vendors: vendors.join(', ') }));
  return { items, findings };
}
