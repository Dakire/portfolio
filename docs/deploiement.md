# Déploiement (OVH hosting-free, FTP/SFTP)

**Push direct sur `main` = mise en production.** Il n'y a ni pull request ni préproduction : chaque push sur `main` déclenche la CI, et le workflow **Déploiement** livre automatiquement en production le commit exact que la CI vient de valider. La vérification se fait donc **avant** le push, en local (voir [CONTRIBUTING.md](CONTRIBUTING.md)).

À la main (onglet **Actions → Déploiement → Run workflow**), le même workflow sert au retour arrière (`ref` = un tag `deploy-production-…`), à la livraison du portail (`target = portal`) et aux simulations (`dry_run = true`).

## Disposition sur l'hébergement

Le FTP s'ouvre dans le dossier personnel de l'hébergement :

```
/                       dossier personnel
├── .ovhconfig          moteur PHP (PHP 8.5, production)
├── www/                racine web publique
│   ├── (le site)       index.html, _astro/, outils/, contact.php, .htaccess, …
│   └── espace/         le portail de test (cible « portal ») — jamais touché par le déploiement du site
├── app/
│   ├── api/            code PHP (contact, outils) + vendor/ (hors racine web)
│   └── portal/         code du portail Symfony + vendor/ (hors racine web)
└── private/            configuration, secrets, état — créé À LA MAIN, jamais livré, jamais écrasé
```

`private/` n'est référencé par aucune commande de transfert : ni upload, ni suppression, ni sauvegarde.

## Mise en place unique (à faire par le propriétaire)

1. **GitHub → Settings → Environments** : un environnement `production`. Ses _Secrets_ : `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`. **Ne pas** y activer « Required reviewers » si la livraison doit être vraiment automatique (sinon chaque livraison attend un clic).
2. **Settings → Branches** : aucune règle n'exigeant de pull request sur `main` (le push direct doit être accepté).
3. **Settings → Secrets and variables → Actions → Variables** (dépôt) : `PUBLIC_TURNSTILE_SITE_KEY` (clé de site Turnstile, publique). Facultatives : `FTP_PROTOCOL` (`sftp` si seul le port 22 est ouvert), `FTP_PORT`, `FTP_TLS` (`true` par défaut : FTPS explicite), `FTP_VERIFY_CERT` (`true` par défaut), `FTP_APP_PREFIX` (voir plus bas).
4. Sur le serveur, par FTP, créer **`private/config.php`** (jamais dans le dépôt) :
   ```php
   <?php
   return [
       'turnstile_secret' => 'LE_SECRET_TURNSTILE',
       'mail_to' => 'contact@grichard.eu',
       'mail_from' => 'noreply@grichard.eu',
   ];
   ```
5. Vérifier dans le manager OVH que le moteur PHP est bien en **8.5**.
6. Ancienne préproduction : supprimer à la main, par FTP, `www/preprod/` et `app/preprod/` s'ils existent. La livraison ne les supprime jamais d'elle-même.

## Si seul www/ est accessible en écriture

La disposition ci-dessus suppose que le FTP s'ouvre dans le dossier personnel (par ex. `/home/grichay/`) et que seul `www/` est public. Si, chez vous, tout doit être placé **dans `www/`**, `app/` et `private/` se retrouvent exposés au web : il faut alors

1. créer `www/app/` et `www/private/`, chacun avec un fichier `.htaccess` contenant uniquement `Require all denied` ;
2. définir la variable GitHub `FTP_APP_PREFIX` = `www/` : le code PHP est alors déposé dans `www/app/…`, et la suppression finale ainsi que la sauvegarde ignorent `app/` et `private/` ;
3. ne jamais déposer de fichier sensible hors de `private/`.

## Déroulé d'une livraison automatique

1. Push sur `main` → **CI** (formatage, lint, typecheck, tests, e2e, axe, PHP, audits).
2. CI verte → **Déploiement** (`workflow_run`) : construction du site, contrat des URL sur le build, `composer install --no-dev`, assemblage contrôlé (`scripts/deploy/assemble.mjs` refuse la page de style, un secret, une carte de source, une base de données, un build en sous-dossier ou en noindex).
3. **Sauvegarde** de `www/` et `app/api/` (artefact `sauvegarde-avant-deploiement`, 30 jours).
4. **Transfert** (`scripts/deploy/deploy.sh`), puis **contrat des URL vérifié sur https://grichard.eu**.
5. **Tag** `deploy-production-AAAAMMJJ-HHMMSS` (point de retour arrière).

Une CI rouge ne livre rien. Un seul déploiement tourne à la fois ; si plusieurs pushes s'enchaînent, seule la dernière livraison en attente part.

## Ordre des transferts

Un visiteur ne doit jamais voir une page qui référence un fichier pas encore arrivé :

1. le code de l'API (`app/…`) ; 2. les ressources versionnées (`_astro/`, `js/`, images, PDF) ; 3. les pages, flux et fichiers de données ; 4. le `.htaccess`, en dernier (il active la nouvelle CSP, calculée sur les nouvelles pages) ; 5. la suppression de ce qui n'existe plus. Jamais touchés : `espace/`, `cgi-bin/`, l'ancien `preprod/`.

## Retour arrière

- **Régression** : `git revert` du commit fautif, puis push sur `main` : la CI verte relivre l'état corrigé.
- **Urgence** (la CI ne peut pas passer) : lancer le workflow à la main en production avec `ref` = le **tag précédent** (`deploy-production-…`). La construction est reproductible : le même tag redonne le même site.
- **Secours** : télécharger l'artefact `sauvegarde-avant-deploiement` (contenu public et code seulement, sans `private/` ni `espace/`) et remettre les fichiers par FTP.
- Le tag `pre-refonte` marque l'état en production avant la refonte UX/UI et les outils SEO (9 octobre 2026).

## Ce que le workflow ne fait jamais

Toucher au DNS ; lire ou écrire `private/` ; livrer un commit dont la CI n'est pas verte ; livrer depuis une autre branche que `main` (ou un tag, à la main) ; utiliser un secret autrement que par les variables d'environnement du job.

## Limites connues

- Le transfert FTP n'est pas atomique : l'ordre ci-dessus limite la fenêtre d'incohérence à quelques secondes.
- Sans préproduction, le seul filet est la vérification locale avant push, la CI, la sauvegarde et le retour arrière par tag.
- Le dépôt est public : les artefacts (livraison, sauvegarde) sont téléchargeables par quiconque a accès au dépôt. Ils ne contiennent que du contenu public et du code, jamais de secret.

## SFTP (hébergement qui n'ouvre que le port 22)

Créer la variable GitHub `FTP_PROTOCOL` = `sftp` (et `FTP_PORT` si ce n'est pas 22). Le workflow enregistre la clé de l'hôte avec `ssh-keyscan` et affiche son empreinte dans le journal. `FTP_TLS` et `FTP_VERIFY_CERT` ne servent alors plus. Même hôte, même utilisateur, mêmes secrets.
