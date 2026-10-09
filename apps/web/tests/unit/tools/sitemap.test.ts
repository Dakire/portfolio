import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { CheckStatus, ServerCheck } from '../../../src/tools/server/types';
import { WRITERS, describeCheck } from '../../../src/tools/sitemap/checks';

// Identifiants des contrôles du serveur, lus dans SitemapChecker.php : aucun contrôle ne doit s'afficher sans texte.
const php = readFileSync('../api/src/Sitemap/SitemapChecker.php', 'utf-8');
const serverIds = [...new Set([...php.matchAll(/\$this->add\('([a-z0-9_]+)'/g)].map((m) => m[1]!))];

describe('vérificateur de sitemap : rédaction des contrôles', () => {
  it('chaque contrôle du serveur est rédigé, et rien de plus', () => {
    expect(serverIds.length).toBeGreaterThan(15);
    expect(Object.keys(WRITERS).sort()).toEqual([...serverIds].sort());
  });

  it('chaque contrôle a un titre et, en échec, une correction, dans les deux langues', () => {
    for (const id of serverIds) {
      for (const lang of ['fr', 'en'] as const) {
        for (const status of ['pass', 'warn', 'fail', 'info'] as CheckStatus[]) {
          const check: ServerCheck = {
            id,
            category: 'urls',
            severity: 'important',
            status,
            data: {},
          };
          const d = describeCheck(check, lang);
          expect(d.title, `${id} ${lang} ${status}`).not.toBe('');
          expect(`${d.title} ${d.detail}`, `${id} ${lang} ${status}`).not.toContain('undefined');
          if (status === 'fail' && id !== 'structure') expect(d.fix, `${id} ${lang}`).not.toBe('');
        }
      }
    }
  });

  it('reprend les valeurs mesurées', () => {
    const lastmod: ServerCheck = {
      id: 'lastmod',
      category: 'urls',
      severity: 'important',
      status: 'fail',
      data: { with: 3, total: 3, invalid: 1, future: 2, examples: ['09/10/2026'] },
    };
    expect(describeCheck(lastmod, 'fr')).toMatchObject({
      title: '1 date(s) invalide(s), 2 dans le futur',
      detail: '09/10/2026',
    });
  });
});
