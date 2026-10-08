// Générateur du .htaccess (Apache, OVH hosting-free) : en-têtes de sécurité, CSP, cache, redirections, fichiers non publics.
// Produit à chaque build à partir des empreintes SHA-256 des scripts en ligne (.cache/csp-hashes.json) : la CSP n'a jamais besoin
// de « 'unsafe-inline' » pour les scripts. Production : base « » ; préproduction : base « /preprod » (voir ADR 0002).

/** Résolveurs DNS-over-HTTPS interrogés par le navigateur (outils DNS) : à garder alignés avec tools-core, vérifié par tests/unit/htaccess.test.ts. */
export const DOH_ORIGINS = [
  'https://cloudflare-dns.com',
  'https://dns.google',
  'https://dns.quad9.net',
  'https://doh.dns.sb',
  'https://dnsforge.de',
  'https://odvr.nic.cz',
  'https://freedns.controld.com',
  'https://public.dns.iij.jp',
  'https://dns.alidns.com',
];

const GA_CONNECT = [
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com',
  'https://stats.g.doubleclick.net',
];
const TURNSTILE = 'https://challenges.cloudflare.com';

/** @param {{ script?: string[]; style?: string[] }} hashes */
export function buildCsp({ script = [], style = [] } = {}) {
  const quoted = (list) => list.map((hash) => `'${hash}'`);
  const directives = {
    'default-src': ["'self'"],
    // Google Analytics n'est chargé par /js/consent.js qu'après consentement ; Turnstile par le formulaire de contact.
    'script-src': ["'self'", ...quoted(script), 'https://www.googletagmanager.com', TURNSTILE],
    'style-src': ["'self'", ...quoted(style)],
    // Attributs style="" : produits par la coloration syntaxique (Shiki) ; aucun script ne peut s'en servir (voir ADR 0005).
    'style-src-attr': ["'unsafe-inline'"],
    'connect-src': ["'self'", ...DOH_ORIGINS, ...GA_CONNECT, TURNSTILE],
    'frame-src': [TURNSTILE],
    'img-src': [
      "'self'",
      'data:',
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com',
    ],
    'font-src': ["'self'"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': [],
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(' '))
    .join('; ');
}

/**
 * @param {object} options
 * @param {{ script?: string[]; style?: string[] }} options.hashes empreintes des scripts et styles en ligne
 * @param {string} [options.base] « » en production, « /preprod » en préproduction
 * @param {string} [options.authFile] chemin absolu d'un .htpasswd : protège la préproduction par mot de passe
 */
export function buildHtaccess({ hashes, base = '', authFile } = {}) {
  const preprod = base !== '';
  const prefix = base.replace(/\/$/, '');
  const csp = buildCsp(hashes);

  const lines = [
    '# Fichier généré par apps/web/scripts/lib/htaccess.mjs : ne pas modifier à la main (modifier le générateur).',
    `# Cible : ${preprod ? `préproduction (${prefix}/)` : 'production (racine du site)'}.`,
    '',
    '# ----------------------------------------------------------------------',
    '# 1. Base',
    '# ----------------------------------------------------------------------',
    'Options -Indexes',
    'DirectoryIndex index.html',
    'AddDefaultCharset UTF-8',
    'AddType application/manifest+json .webmanifest',
    'AddType application/json .json',
    'AddType application/rss+xml .rss',
    '',
  ];

  if (preprod) {
    lines.push(
      '# ----------------------------------------------------------------------',
      '# Préproduction : jamais indexée, protégée par mot de passe si un .htpasswd est fourni.',
      '# ----------------------------------------------------------------------',
      '<IfModule mod_headers.c>',
      '    Header always set X-Robots-Tag "noindex, nofollow, noarchive"',
      '</IfModule>',
    );
    if (authFile) {
      lines.push(
        'AuthType Basic',
        'AuthName "Préproduction"',
        `AuthUserFile ${authFile}`,
        'Require valid-user',
      );
    }
    lines.push('');
  }

  lines.push(
    '# ----------------------------------------------------------------------',
    '# 2. Cache',
    '#    /_astro/ : noms hachés par le build, donc cache longue durée sans risque.',
    "#    HTML et fichiers de données : toujours revalidés, pour qu'un nouveau déploiement soit visible tout de suite.",
    '# ----------------------------------------------------------------------',
    '<IfModule mod_expires.c>',
    '    ExpiresActive On',
    ...[
      ['image/jpeg', '1 year'],
      ['image/png', '1 year'],
      ['image/webp', '1 year'],
      ['image/avif', '1 year'],
      ['image/svg+xml', '1 year'],
      ['image/x-icon', '1 month'],
      ['image/vnd.microsoft.icon', '1 month'],
      ['application/manifest+json', '1 month'],
      ['font/woff2', '1 year'],
      ['text/css', '1 month'],
      ['application/pdf', '1 month'],
      ['text/javascript', '1 month'],
      ['application/javascript', '1 month'],
    ].map(([type, delay]) => `    ExpiresByType ${type} "access plus ${delay}"`),
    '</IfModule>',
    '',
    '<IfModule mod_headers.c>',
    `    <If "%{REQUEST_URI} =~ m#^${prefix}/_astro/#">`,
    '        Header set Cache-Control "public, max-age=31536000, immutable"',
    '    </If>',
    '    <FilesMatch "\\.(html|xml|json|txt)$">',
    '        Header set Cache-Control "no-cache"',
    '    </FilesMatch>',
    '</IfModule>',
    '',
    '# ----------------------------------------------------------------------',
    '# 3. En-têtes de sécurité',
    '# ----------------------------------------------------------------------',
    '<IfModule mod_headers.c>',
    '    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
    '    Header always set X-Content-Type-Options "nosniff"',
    '    Header always set X-Frame-Options "SAMEORIGIN"',
    '    Header always set Cross-Origin-Opener-Policy "same-origin"',
    '    Header always set Cross-Origin-Resource-Policy "same-site"',
    '    Header always set Referrer-Policy "strict-origin-when-cross-origin"',
    '    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"',
    `    Header always set Content-Security-Policy "${csp}"`,
    '    # Les images de partage doivent pouvoir être affichées par les réseaux sociaux et les messageries.',
    `    <If "%{REQUEST_URI} =~ m#^${prefix}/(og/|og-image\\.png)#">`,
    '        Header always set Cross-Origin-Resource-Policy "cross-origin"',
    '    </If>',
    '    Header always unset X-Powered-By',
    '</IfModule>',
    '',
    '# ----------------------------------------------------------------------',
    '# 4. Compression',
    '# ----------------------------------------------------------------------',
    '<IfModule mod_deflate.c>',
    '    AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/javascript text/javascript application/json application/ld+json application/xml application/rss+xml image/svg+xml',
    '</IfModule>',
    '',
    '# ----------------------------------------------------------------------',
    '# 5. Fichiers non publics',
    '# ----------------------------------------------------------------------',
    "# Sauvegardes, journaux, fichiers de dépendances et d'éditeur oubliés sur le serveur",
    '<FilesMatch "(\\.(bak|old|orig|save|swp|sql|log|ini|lock|dist)|~)$">',
    '    Require all denied',
    '</FilesMatch>',
    '<FilesMatch "^(composer\\.(json|lock)|contact\\.config\\.php)$">',
    '    Require all denied',
    '</FilesMatch>',
    '',
    '# Fichiers et dossiers cachés (.git, .env, …) : 404, sauf /.well-known/ (security.txt)',
    '<IfModule mod_alias.c>',
    '    RedirectMatch 404 "/\\.(?!well-known/)"',
    '</IfModule>',
    '',
    '# ----------------------------------------------------------------------',
    '# 6. URL canonique et page 404',
    "#    Une URL inconnue doit renvoyer un vrai 404 (pas l'accueil en 200 : « soft 404 »).",
    '# ----------------------------------------------------------------------',
    '<IfModule mod_rewrite.c>',
    '    RewriteEngine On',
    `    RewriteBase ${prefix}/`,
    '',
    "    # HTTP -> HTTPS (l'en-tête X-Forwarded-Proto évite toute boucle derrière un proxy)",
    '    RewriteCond %{HTTPS} !=on',
    '    RewriteCond %{HTTP:X-Forwarded-Proto} !https',
    '    RewriteRule ^ https://grichard.eu%{REQUEST_URI} [L,R=301]',
    '',
    '    # www -> domaine nu',
    '    RewriteCond %{HTTP_HOST} ^www\\. [NC]',
    '    RewriteRule ^ https://grichard.eu%{REQUEST_URI} [L,R=301]',
    '',
    "    # /dossier/index.html -> /dossier/ (évite les doublons d'URL)",
    '    RewriteCond %{THE_REQUEST} \\s/+(?:.*/)?index\\.html[\\s?]',
    `    RewriteRule ^(.*/)?index\\.html$ ${prefix}/$1 [L,R=301]`,
    '</IfModule>',
    '',
    `ErrorDocument 404 ${prefix}/404.html`,
    `ErrorDocument 403 ${prefix}/404.html`,
    '',
  );
  return lines.join('\n');
}
