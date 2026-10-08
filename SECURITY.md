# Politique de sécurité

## Signaler une vulnérabilité

Écrivez à **contact@grichard.eu** (objet : « Sécurité »), ou utilisez le signalement privé de GitHub (onglet Security > Report a vulnerability). Contact public : <https://grichard.eu/.well-known/security.txt>.

Merci de ne pas divulguer publiquement avant correction, de ne pas dégrader le service et de ne pas accéder à des données qui ne sont pas les vôtres. Accusé de réception sous 5 jours ouvrés, puis information sur la correction. Il n'y a pas de programme de primes.

## Périmètre

grichard.eu et son code (ce dépôt). Hors périmètre : les services tiers (OVH, Cloudflare Turnstile, Google Analytics), le déni de service, l'ingénierie sociale.

## Pratiques

Dépôt public sans secret (recherche de secrets en CI), dépendances surveillées (Dependabot, audits), analyse statique (CodeQL, PHPStan), actions GitHub épinglées par SHA. Détails : [CLAUDE.md](CLAUDE.md).
