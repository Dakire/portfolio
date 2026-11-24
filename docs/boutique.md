# Boutique et espace client : feuille de route vers l'ouverture (T1 2027)

Décision et options écartées : [ADR 0017](adr/0017-boutique-merchant-of-record.md). Ce document suit ce qui reste à faire, côté démarches (Guillaume) et côté site (dépôt). Toute fonctionnalité inachevée reste masquée en production (pas de lien, pas d'entrée de menu), comme le veut le CLAUDE.md.

## Calendrier

| Période            | Démarches (Guillaume)                                                                                                         | Site (dépôt)                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Décembre 2026      | Choisir les premiers produits et leurs prix ; ouvrir un compte **sandbox** Paddle (aucun SIRET nécessaire)                    | Lot 1 : pages produit, tarifs et pages légales, masquées                          |
| Début janvier 2027 | **Créer la micro-entreprise** ; ouvrir l'outil de suivi (Abby ou Tiime) ; compte bancaire séparé (un compte personnel suffit) | Lot 2 : comptes clients complets dans le portail                                  |
| Janvier 2027       | Compte Paddle réel : vérification d'identité, puis du domaine (pages du lot 1 rendues publiques)                              | Lot 3 : webhooks, licences signées, téléchargements, en sandbox                   |
| Février 2027       | Relire CGV, remboursements et licence d'utilisation ; décider d'une assurance RC pro                                          | Lot 4 : licence intégrée au premier produit réel ; essais d'achat de bout en bout |
| Mars 2027          | Première déclaration URSSAF du trimestre (même à 0 €)                                                                         | **Ouverture** : liens dans le menu, contrat d'URL et sitemap à jour               |

Pourquoi créer le statut début janvier plutôt qu'en décembre : l'année de création est exonérée de CFE (une création en janvier couvre toute l'année 2027), on évite des déclarations à zéro pendant la construction, et le statut n'approche pas la radiation automatique (deux années civiles complètes sans chiffre d'affaires).

## Démarches

### Statut

- [ ] Déclaration de micro-entreprise sur le guichet unique officiel, **gratuit** : <https://formalites.entreprise.gouv.fr> (les sites privés qui font payer la même démarche sont inutiles).
- [ ] Choisir la catégorie d'activité (vente de licences de logiciels : prestation de services ou activité libérale) et noter le taux de cotisation annoncé ; simulateur : <https://autoentrepreneur.urssaf.fr>.
- [ ] Déclarations URSSAF : choisir le rythme trimestriel (moins de démarches) ; option versement libératoire de l'impôt si le revenu fiscal le permet.
- [ ] Vérifier l'éligibilité à l'ACRE (réduction de cotisations la première année) dès la création : ses conditions ont changé récemment.
- [ ] Si salarié : vérifier l'absence de clause d'exclusivité ou de non-concurrence.
- [ ] Espace professionnel sur impots.gouv.fr (CFE, même exonérée).

### Merchant of Record (Paddle)

- [ ] Compte sandbox (développement des lots 1 à 3).
- [ ] Compte réel : vérification d'identité (pas de vérification d'entreprise pour un entrepreneur individuel).
- [ ] Revue du domaine `grichard.eu` : tarifs visibles sans connexion, CGV qui nomment Paddle comme Merchant of Record et le nom légal du vendeur, remboursement sans réserve d'au moins 14 jours (30 recommandés), confidentialité.
- [ ] Confirmer la grille sur paddle.com (5 % + 0,50 $ relevés en novembre 2026) et le pays et la devise des versements.
- [ ] Plan B si refus : Polar (ADR 0017).

### Suivi comptable

Avec un Merchant of Record, il n'y a qu'un versement par mois à enregistrer : un tableur suffirait pour le livre des recettes. Un outil gratuit reste utile pour **recevoir les factures électroniques** (obligatoire depuis septembre 2026, via une plateforme agréée) et suivre les seuils.

- [ ] **Abby**, formule gratuite (recommandée) : livre des recettes, estimation des cotisations URSSAF, alertes de seuils, facturation électronique par plateforme agréée.
- [ ] Alternative : **Tiime**, formule gratuite (plateforme agréée, livre des recettes, factures illimitées).
- [ ] Chaque mois : reporter le relevé de versement Paddle, ranger le relevé (conservation 10 ans).
- [ ] Chaque trimestre : déclarer le chiffre d'affaires sur autoentrepreneur.urssaf.fr. Chaque printemps : le reporter dans la déclaration de revenus (2042-C-PRO).

Les offres gratuites changent : vérifier la liste exacte des fonctions au moment de s'inscrire.

## Lots techniques

### Lot 1 : vitrine (statique, `apps/web`) — fait

- `/boutique/` et `/en/shop/` : produits de l'ouverture, tous les tarifs, conditions ; une fiche par produit ; CGV, remboursement (30 jours), licence. Données dans `src/shop/`.
- Masqué tant que `SHOP_OPEN` est faux (`src/shop/config.ts`) : `noindex`, hors sitemap (`EXCLUDED` d'`astro.config.mjs`), hors menu, recherche et llms.txt, sans bouton d'achat.
- Textes en version de travail : fonctions limitées à ce qui est connu (« à préciser » sinon), SIRET à ajouter à l'immatriculation.

### Lot 2 : comptes clients (`apps/portal`) — fait

- Inscription, adresse confirmée par lien, mot de passe oublié, double authentification (TOTP, codes de secours), export et suppression des données ; détail dans [portail.md](portail.md). Politique de confidentialité du site complétée.

### Lot 3 : achats, licences, téléchargements (`apps/portal`) — fait, à brancher sur Paddle

- Notifications Paddle (`/webhooks/paddle`), licences signées Ed25519, téléchargements et mises à jour sous licence, API des produits, administration des licences ; détail dans [portail.md](portail.md) et [licences.md](licences.md).

### Lot 4 : vérification dans les produits — fait côté bibliothèques

- `packages/licence` : vérification JavaScript (extensions, Worker Slack) et PHP (modules PrestaShop), testées contre des jetons signés par le portail ; guide d'intégration par produit dans [licences.md](licences.md).
- Reste à faire dans le code de chaque produit (hors de ce dépôt) : intégrer la bibliothèque, la clé publique et la page de saisie du jeton ; passer le bot Slack de Stripe à Paddle.

## Avant l'ouverture (dans l'ordre)

1. **Clé de licence** : générer `licence_key` (commande dans [licences.md](licences.md)) dans `private/portal.php`, la sauvegarder ; livrer le portail (cible `portal`), puis appliquer les migrations depuis `/espace/admin/maintenance`.
2. **Paddle sandbox** : créer les produits et prix, puis renseigner `apps/portal/config/paddle_prices.php` ; créer la destination de notification `https://grichard.eu/espace/webhooks/paddle` (événements `transaction.completed`, `subscription.*`, `adjustment.*`) et copier son secret dans `paddle_webhook_secret`.
3. **Paiement** : boutons d'achat (Paddle.js en surimpression, `customData.user_id` pour l'acheteur connecté) sur les fiches et dans l'espace client ; ajouter les domaines de Paddle à la CSP (`htaccess.mjs` et `.htaccess` du portail). Non fait : dépend du compte Paddle.
4. **Achat de bout en bout en sandbox** : achat, licence reçue, jeton accepté par le produit, renouvellement, remboursement (licence révoquée).
5. **Délivrabilité** : créer un compte avec une adresse personnelle et vérifier `spf=pass` et `dmarc=pass` dans les en-têtes (DMARC du domaine en `p=reject`).
6. **Statut et textes** : SIRET dans les CGV ; relire CGV, remboursement, licence et fiches ; confirmer la grille de Paddle.
7. **Compte Paddle réel** : vérification d'identité et du domaine (pages du lot 1 rendues publiques à cette étape), puis prix réels dans `paddle_prices.php`.
8. **Ouverture** : `SHOP_OPEN = true`, préfixes retirés d'`EXCLUDED`, lien « Boutique » au menu, contrat d'URL et sitemap mis à jour, `/espace/boutique` (aperçu privé) retiré ou réservé à l'administrateur.

## Questions ouvertes

- Les apps Shopify : produits payants par l'App Store, ou seulement des apps sur mesure pour des clients ?
- Support client : par e-mail seulement, ou par l'espace client ?
- Rappel avant renouvellement d'un abonnement annuel : à vérifier dans les e-mails de Paddle (les CGV l'annoncent).
