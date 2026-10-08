# Déploiement (OVH hosting-free, FTP)

Le déploiement ne se déclenche **que à la main** : onglet **Actions → Déploiement → Run workflow**. Rien ne part tout seul, ni sur un push, ni sur une fusion. Par défaut, le workflow fait une **simulation** (`dry_run`) : lftp liste ce qu'il ferait sans rien écrire.

## Disposition sur l'hébergement

Le FTP s'ouvre dans le dossier personnel de l'hébergement :

```
/                       dossier personnel
├── .ovhconfig          moteur PHP (PHP 8.5, production) — livré par la production seulement
├── www/                racine web publique
│   ├── (le site)       index.html, _astro/, outils/, contact.php, .htaccess, …
│   ├── preprod/        la préproduction (même hébergement, sous-dossier)
│   └── espace/         le portail de test (phase 6) — jamais touché par le déploiement du site
├── app/
│   ├── api/            code PHP du formulaire de contact + vendor/ (hors racine web)
│   └── preprod/api/    copie pour la préproduction
└── private/            configuration, secrets, état — créé À LA MAIN, jamais livré, jamais écrasé
```

`private/` n'est référencé par aucune commande de transfert : ni upload, ni suppression, ni sauvegarde.

## Mise en place unique (à faire par le propriétaire)

1. **GitHub → Settings → Environments** : créer `preprod` et `production`. Sur `production`, activer **Required reviewers** (vous) : le transfert attend alors votre validation.
2. Dans **chaque environnement** → _Secrets_ : `FTP_HOST` (ex. `ftp.cluster0XX.hosting.ovh.net`), `FTP_USER`, `FTP_PASSWORD`. Dans `preprod` seulement : `PREPROD_BASIC_AUTH` au format `utilisateur:mot-de-passe` (pour que la vérification automatique passe le mot de passe de la préproduction).
3. **Settings → Secrets and variables → Actions → Variables** (dépôt) : `PUBLIC_TURNSTILE_SITE_KEY` (clé de site Turnstile, publique). Facultatives : `FTP_TLS` (`true` par défaut : FTPS explicite) et `FTP_VERIFY_CERT` (`true` par défaut). Dans l'environnement `preprod` : `PREPROD_AUTH_FILE` = chemin **absolu** du `.htpasswd` sur le serveur (ex. `/home/identifiant/private/.htpasswd`).
4. Sur le serveur, par FTP, créer **`private/config.php`** (jamais dans le dépôt) :
   ```php
   <?php
   return [
       'turnstile_secret' => 'LE_SECRET_TURNSTILE',
       'mail_to' => 'contact@grichard.eu',
       'mail_from' => 'noreply@grichard.eu',
   ];
   ```
5. Créer **`private/.htpasswd`** (une ligne `utilisateur:empreinte`, empreinte générée par `htpasswd -B` ou un générateur bcrypt) pour protéger la préproduction.
6. Vérifier dans le manager OVH que le moteur PHP est bien en **8.5**. Le fichier `.ovhconfig` livré par la production le demande ; si OVH refuse la version, le déploiement ne casse rien mais le PHP reste sur l'ancienne.

## Procédure recommandée

1. **Préproduction en simulation** : `target = preprod`, `ref = main`, `dry_run = true`. Lire le journal : les `mirror` doivent ne viser que `www/preprod` et `app/preprod/api`.
2. **Préproduction réelle** : `dry_run = false`. La vérification du contrat (70 URL) tourne sur `https://grichard.eu/preprod`.
3. Contrôles manuels sur `https://grichard.eu/preprod/` : [release-checklist.md](release-checklist.md) (clavier, lecteur d'écran, formulaire de contact avec Turnstile réel, en-têtes).
4. **Production en simulation** : `target = production`, `dry_run = true`. Lire attentivement les lignes de **suppression** : la première livraison supprime les fichiers de l'ancien site qui n'existent plus (`assets/`, anciennes pages…). Jamais touchés : `preprod/`, `espace/`, `cgi-bin/`.
5. **Production réelle** : `dry_run = false`, puis valider l'environnement. Le workflow sauvegarde d'abord `www/` et `app/api/` (artefact `sauvegarde-avant-deploiement`, 30 jours), transfère, vérifie les 70 URL sur `https://grichard.eu`, puis pose le tag `deploy-production-AAAAMMJJ-HHMMSS`.

Garde-fous du workflow : la production ne se livre que depuis `main` ou un tag, et seulement si la CI de ce commit est verte ; l'assemblage (`scripts/deploy/assemble.mjs`) refuse une livraison contenant la page de style, un secret, une carte de source, une base de données, ou un build de préproduction destiné à la production (et inversement).

## Ordre des transferts

Un visiteur ne doit jamais voir une page qui référence un fichier pas encore arrivé :

1. le code de l'API (`app/…`) ; 2. les ressources versionnées (`_astro/`, `js/`, images, PDF) ; 3. les pages, flux et fichiers de données ; 4. le `.htaccess`, en dernier (il active la nouvelle CSP, calculée sur les nouvelles pages) ; 5. la suppression de ce qui n'existe plus.

## Retour arrière

- **Normal** : relancer le workflow en production avec `ref` = le **tag précédent** (`deploy-production-…`). La construction est reproductible : le même tag redonne le même site.
- **Secours** : télécharger l'artefact `sauvegarde-avant-deploiement` (contenu public et code seulement, sans `private/` ni `espace/`) et remettre les fichiers par FTP.

## Ce que le workflow ne fait jamais

Toucher au DNS ; lire ou écrire `private/` ; se lancer sans clic ; livrer la production sans validation d'environnement (si elle est configurée) ; utiliser un secret autrement que par les variables d'environnement du job.

## Limites connues

- Le transfert FTP n'est pas atomique : l'ordre ci-dessus limite la fenêtre d'incohérence à quelques secondes.
- `lftp` n'a pas pu être exécuté dans l'environnement de développement (Windows) : le **premier passage doit être la simulation en préproduction**. Le script a été vérifié avec un faux `lftp` qui affiche les commandes reçues ; leur effet réel est à confirmer par cette simulation.
- Le dépôt est public : les artefacts (livraison, sauvegarde) sont téléchargeables par quiconque a accès au dépôt. Ils ne contiennent que du contenu public et du code, jamais de secret.
