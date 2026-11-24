# ADR 0017 : boutique et espace client par un Merchant of Record

**Statut** : proposé (2026-11-24) ; ouverture visée au premier trimestre 2027, feuille de route dans [docs/boutique.md](../boutique.md).

**Contexte.** Vendre des modules PrestaShop, des licences d'extensions Chrome et, plus tard, d'autres produits numériques, par un vendeur en micro-entreprise, sans comptabilité lourde ni expert-comptable, sur l'hébergement actuel (fichiers statiques + PHP 8.5, FTP seulement, SQLite, aucun démon ni tâche planifiée garantie ; ADR 0002).

**Décision.**

1. **Paddle comme Merchant of Record** (vendeur légal) : il encaisse, applique la TVA du pays de chaque acheteur, facture, rembourse, gère les litiges et les renouvellements d'abonnement, et reverse le net une fois par mois. Le vendeur n'a qu'un client (Paddle) : une ligne par mois au livre des recettes, pas de TVA à collecter. Page de paiement hébergée par Paddle (aucune donnée de carte sur le site). Les particuliers et entrepreneurs individuels n'ont pas de vérification d'entreprise à passer, seulement celle du domaine et de l'identité.
2. **Licences signées par le site, indépendantes du prestataire** : à l'achat, le PHP délivre une licence signée Ed25519 (produit, client, échéance, nombre d'installations) ; modules et extensions la vérifient **hors ligne** avec la clé publique intégrée, et ne rappellent le site qu'à échéance ou une fois par semaine au plus. La charge reste négligeable sur un hébergement mutualisé, un client n'est jamais bloqué par une lenteur du site, et changer de prestataire ne casse aucune licence.
3. **Tout est déclenché par webhooks** : achat, renouvellement, échec de paiement, résiliation et remboursement mettent la licence à jour à réception (signature vérifiée, chaque événement traité une seule fois). Aucune tâche planifiée : si le site ne répond pas, Paddle réessaie.
4. **Répartition** : pages produit, tarifs et documentation statiques dans `apps/web` (FR/EN, SEO et GEO conservés) ; comptes, licences, téléchargements et réception des webhooks dans le portail Symfony (`apps/portal`, ADR 0004), qui devient un espace client réel (inscription, vérification de l'e-mail, mot de passe oublié, TOTP). Les ZIP restent dans `private/`, servis par PHP sur lien signé à durée limitée.
5. **Tarifs** : annuels par défaut (le forfait fixe par transaction, de l'ordre de 0,50 $, rend un prélèvement mensuel de moins de quelques euros non rentable) ; achat unique avec un an de mises à jour pour les modules PrestaShop ; offre groupée pour les extensions.
6. **Canaux imposés** : les apps Shopify publiques se vendent par l'App Store et la facturation de Shopify (le site n'en est que la vitrine et le support) ; le Chrome Web Store ne gère plus les paiements, l'extension y est publiée et débloquée par licence.

**Écartés.**

- **Stripe en direct** : moins cher par vente, mais TVA OSS, factures conformes et justificatifs de pays à la charge du vendeur, contraire au but « compta minimale ».
- **Lemon Squeezy** : racheté par Stripe en 2024, vendeurs dirigés vers Stripe Managed Payments, inscriptions signalées sur liste d'attente en 2026 : avenir incertain.
- **Stripe Managed Payments** : 3,5 % ajoutés aux frais Stripe ; à réévaluer quand l'offre sera stable en France.
- **Polar** : bonne alternative (orientée développeurs, licences intégrées, même 5 % + 0,50 $ en formule gratuite), mais plus jeune et avec des frais de versement en plus. Reste le second choix si Paddle refuse le compte ; la décision 2 rend le changement peu coûteux.
- **Serveur dédié ou VPS** : inutile tant que les licences sont vérifiées hors ligne et que le paiement est délégué.

**Réserves.**

- Grilles relevées en novembre 2026 sur des comparatifs tiers (Paddle : 5 % + 0,50 $ par transaction, sans abonnement) : à confirmer sur paddle.com avant l'ouverture.
- Paddle exige pour approuver le domaine : tarifs visibles sans connexion, conditions générales nommant Paddle comme Merchant of Record et le nom légal du vendeur, politique de remboursement sans réserve d'au moins 14 jours (30 recommandés ; « ventes définitives » refusé), politique de confidentialité.
- L'activité de vente de licences (prestation de services ou activité libérale) fixe le taux de cotisation : à faire confirmer à l'inscription.
- Obligation de recevoir les factures électroniques (depuis septembre 2026) et d'en émettre (septembre 2027 pour les micro-entreprises) : à vérifier dans le cas d'un client unique étranger (Paddle).
