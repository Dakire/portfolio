# Espace client (`apps/portal`)

Espace client de la boutique ([ADR 0004](adr/0004-portail-symfony-sqlite.md), [ADR 0017](adr/0017-boutique-merchant-of-record.md)) : Symfony 7.4 LTS, SQLite, servi sous `https://grichard.eu/espace/`. Comptes clients ouverts à l'inscription (lot 2 de [boutique.md](boutique.md)) ; aucun achat possible avant l'ouverture.

## Ce qui est en place

| Sujet                   | Choix                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mots de passe           | Argon2id (12 Mio, 3 itérations — minimum OWASP), mise à niveau automatique du hachage                                                                                                                                                                                                                                                                                      |
| Connexion               | Formulaire avec jeton CSRF, limitation à 5 essais / 15 min (par identifiant et par IP), message identique pour « inconnu » et « mauvais mot de passe »                                                                                                                                                                                                                     |
| Session                 | Cookie `HttpOnly`, `Secure` (HTTPS détecté derrière le proxy), `SameSite=Lax`, durée 2 h                                                                                                                                                                                                                                                                                   |
| Rôles                   | `ROLE_USER` (tout le portail), `ROLE_ADMIN` (`/admin`) ; contrôlés par `access_control`                                                                                                                                                                                                                                                                                    |
| Installation            | Page `/setup` : applique les migrations puis crée le premier administrateur ; **jeton d'installation** requis ; se ferme dès qu'un utilisateur existe                                                                                                                                                                                                                      |
| Migrations              | Appliquées depuis `/admin/maintenance` (POST + CSRF) : l'hébergement n'a pas de ligne de commande                                                                                                                                                                                                                                                                          |
| En-têtes                | `www/espace/.htaccess` : `noindex`, `no-store`, CSP `default-src 'none'`, aucun script ni style en ligne                                                                                                                                                                                                                                                                   |
| Journaux                | Canal `portal` (connexions, installation, maintenance) sans e-mail ni IP en clair ; le reste à partir de `warning` ; rotation sur 14 jours                                                                                                                                                                                                                                 |
| Comptes clients         | Inscription (`/inscription`, mot de passe de 12 caractères ou plus), adresse à confirmer par un lien (48 h, usage unique, confirmé par un bouton : les antivirus de messagerie ouvrent les liens) avant toute connexion ; même réponse que l'adresse soit nouvelle ou déjà inscrite (le titulaire est prévenu par e-mail) ; comptes jamais confirmés effacés après 7 jours |
| Mot de passe oublié     | `/mot-de-passe-oublie` : lien d'une heure, usage unique, même réponse pour une adresse inconnue ; e-mail d'alerte après chaque changement                                                                                                                                                                                                                                  |
| Double authentification | Facultative, depuis `/compte` : TOTP (scheb/2fa, QR code en image `data:`), 10 codes de secours hachés, montrés une fois ; désactivation et nouveaux codes sur mot de passe                                                                                                                                                                                                |
| Données (RGPD)          | Export JSON et suppression du compte depuis `/compte` (mot de passe exigé ; le dernier administrateur ne peut pas se supprimer)                                                                                                                                                                                                                                            |
| E-mails                 | Texte brut, `mail()` de l'hébergeur par défaut (`native://default`), expéditeur `no-reply@grichard.eu` ; limite de 3 e-mails par heure et par adresse, 10 demandes par heure et par IP                                                                                                                                                                                     |     |
| Licences                | `/licences` : licences du client, jeton signé Ed25519 à coller dans le produit, téléchargement des versions couvertes ; achats faits avant l'inscription rattachés dès l'adresse confirmée ; format et API dans [licences.md](licences.md)                                                                                                                                 |
| Paddle                  | Notifications sur `/webhooks/paddle` (signature HMAC vérifiée, 5 min de tolérance, chaque événement traité une fois) : achat, renouvellement, résiliation, remboursement ; prix reliés aux formules dans `config/paddle_prices.php`                                                                                                                                        |
| API des produits        | `/api/licence/cle-publique`, `/api/licence/renouveler`, `/api/mises-a-jour/<produit>`, `/api/telechargement/…` (liens signés d'une heure) ; sans session, 120 appels par heure et par IP                                                                                                                                                                                   |
| Administration          | `/admin/licences` : dernières licences, attribution manuelle (essai, support), révocation                                                                                                                                                                                                                                                                                  |
| Apparence               | Design system du site : `public/ui/ui.css` et `public/ui/fonts/`, copie générée de `packages/ui` (`pnpm --filter @grichard/ui portal-ui`, vérifiée à l'identique par un test) ; thème et curseur suivent les choix faits sur le site (`public/prefs.js`, même `localStorage`)                                                                                              |
| Boutique (aperçu)       | `/boutique`, réservée aux comptes connectés : fiches des produits prévus (`src/Catalog/Catalog.php`), sans aucun achat possible (ADR 0017)                                                                                                                                                                                                                                 |

## Où vivent les données

Rien n'est écrit dans le code livré. Tout l'état est dans `private/` (jamais écrasé par un déploiement) :

```
private/portal.php        configuration (créée à la main, voir ci-dessous)
private/portal.sqlite     base de données
private/portal/           cache (un dossier par livraison), sessions, compteurs de limitation, journaux
private/portal/downloads/ fichiers des produits : <produit>/<produit>-<version>.zip, déposés par FTP
```

`private/portal.php` :

```php
<?php
return [
    'app_secret' => 'UNE_CHAINE_ALEATOIRE_DE_64_CARACTERES',
    'setup_token' => 'UN_JETON_D_INSTALLATION_DE_24_CARACTERES_MINIMUM',
    // 'trusted_proxies' => 'REMOTE_ADDR', // seulement si l'adresse IP vue est celle du proxy de l'hébergeur (voir ci-dessous)
    // 'mailer_dsn' => 'native://default', // défaut : mail() de l'hébergeur ; ou 'smtp://no-reply%40grichard.eu:MOT_DE_PASSE@ssl0.ovh.net:465'
    // 'mail_from' => 'grichard.eu <no-reply@grichard.eu>',
    // Boutique (lot 3) : clé privée de signature des licences (voir licences.md) et secret de la destination de notification Paddle
    // 'licence_key' => 'BASE64_DE_64_OCTETS',
    // 'paddle_webhook_secret' => 'pdl_ntfset_…',
];
```

Générer les valeurs : `php -r "echo bin2hex(random_bytes(32));"`. Une fois l'installation faite, **supprimer `setup_token`** de ce fichier : la page `/setup` est alors désactivée même si la base était vidée.

## Première mise en service

1. Créer `private/portal.php` (ci-dessus).
2. Lancer le workflow **Déploiement** avec `target = portal` (d'abord en simulation).
3. Ouvrir `https://grichard.eu/espace/setup`, saisir le jeton, l'e-mail et un mot de passe de 14 caractères ou plus.
4. Se connecter sur `/espace/login`. Retirer `setup_token`.

`pdo_sqlite` est disponible chez OVH (installation faite le 24 novembre 2026).

### Après une livraison qui ajoute une migration

Ouvrir `/espace/admin/maintenance` et appliquer les migrations en attente : tant qu'elles ne le sont pas, les pages qui utilisent les nouvelles tables répondent en erreur.

### Délivrabilité des e-mails

Le domaine publie `v=spf1 include:mx.ovh.com -all` et un DMARC en `p=reject` : un e-mail du portail doit être aligné, sinon il est rejeté. Après la première livraison, créer un compte de test avec une adresse personnelle et lire les en-têtes du message reçu (`spf=pass`, `dmarc=pass`). En cas d'échec, passer par une boîte OVH du domaine avec `mailer_dsn` en SMTP (ci-dessus).

### Adresse IP vue par le serveur

La limitation des essais s'appuie sur l'adresse IP. Si, chez OVH, `REMOTE_ADDR` est celle d'un proxy (toutes les connexions semblent venir de la même adresse), renseigner `'trusted_proxies' => 'REMOTE_ADDR'` pour que Symfony lise `X-Forwarded-For`. À ne faire que si c'est nécessaire : sans proxy, ce réglage permettrait de falsifier son IP.

## Développement

```
cd apps/portal
composer install
composer test          # PHPUnit (accès, CSRF, limitation, installation, rôles, schéma = migration, comptes, double authentification, RGPD)
composer stan          # PHPStan niveau 8 (+ extensions Symfony et Doctrine)
composer cs            # php-cs-fixer (PER-CS)
APP_ENV=dev APP_SECRET=dev PORTAL_SETUP_TOKEN=un-jeton-de-developpement-24car php -S 127.0.0.1:8000 -t public public/index.php
```

Le cache de production est propre à chaque livraison (`BUILD_ID` = SHA du commit) : après un déploiement, l'ancien cache n'est jamais servi. Les anciens dossiers de `private/portal/cache/` peuvent être supprimés par FTP.

## Suite (non faite)

- Création et désactivation d'utilisateurs par un administrateur (aujourd'hui : seul l'administrateur d'installation).
- Verrouillage de compte et journal d'audit consultable.
