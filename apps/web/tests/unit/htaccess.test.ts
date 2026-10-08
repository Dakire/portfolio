import { PROPAGATION_RESOLVERS } from '@grichard/tools-core/dns/propagation';
import { ENDPOINTS } from '@grichard/tools-core/dns/resolver';
import { describe, expect, it } from 'vitest';
// @ts-expect-error module JavaScript sans déclaration de types (script de build)
import { buildCsp, buildHtaccess } from '../../scripts/lib/htaccess.mjs';

const hashes = { script: ['sha256-AAA='], style: ['sha256-BBB='] };
const directive = (csp: string, name: string): string[] =>
  (csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? '').split(' ').slice(1);

describe('Content-Security-Policy', () => {
  const csp: string = buildCsp(hashes);

  it("autorise dans connect-src chaque résolveur interrogé par le navigateur (sinon l'outil échoue en production, pas en test)", () => {
    const connect = directive(csp, 'connect-src');
    for (const { url } of [...PROPAGATION_RESOLVERS, ...ENDPOINTS])
      expect(connect, url).toContain(new URL(url).origin);
  });

  it("n'autorise aucun script en ligne : seulement des empreintes", () => {
    const script = directive(csp, 'script-src');
    expect(script).toContain("'sha256-AAA='");
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
    expect(directive(csp, 'style-src')).not.toContain("'unsafe-inline'");
  });

  it('limite les attributs style au strict nécessaire et ferme les autres portes', () => {
    expect(directive(csp, 'style-src-attr')).toEqual(["'unsafe-inline'"]);
    expect(directive(csp, 'object-src')).toEqual(["'none'"]);
    expect(directive(csp, 'base-uri')).toEqual(["'self'"]);
    expect(directive(csp, 'form-action')).toEqual(["'self'"]);
    expect(directive(csp, 'frame-ancestors')).toEqual(["'self'"]);
    expect(directive(csp, 'frame-src')).toEqual(['https://challenges.cloudflare.com']);
  });
});

describe('.htaccess de production', () => {
  const file: string = buildHtaccess({ hashes });

  it('pose les en-têtes de sécurité', () => {
    for (const header of [
      'Strict-Transport-Security',
      'X-Content-Type-Options "nosniff"',
      'Cross-Origin-Opener-Policy',
      'Referrer-Policy',
      'Permissions-Policy',
      'Content-Security-Policy',
    ])
      expect(file).toContain(header);
  });

  it('redirige vers HTTPS, le domaine nu et sans index.html, et renvoie un vrai 404', () => {
    expect(file).toContain('RewriteBase /');
    expect(file).toContain('https://grichard.eu%{REQUEST_URI}');
    expect(file).toContain('ErrorDocument 404 /404.html');
  });

  it('cache les ressources versionnées longtemps et revalide le HTML', () => {
    expect(file).toContain('m#^/_astro/#');
    expect(file).toContain('immutable');
    expect(file).toMatch(/FilesMatch "\\\.\(html\|xml\|json\|txt\)\$"/);
  });

  it("n'indexe pas la production à l'envers : aucun X-Robots-Tag ni mot de passe", () => {
    expect(file).not.toContain('X-Robots-Tag');
    expect(file).not.toContain('AuthType');
  });

  it('sert ai-catalog.json en application/json et masque les fichiers sensibles', () => {
    expect(file).toContain('AddType application/json .json');
    expect(file).toContain('RedirectMatch 404 "/\\.(?!well-known/)"');
    expect(file).toContain('contact\\.config\\.php');
  });
});

describe('.htaccess de préproduction', () => {
  it('reste sous /preprod/, interdit l’indexation et ne protège par mot de passe que si un .htpasswd est fourni', () => {
    const open: string = buildHtaccess({ hashes, base: '/preprod' });
    expect(open).toContain('RewriteBase /preprod/');
    expect(open).toContain('ErrorDocument 404 /preprod/404.html');
    expect(open).toContain('m#^/preprod/_astro/#');
    expect(open).toContain('X-Robots-Tag "noindex, nofollow, noarchive"');
    expect(open).not.toContain('AuthType');

    const locked: string = buildHtaccess({
      hashes,
      base: '/preprod',
      authFile: '/home/x/.htpasswd',
    });
    expect(locked).toContain('AuthUserFile /home/x/.htpasswd');
    expect(locked).toContain('Require valid-user');
  });
});
