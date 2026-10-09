# Checklist avant push sur `main`

Chaque push sur `main` part en production après une CI verte : cette liste se fait **avant** le push.

- [ ] `pnpm format:check` vert.
- [ ] Lint, typecheck, tests et e2e (avec axe) de ce qui est touché : `pnpm --filter @grichard/web lint`, `check`, `test`, `build`, `test:e2e` ; `pnpm --filter @grichard/ui test` ; `pnpm --filter @grichard/tools-core test`.
- [ ] PHP modifié : `php -l` sur chaque fichier, puis `composer test`, `composer cs`, `composer stan` dans l'app concernée.
- [ ] `CONTRACT_DIST=apps/web/dist pnpm test:contract` vert ; toute URL modifiée a sa redirection 301 et le contrat est à jour.
- [ ] Rendu vérifié à 1440, 768 et 375 px, au clavier seul, en thème clair et sombre (et zoom 200 % si la mise en page change).
- [ ] `git diff --staged` relu : aucun secret, aucune clé, aucune donnée personnelle.
- [ ] Le commit laisse le site fonctionnel ; une fonctionnalité inachevée est masquée.

Après le push :

- [ ] CI puis **Déploiement** verts (le workflow vérifie le contrat sur https://grichard.eu et pose le tag `deploy-production-…`).
- [ ] Contrôle rapide en ligne de ce qui a changé ; en-têtes (`curl -sI https://grichard.eu/`) ; `/.well-known/ai-catalog.json` en `application/json` ; PDF du CV FR/EN.
- [ ] Régression : `git revert` + push, puis analyse.

Périodiquement : Lighthouse ≥ 95 sur l'accueil, un article et un outil ; securityheaders.com / Mozilla Observatory ; test au lecteur d'écran (NVDA) ; formulaire de contact de bout en bout (Turnstile réel, e-mail reçu).

Procédure, secrets et retour arrière : [deploiement.md](deploiement.md).
