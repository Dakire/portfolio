# ADR 0002 : production = fichiers statiques + PHP 8.5, déploiement FTP

**Statut** : accepté (2026-10-08)

**Contexte.** Hébergement OVH gratuit : PHP 8.5, FTP seul, pas de SSH, pas de MySQL, pas de multisite.

**Décision.** Tout le calcul se fait au build ou dans le navigateur. Le PHP (contact, portail) est livré avec son `vendor/` construit en CI. SQLite pour le portail. Préproduction et portail en sous-dossiers de l'unique site. Déploiement lftp depuis GitHub Actions, en quasi-atomique (assets hachés, pages, `.htaccess`, suppression en dernier) ; retour arrière = redéploiement d'un tag.

**Conséquences.** Pas de commande serveur (les migrations passent par une page d'administration protégée) ; envois FTP longs pour le portail (job séparé). Hébergement conservé : coût nul, mail et DNS inchangés.

**Mise en œuvre.** Procédure, secrets et retour arrière : [deploiement.md](../deploiement.md). Le workflow est manuel, en simulation par défaut, et ne touche jamais `private/`.
