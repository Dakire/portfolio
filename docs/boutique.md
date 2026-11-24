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

### Lot 1 : vitrine (statique, `apps/web`)

- Une page par produit (FR/EN), une page de tarifs, données dans `src/data/` (comme `profile.ts`), JSON-LD `Product` et `Offer`.
- Pages légales : CGV (Paddle Merchant of Record, nom légal), remboursement, licence d'utilisation ; confidentialité complétée pour les données clients.
- Masqué jusqu'à l'ouverture : hors menu, `noindex`, hors sitemap ; bouton d'achat absent.

### Lot 2 : comptes clients (`apps/portal`)

- Inscription, vérification de l'e-mail, mot de passe oublié (envoi d'e-mails : SPF, DKIM et DMARC du domaine à vérifier), TOTP et codes de secours.
- Export et suppression des données (RGPD).
- Le portail cesse d'être un banc d'essai : mettre à jour l'ADR 0004 et [portail.md](portail.md).

### Lot 3 : achats, licences, téléchargements

- Webhook Paddle : signature vérifiée, idempotence (identifiant d'événement stocké), commande et licence créées ou mises à jour.
- Licences Ed25519 : clé privée dans `private/` (jamais dans le dépôt), clé publique dans chaque produit ; rotation possible (identifiant de clé dans la licence).
- Téléchargements : ZIP dans `private/`, liens signés à durée limitée, réservés à une licence valide.
- Point d'entrée de mise à jour des modules PrestaShop (dernière version, téléchargement sous licence).
- Espace client : commandes, licences et installations, téléchargements, lien vers le portail client Paddle (factures, moyen de paiement, résiliation).

### Lot 4 : premier produit

- Vérification de licence hors ligne dans le module ou l'extension, tolérante si le site ne répond pas.
- Achat réel de bout en bout (puis remboursement), vérification des versements et du relevé Paddle.

## Questions ouvertes

- Quels sont les premiers produits, et leurs prix ?
- Les apps Shopify : produits payants par l'App Store, ou seulement des apps sur mesure pour des clients ?
- Support client : par e-mail seulement, ou par l'espace client ?
