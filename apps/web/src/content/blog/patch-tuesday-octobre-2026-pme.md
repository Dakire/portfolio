---
title: "Patch Tuesday d'octobre 2026 : quoi installer en premier dans une petite structure"
description: "Une faille Windows Shell déjà exploitée, un record de correctifs, deux problèmes connus à surveiller et la fin de Windows 11 24H2 Famille et Pro : ce qu'il faut traiter d'abord, ce qui peut attendre."
date: 2026-10-28
category: securite
tags: ['Patch Tuesday', 'Windows 11', 'Sécurité', 'Mises à jour']
---

Le Patch Tuesday du **13 octobre 2026** est un des plus gros jamais publiés. Pour une petite structure, le volume importe peu : ce qui compte, c'est de savoir quoi installer tout de suite, ce qui peut attendre quelques jours et ce qu'il faut surveiller après l'installation. Voici une lecture pratique, avec les sources à consulter vous-même.

## Un total de correctifs qui dépend de qui compte

Les chiffres ne concordent pas. BleepingComputer annonce **1 411 failles** corrigées, en excluant 348 correctifs publiés plus tôt en octobre, et 70 failles critiques. IT-Connect parle de **1 407 failles** et 69 critiques. Les catégories se recoupent et leurs totaux ne s'additionnent pas toujours. Je n'ai pas pu lire un total officiel unique : la référence reste le [Security Update Guide du MSRC](https://msrc.microsoft.com/update-guide), CVE par CVE. Retenez l'ordre de grandeur (plus de 1 400), pas le chiffre exact.

## Ce qui est exploité : à installer en premier

Une seule faille est signalée comme **déjà exploitée** : **CVE-2026-96951**, un contournement de fonction de sécurité dans **Windows Shell**. Selon le MSRC, c'est une injection de commande (note CVSS 8,8, statut « Exploitation Detected ») qui permet d'échapper à la protection **Mark of the Web**, le marqueur que Windows ajoute aux fichiers venus d'Internet pour déclencher les avertissements.

Le scénario décrit par Microsoft : un fichier piégé reçu par e-mail ou messagerie instantanée, que l'utilisateur doit encore ouvrir ou dont il doit suivre un lien. Microsoft ne donne pas de détail sur les attaques observées. Conséquence concrète : un fichier téléchargé ou reçu en pièce jointe peut ne plus déclencher l'avertissement habituel. C'est la mise à jour à pousser en premier sur tous les postes. La fiche a été révisée le 26 octobre pour ajouter Microsoft Edge : mettez aussi Edge à jour.

## Ce qui est divulgué mais pas exploité

Deux autres zero-days sont publics sans être exploités, d'après BleepingComputer :

- **CVE-2026-108398** (.NET Framework) : contournement de Windows Defender Application Control. Il faut un accès authentifié local, le MSRC la note 8,8 (« Important »). Surtout utile si vous utilisez WDAC.
- **CVE-2026-92707** (MessagePack-CSharp) : déni de service, gravité modérée. Je n'ai pas relu sa fiche MSRC.

## Ce qui est critique mais non exploité

Plusieurs failles critiques ne sont pas exploitées à la publication. À installer dans la semaine, sans panique :

- **CVE-2026-96934**, serveur DHCP Windows : exécution de code à distance, CVSS 9,8, sans authentification, exploitation jugée « moins probable ». Concerne uniquement les serveurs qui font DHCP.
- **CVE-2026-70229**, Active Directory : exécution de code à distance, CVSS 8,1, exploitation « plus probable », mais complexité élevée.
- **CVE-2026-70571**, Exchange Server : e-mail piégé, CVSS 8,1, exploitation « plus probable ». Ne concerne que les serveurs Exchange que vous hébergez, pas Exchange Online.

## Comment déployer sans se faire peur

Même avec un petit parc, évitez le « tout le monde en même temps » :

1. **Pilote** : 2 à 5 postes représentatifs (un par usage : bureautique, comptabilité, poste avec logiciel métier). Installez le jour même ou le lendemain.
2. **Deuxième vague** : le reste des postes après 2 à 5 jours sans incident remonté.
3. **Serveurs en dernier**, avec une sauvegarde récente et un créneau de redémarrage prévu.

Pour la faille exploitée, raccourcissez ce calendrier : un pilote de quelques heures, puis tout le parc. Les postes qui restent sur Windows 10 hors ESU ne reçoivent rien : voir [Fin de Windows 10](/blog/fin-support-windows-10-passer-a-windows-11/).

## Les problèmes connus à surveiller

La page [Windows release health](https://learn.microsoft.com/en-us/windows/release-health/status-windows-11-24h2) et la fiche de la mise à jour [KB5127648](https://support.microsoft.com/help/5127648) (Windows 11 24H2, 25H2 et 26H2) signalent notamment :

- **Bureau à distance, erreur 0xC000000D** : des utilisateurs non administrateurs ne peuvent plus se connecter à un poste distant sur lequel la **protection de l'administrateur** (Administrator protection) est activée. Le problème vient de la préversion de septembre (KB5124010). Contournement : désactiver temporairement cette protection via la stratégie « User Account Control Type Of Admin Approval Mode » dans Intune ou la stratégie de groupe. Les bases de référence de sécurité Microsoft l'activent par défaut. La fiche KB indique un correctif pour 26H2 et 25H2 dans les mises à jour du 27 octobre (KB5127936) ; le 28 octobre, la page release health affichait encore « Mitigated ». Vérifiez l'état avant de décider.
- **Smart App Control** : sur certains postes où il avait été désactivé, impossible de le réactiver (option grisée). Même correctif annoncé pour 26H2 et 25H2 ; pour 24H2, un contournement existe, détaillé dans la fiche KB.

La même mise à jour corrige en revanche un écran noir à l'ouverture de session sur des hôtes Azure Virtual Desktop avec FSLogix, et la fermeture inattendue d'anciennes applications qui décodent de l'audio AC-3.

Le pilote sert précisément à repérer ces cas. Si vous utilisez le Bureau à distance, testez-le sur le pilote avant tout le monde. Les journaux de la machine aident à diagnostiquer : voir l'[aide-mémoire des événements Windows](/cheatsheets/evenements-windows/) et celui de [Windows 11](/cheatsheets/windows-11/).

## Fin de support de Windows 11 24H2 Famille et Pro

Le **13 octobre 2026**, Windows 11 **24H2 Famille et Pro** a atteint la fin des mises à jour : la mise à jour d'octobre est la dernière pour ces éditions. Les éditions **Entreprise et Éducation** de 24H2 restent supportées jusqu'au 12 octobre 2027.

Microsoft recommande de passer à **25H2** ou **26H2** (la 26H2 est disponible pour les postes en 25H2 et 24H2). Une mise à jour de fonctionnalités s'installe en une fois, avec un seul redémarrage : à traiter par vagues, comme un correctif, mais dès maintenant pour les postes en 24H2 Famille ou Pro. Un poste en 24H2 non migré ne reçoit plus les correctifs de sécurité, y compris celui de CVE-2026-96951.

## En résumé

1. Cette semaine : correctif Windows Shell (CVE-2026-96951) et Edge sur tous les postes, après un pilote court.
2. Dans la semaine : serveurs DHCP, Active Directory, Exchange Server s'ils existent chez vous.
3. Passer les postes en 24H2 Famille et Pro vers 25H2 ou 26H2.
4. Lire les problèmes connus avant de déployer, surtout si vous utilisez le Bureau à distance. Pour les réglages de fond, voir [sécuriser Microsoft 365 et Google Workspace](/blog/securiser-microsoft-365-google-workspace-reglages-de-base/).

Sur le même thème, côté messagerie : [Exchange Online et la fin de SMTP AUTH par mot de passe](/blog/exchange-online-smtp-auth-basic-fin-2026/).

## Sources

- [Microsoft MSRC : CVE-2026-96951, faille de contournement de fonction de sécurité dans Windows Shell](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-96951)
- [Microsoft MSRC : CVE-2026-108398 (.NET Framework)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-108398)
- [Microsoft MSRC : CVE-2026-96934 (serveur DHCP)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-96934)
- [Microsoft MSRC : CVE-2026-70229 (Active Directory)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-70229)
- [Microsoft MSRC : CVE-2026-70571 (Exchange Server)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-70571)
- [Microsoft : mise à jour KB5127648 du 13 octobre 2026](https://support.microsoft.com/help/5127648)
- [Microsoft Learn : problèmes connus de Windows 11 24H2 (release health)](https://learn.microsoft.com/en-us/windows/release-health/status-windows-11-24h2)
- [Microsoft Learn : cycle de vie de Windows 11 Famille et Pro](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro)
- [BleepingComputer : Patch Tuesday d'octobre 2026](https://www.bleepingcomputer.com/news/microsoft/microsoft-october-2026-patch-tuesday-fixes-1-411-flaws-3-zero-days/)
- [IT-Connect : récapitulatif du Patch Tuesday d'octobre 2026](https://www.it-connect.fr/patch-tuesday-octobre-2026-recapitulatif/)
