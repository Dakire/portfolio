# Checklist de release

Avant la mise en production (déclenchée à la main par le propriétaire) :

- [ ] CI verte : formatage, lint, typecheck, tests, e2e, axe, audits, secrets, CodeQL.
- [ ] `pnpm test:contract` vert sur le build **et** sur la préproduction (`CONTRACT_BASE_URL`).
- [ ] Lighthouse ≥ 95 (performance, accessibilité, bonnes pratiques, SEO) sur l'accueil, un article et un outil.
- [ ] En-têtes vérifiés (securityheaders.com, Mozilla Observatory) ; CSP sans violation en préproduction.
- [ ] Tests manuels : clavier seul, lecteur d'écran (NVDA), zoom 200 %, thème clair/sombre, mouvement réduit.
- [ ] Formulaire de contact testé de bout en bout (Turnstile réel, e-mail reçu).
- [ ] `ai-catalog.json` servi en `application/json` ; PDF du CV FR/EN aux mêmes URL.
- [ ] Simulation (`dry_run`) relue, en particulier les suppressions ; la sauvegarde automatique du `www/` actuel est produite par le workflow.
- [ ] Tag Git de la release posé (point de retour arrière).
- [ ] Après déploiement : `CONTRACT_BASE_URL=https://grichard.eu pnpm test:contract`, puis surveillance de l'uptime.

Procédure détaillée, secrets à configurer et retour arrière : [deploiement.md](deploiement.md). Retour arrière : relancer le workflow de déploiement sur le tag précédent (`deploy-production-…`).
