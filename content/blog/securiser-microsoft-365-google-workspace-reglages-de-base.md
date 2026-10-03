---
title: Sécuriser Microsoft 365 et Google Workspace : réglages de base
description: MFA, comptes administrateurs, authentification héritée, transferts automatiques, partage externe, sauvegarde et départs : les mesures essentielles pour une PME.
date: 2026-10-03
---

La messagerie et le stockage cloud contiennent l'essentiel des données d'une entreprise, et les comptes compromis sont l'une des principales portes d'entrée des attaques (hameçonnage, fraude au président, rançongiciel). Bonne nouvelle : **quelques réglages bien choisis** réduisent fortement les risques. Selon Microsoft, l'authentification multifacteur combinée au blocage de l'authentification héritée arrête plus de 99,9 % des attaques d'identité courantes. Les principes sont les mêmes pour Microsoft 365 et pour Google Workspace.

## 1. Imposer l'authentification multifacteur (MFA)

C'est la mesure qui apporte le plus. Un mot de passe volé ne suffit plus à entrer.

- **Microsoft 365** : les valeurs de sécurité par défaut (« Security defaults ») d'Entra ID imposent la MFA à tous les utilisateurs, bloquent l'authentification héritée et protègent l'accès au portail Azure. Elles sont activées automatiquement sur les nouveaux tenants. Pour plus de finesse, les **accès conditionnels** (selon l'emplacement, l'appareil, le risque) nécessitent au moins une licence Microsoft Entra ID P1, incluse par exemple dans Microsoft 365 Business Premium.
- **Google Workspace** : la **validation en deux étapes** s'applique par unité d'organisation depuis la console d'administration, avec une période de grâce pour l'enrôlement. Google déploie progressivement son obligation pour les comptes administrateurs.

Préférez, quand c'est possible, des méthodes résistantes à l'hameçonnage (**clés de sécurité, passkeys**) aux codes SMS, et rendez-les **obligatoires pour les administrateurs**.

## 2. Protéger les comptes administrateurs

- Limiter le **nombre d'administrateurs** au strict nécessaire, avec le rôle minimal pour chaque tâche (évitez le rôle « super administrateur » par commodité).
- Utiliser des **comptes d'administration dédiés**, distincts du compte de messagerie quotidien : un hameçonnage sur la boîte mail ne doit pas donner accès à la console d'administration.
- Prévoir **deux comptes de secours** (« break-glass »), réservés aux urgences et rattachés à personne en particulier, pour ne pas perdre l'accès en cas de panne de MFA ou d'erreur de configuration. Depuis l'imposition de la MFA sur les portails d'administration Microsoft, ces comptes doivent eux aussi avoir une méthode MFA : Microsoft recommande une **clé de sécurité FIDO2** ou l'authentification par certificat, plutôt qu'un simple mot de passe conservé hors ligne. Excluez-les d'au moins une politique d'accès conditionnel, et surveillez toute connexion avec une alerte.

## 3. Bloquer l'authentification héritée

Les protocoles anciens (IMAP, POP, SMTP authentifié avec identifiant et mot de passe simples) ne gèrent pas la MFA et sont la cible d'attaques par énumération de mots de passe.

- Dans Microsoft 365, les valeurs de sécurité par défaut bloquent déjà l'authentification héritée. Sinon, désactivez l'authentification de base pour les protocoles dont vous n'avez pas besoin, ou bloquez-la par accès conditionnel. L'authentification de base pour **SMTP AUTH** (envoi par les scanners et applications) reste possible aujourd'hui, mais Microsoft prévoit de la désactiver par défaut fin 2026 sur les tenants existants, avant une suppression définitive dont la date n'est pas encore annoncée.
- Dans Google Workspace, l'accès des « applications moins sécurisées » est supprimé depuis le 14 mars 2025 : les applications doivent passer par OAuth, ou par un mot de passe d'application sur les comptes qui ont la validation en deux étapes.
- Recensez les équipements qui envoient du courrier (scanners, applications) : ils utilisent souvent ces protocoles et devront être migrés vers une méthode moderne (relais SMTP authentifié par adresse IP, connecteur dédié, OAuth).

## 4. Surveiller le transfert automatique de courrier

Après une compromission, l'attaquant crée fréquemment une **règle de transfert** vers une adresse externe, pour continuer à lire le courrier même après le changement de mot de passe.

- Restreindre ou interdire le **transfert automatique vers l'extérieur**.
- Auditer régulièrement les règles de boîte et les délégations.
- Configurer des **alertes** de création de règles de transfert et de connexions suspectes.

## 5. Encadrer le partage externe

- Définir une politique de partage par défaut **restrictive** : partage uniquement avec des personnes nommées, pas de lien « tous ceux qui ont le lien » sans expiration pour les données sensibles.
- Limiter les domaines externes autorisés pour les documents confidentiels.
- Vérifier périodiquement qui a accès aux espaces partagés importants.

## 6. Authentifier le courrier sortant

SPF, DKIM et DMARC protègent à la fois votre délivrabilité et votre marque contre l'usurpation de domaine. C'est une mesure de sécurité autant que de messagerie : voir [SPF, DKIM, DMARC expliqués](/blog/spf-dkim-dmarc-expliques/).

## 7. Activer et conserver les journaux

Sans journaux, impossible de savoir ce qui s'est passé après un incident. Vérifiez que l'**audit** est activé, que la durée de conservation convient à votre besoin, et sachez où consulter : journaux de connexion, d'administration, d'accès aux fichiers et de messagerie.

## 8. Sauvegarder, car la rétention n'est pas une sauvegarde

Les plateformes cloud assurent la disponibilité du service, **pas la restauration de vos données** après une suppression, une corruption ou un rançongiciel. La corbeille et la rétention ont une durée limitée. Une **sauvegarde tierce** (distincte du tenant) est la seule garantie réelle pour les données critiques.

## 9. Gérer le départ des collaborateurs

Définir et appliquer une procédure, à chaque départ :

1. Désactiver le compte et révoquer les sessions et mots de passe d'application.
2. Récupérer ou transférer les données (boîte, documents) vers le responsable.
3. Gérer les abonnements, alias et groupes dont il était propriétaire.
4. Récupérer l'appareil et retirer l'accès aux outils tiers (SSO).
5. Ne supprimer la licence qu'après avoir sauvegardé ce qui doit l'être.

## 10. Sensibiliser

La technique ne suffit pas : une courte sensibilisation régulière à l'hameçonnage (repérer un faux message, vérifier une demande de virement par un second canal) reste l'une des mesures les plus rentables.

## Par où commencer ?

Si vous ne deviez faire que trois choses cette semaine : **imposer la MFA à tous**, **protéger les comptes administrateurs** et **bloquer le transfert automatique externe**. Le reste suit, par ordre de risque, au rythme de l'entreprise.

## Sources

- [Microsoft : valeurs de sécurité par défaut de Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/fundamentals/security-defaults)
- [Microsoft : comptes d'accès d'urgence (break-glass)](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access)
- [Avis MC786329 du Message Center Microsoft sur la fin de SMTP AUTH en authentification de base](https://www.itelio.com/en/microsoft-message-center/MC786329) (relayé par Itelio, mis à jour en janvier 2026)
- [Google : passer des applications moins sécurisées à OAuth](https://knowledge.workspace.google.com/admin/sync/transition-from-less-secure-apps-to-oauth)
- [Google : obligation de la validation en deux étapes pour les administrateurs](https://knowledge.workspace.google.com/admin/security/about-2sv-enforcement-for-admins)
