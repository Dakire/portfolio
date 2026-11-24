# ADR 0004 : portail Symfony 7.4 LTS sur SQLite

**Statut** : accepté (2026-10-08) ; implémentation en phase 6.

**Mise à jour (2026-11-24).** Le banc d'essai devient l'espace client réel de la boutique (ADR 0017) : comptes clients, double authentification (scheb/2fa), licences et notifications Paddle ; voir docs/portail.md.

**Décision.** Espace client de test en Symfony 7.4 LTS : authentification, Argon2id, CSRF, limitation des connexions, rôles et cookies sécurisés fournis par le framework (rien de maison) ; MFA prévu (scheb/2fa). Base SQLite hors webroot, migrations Doctrine versionnées. Servi depuis `www/espace/`, code dans `app/portal/` hors webroot.

**Écartés.** Slim (pas d'authentification), Laravel (dépend de la ligne de commande, inaccessible en FTP).

**Réserve.** L'extension `pdo_sqlite` doit être active chez OVH (à vérifier avant la phase 6).
