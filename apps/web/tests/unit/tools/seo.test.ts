import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  WRITERS,
  describeCheck,
  type CheckStatus,
  type SeoCheck,
} from '../../../src/tools/seo/checks';
import { SEO_TOOL } from '../../../src/tools/seo/text';

// Identifiants des contrôles produits par le serveur : lus dans le code PHP, pour qu'un contrôle ajouté côté serveur
// ne s'affiche jamais sans texte.
const php = readFileSync('../api/src/Seo/SeoAnalyzer.php', 'utf-8');
const serverIds = [...new Set([...php.matchAll(/\$this->add\('([a-z0-9_]+)'/g)].map((m) => m[1]!))];

describe('rapport SEO : rédaction des contrôles', () => {
  it('trouve les contrôles dans le code du serveur', () => {
    expect(serverIds.length).toBeGreaterThan(25);
  });

  it('chaque contrôle du serveur est rédigé, et rien de plus', () => {
    expect(Object.keys(WRITERS).sort()).toEqual([...serverIds].sort());
  });

  it('chaque contrôle a un titre et, en échec, une correction, dans les deux langues', () => {
    for (const id of serverIds) {
      for (const lang of ['fr', 'en'] as const) {
        for (const status of ['pass', 'warn', 'fail', 'info'] as CheckStatus[]) {
          const check: SeoCheck = { id, category: 'meta', severity: 'important', status, data: {} };
          const d = describeCheck(check, lang);
          expect(d.title, `${id} ${lang} ${status}`).not.toBe('');
          expect(d.title, `${id} ${lang} ${status}`).not.toContain('undefined');
          if (status === 'fail' && id !== 'links') expect(d.fix, `${id} ${lang}`).not.toBe('');
        }
      }
    }
  });

  it('les valeurs mesurées apparaissent dans le texte', () => {
    const title: SeoCheck = {
      id: 'title',
      category: 'meta',
      severity: 'critical',
      status: 'warn',
      data: { value: 'Accueil', length: 7 },
    };
    expect(describeCheck(title, 'fr')).toMatchObject({
      title: 'Titre de 7 caractères (30 à 60 conseillés)',
      detail: '« Accueil »',
    });
    expect(describeCheck(title, 'en').detail).toBe('“Accueil”');
  });

  it('chaque code d’erreur du serveur a un message dans les deux langues', () => {
    for (const code of [
      'invalid_url',
      'blocked_address',
      'dns_failure',
      'timeout',
      'tls_error',
      'too_many_redirects',
      'connection_failed',
      'captcha',
      'csrf',
      'rate_limited',
      'unavailable',
      'generic',
    ])
      for (const lang of ['fr', 'en'] as const)
        expect(SEO_TOOL[lang].ui.errors[code], `${code} ${lang}`).toBeTruthy();
  });
});
