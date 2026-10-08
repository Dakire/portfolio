# Espace client de test (`apps/portal`)

Banc d'essai personnel (voir [ADR 0004](adr/0004-portail-symfony-sqlite.md)) : Symfony 7.4 LTS, SQLite, servi sous `https://grichard.eu/espace/`. Ce n'est pas un produit pour de vrais clients.

## Ce qui est en place

| Sujet                | Choix                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mots de passe        | Argon2id (12 Mio, 3 itérations — minimum OWASP), mise à niveau automatique du hachage                                                                  |
| Connexion            | Formulaire avec jeton CSRF, limitation à 5 essais / 15 min (par identifiant et par IP), message identique pour « inconnu » et « mauvais mot de passe » |
| Session              | Cookie `HttpOnly`, `Secure` (HTTPS détecté derrière le proxy), `SameSite=Lax`, durée 2 h                                                               |
| Rôles                | `ROLE_USER` (tout le portail), `ROLE_ADMIN` (`/admin`) ; contrôlés par `access_control`                                                                |
| Installation         | Page `/setup` : applique les migrations puis crée le premier administrateur ; **jeton d'installation** requis ; se ferme dès qu'un utilisateur existe  |
| Migrations           | Appliquées depuis `/admin/maintenance` (POST + CSRF) : l'hébergement n'a pas de ligne de commande                                                      |
| En-têtes             | `www/espace/.htaccess` : `noindex`, `no-store`, CSP `default-src 'none'`, aucun script ni style en ligne                                               |
| Journaux             | Canal `portal` (connexions, installation, maintenance) sans e-mail ni IP en clair ; le reste à partir de `warning` ; rotation sur 14 jours             |
| Authentification MFA | **Pas encore** (prévu : TOTP), voir « Suite »                                                                                                          |

## Où vivent les données

Rien n'est écrit dans le code livré. Tout l'état est dans `private/` (jamais écrasé par un déploiement) :

```
private/portal.php        configuration (créée à la main, voir ci-dessous)
private/portal.sqlite     base de données
private/portal/           cache (un dossier par livraison), sessions, compteurs de limitation, journaux
```

`private/portal.php` :

```php
<?php
return [
    'app_secret' => 'UNE_CHAINE_ALEATOIRE_DE_64_CARACTERES',
    'setup_token' => 'UN_JETON_D_INSTALLATION_DE_24_CARACTERES_MINIMUM',
    // 'trusted_proxies' => 'REMOTE_ADDR', // seulement si l'adresse IP vue est celle du proxy de l'hébergeur (voir ci-dessous)
];
```

Générer les valeurs : `php -r "echo bin2hex(random_bytes(32));"`. Une fois l'installation faite, **supprimer `setup_token`** de ce fichier : la page `/setup` est alors désactivée même si la base était vidée.

## Première mise en service

1. Créer `private/portal.php` (ci-dessus).
2. Lancer le workflow **Déploiement** avec `target = portal` (d'abord en simulation).
3. Ouvrir `https://grichard.eu/espace/setup`, saisir le jeton, l'e-mail et un mot de passe de 14 caractères ou plus.
4. Se connecter sur `/espace/login`. Retirer `setup_token`.

Vérifier que `pdo_sqlite` est disponible chez OVH (page `phpinfo()` temporaire ou `extension_loaded('pdo_sqlite')`) : sans lui, le portail ne peut pas démarrer.

### Adresse IP vue par le serveur

La limitation des essais s'appuie sur l'adresse IP. Si, chez OVH, `REMOTE_ADDR` est celle d'un proxy (toutes les connexions semblent venir de la même adresse), renseigner `'trusted_proxies' => 'REMOTE_ADDR'` pour que Symfony lise `X-Forwarded-For`. À ne faire que si c'est nécessaire : sans proxy, ce réglage permettrait de falsifier son IP.

## Développement

```
cd apps/portal
composer install
composer test          # PHPUnit (15 tests : accès, CSRF, limitation, installation, rôles, schéma = migration)
composer stan          # PHPStan niveau 8 (+ extensions Symfony et Doctrine)
composer cs            # php-cs-fixer (PER-CS)
APP_ENV=dev APP_SECRET=dev PORTAL_SETUP_TOKEN=un-jeton-de-developpement-24car php -S 127.0.0.1:8000 -t public public/index.php
```

Le cache de production est propre à chaque livraison (`BUILD_ID` = SHA du commit) : après un déploiement, l'ancien cache n'est jamais servi. Les anciens dossiers de `private/portal/cache/` peuvent être supprimés par FTP.

## Suite (non faite)

- Double authentification (TOTP) et codes de secours ; la table `app_user` est prête à recevoir les champs.
- Création et désactivation d'utilisateurs par un administrateur (aujourd'hui : seul l'administrateur d'installation).
- Verrouillage de compte et journal d'audit consultable.
