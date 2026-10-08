---
title: 'Migrer vers Microsoft 365 ou Google Workspace : checklist'
description: "Inventaire, méthode de migration, TTL, bascule des MX et vérifications : les étapes qui évitent les mails perdus lors d'un changement de messagerie."
date: 2026-10-03
category: migration
tags: ['Microsoft 365', 'Google Workspace', 'IMAP']
---

Une migration de messagerie est un projet à faible tolérance : si les mails ne sont plus reçus pendant une demi-journée, tout le monde s'en aperçoit. La technique est rarement le problème. Ce qui fait dérailler un projet, c'est presque toujours **ce qui n'avait pas été recensé** : une boîte partagée, une application qui envoie des mails, un alias oublié. Voici une checklist valable aussi bien vers Google Workspace que vers Microsoft 365.

## 1. Inventorier avant de toucher à quoi que ce soit

- Les **boîtes utilisateurs**, avec leur volumétrie (elle détermine la durée de la copie).
- Les **alias** et adresses secondaires.
- Les **boîtes partagées / de ressources** (salles, matériel) et les **listes de diffusion / groupes**.
- Les **délégations** et permissions entre boîtes.
- Les **calendriers et contacts** : ils ne sont pas migrés par toutes les méthodes.
- Les **archives locales** (fichiers PST ou équivalents) qui n'existent que sur un poste.
- Les **règles de transfert** et de tri automatiques.
- Tout ce qui **envoie du courrier** avec votre domaine : scanners, imprimantes, ERP, CRM, outils de supervision, sites web. Ces équipements utilisent souvent un relais SMTP de l'ancien serveur, qui disparaîtra avec lui.

## 2. Choisir la méthode de migration

| Méthode                          | Principe                                                                                       | Convient pour                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Migration IMAP                   | Copie le contenu des boîtes via IMAP                                                           | Source non Exchange. Ne transfère généralement ni calendriers ni contacts                                   |
| Migration complète (« cutover ») | Tout est copié puis on bascule d'un coup                                                       | Source Exchange, petites structures. Microsoft la limite à 2 000 boîtes et conseille de ne pas dépasser 150 |
| Migration par étapes / hybride   | Les boîtes migrent par lots, avec coexistence                                                  | Structures plus importantes, ou migration sur plusieurs semaines                                            |
| Outils des éditeurs              | Service de migration de données de Google, assistants de migration de la console Microsoft 365 | Dépend de la source et de la cible : consulter la documentation à jour                                      |

La bonne méthode dépend de la source (Exchange, IMAP, autre) et de la taille. Dans tous les cas, **réalisez d'abord un pilote** sur 2 à 3 comptes.

## 3. Préparer le DNS, 48 heures avant

Le DNS est le cœur de la bascule. L'enregistrement **MX** indique où livrer le courrier de votre domaine : le changer, c'est basculer.

- **Réduire le TTL** des enregistrements MX (par exemple à 300 secondes) au moins 48 h avant, selon l'ancien TTL. Ainsi, le jour J, la bascule sera effective en quelques minutes et un retour arrière sera possible.
- **Valider la propriété du domaine** chez le nouveau fournisseur (enregistrement TXT de vérification).
- Préparer les enregistrements cibles : MX, SPF, DKIM, DMARC. Pour la théorie, voir [SPF, DKIM, DMARC expliqués](/blog/spf-dkim-dmarc-expliques/).
- Noter l'état actuel de **toute la zone** (export ou capture) pour pouvoir revenir en arrière.

## 4. Copier les données avant la bascule

La plus grande partie du volume est copiée **avant** le changement de MX, en tâche de fond, sans coupure. Le jour J, il ne reste qu'une synchronisation incrémentale des derniers messages. Prévoyez une marge : sur de grosses boîtes, la copie peut prendre plusieurs jours.

## 5. Le jour de la bascule

1. Choisir un créneau à faible trafic (fin de journée ou week-end).
2. Lancer une dernière synchronisation.
3. **Modifier les MX** vers le nouveau fournisseur et supprimer les anciens (ne laissez pas deux serveurs concurrents en priorité identique).
4. Mettre à jour **SPF** : ajouter le nouveau fournisseur et retirer l'ancien une fois la bascule validée.
5. Activer **DKIM** chez le nouveau fournisseur.
6. Envoyer et recevoir des messages de test, avec des adresses internes, Gmail, Outlook.com, et un domaine tiers.
7. Lancer une **dernière synchronisation** pour récupérer les mails arrivés pendant la propagation (ceux qui ont été livrés à l'ancien serveur, car des caches DNS tardent à expirer).

## 6. Après la bascule

- **Reconfigurer les clients** : profil Outlook, applications de messagerie, smartphones. C'est souvent ce qui génère le plus de tickets : prévoyez une documentation et une permanence.
- **Reconfigurer les équipements et applications** qui envoient du courrier (imprimantes, scanners, applications métiers) avec les nouveaux paramètres SMTP.
- **Vérifier les règles de transfert, les délégations, les calendriers partagés.**
- Surveiller les rapports **DMARC** pendant les semaines suivantes : un expéditeur oublié y apparaîtra tout de suite.
- **Attendre avant de nettoyer** : Microsoft recommande de patienter jusqu'à 72 heures après le changement de MX avant de supprimer le lot de migration, le temps que tous les expéditeurs aient pris en compte la nouvelle destination.
- **Conserver l'ancien serveur** en lecture seule le temps de valider (au moins quelques semaines) avant de le décommissionner.

## Les pièges classiques

- **TTL non abaissé** : la bascule met des heures à se propager, avec des mails répartis entre deux serveurs.
- **Application oubliée** : un ERP qui envoyait ses factures par l'ancien relais cesse silencieusement d'envoyer.
- **Boîtes partagées ou de ressources** mal migrées, délégations perdues. Côté Microsoft 365, une boîte partagée de plus de 50 Go nécessite une licence.
- **Calendriers et contacts non migrés** parce qu'on a choisi l'IMAP.
- **Pas de plan de retour arrière** : avec un TTL court et la zone DNS d'origine sauvegardée, revenir en arrière tient en une modification.
- **Communication insuffisante** : prévenir les utilisateurs de ce qui change, quand, et qui contacter.

## En résumé

Une migration réussie repose surtout sur la préparation : inventaire complet, pilote, TTL abaissé, DNS préparé, plan de retour arrière. La bascule elle-même ne prend que quelques minutes.

## Sources

- [Microsoft : migration « cutover » vers Exchange Online](https://learn.microsoft.com/en-us/exchange/mailbox-migration/cutover-migration-to-office-365) (limites, TTL, délai de 72 heures)
- [Microsoft : ajouter des enregistrements DNS pour connecter votre domaine](https://learn.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/create-dns-records-at-any-dns-hosting-provider)
- [Google : service de migration de données](https://support.google.com/a/answer/6351475)
