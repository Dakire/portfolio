---
title: "Journaux d'événements Windows : les ID à connaître"
description: "Les événements de sécurité et de démarrage à surveiller dans une petite structure : ouvertures de session, comptes, groupes, verrouillages, Kerberos, avec filtres PowerShell et prérequis d'audit."
date: 2026-10-28
category: securite
tags: ['Windows', 'Journaux', 'Active Directory', 'Audit', 'PowerShell']
---

Quand un poste redémarre seul, qu'un compte se verrouille chaque matin ou qu'on soupçonne une intrusion, la première source est le même fichier : les journaux d'événements. Il en existe des milliers de types ; dans une petite structure, une vingtaine d'identifiants suffisent pour répondre à l'essentiel des questions courantes. Cet article les liste avec leur sens, explique comment les filtrer et rappelle un prérequis qu'on oublie souvent : **sans stratégie d'audit, certains événements n'existent pas**.

## Prérequis : activer l'audit

Les événements de sécurité ne sont pas tous écrits par défaut. Microsoft précise que le comportement de journalisation par défaut varie selon la version et l'édition, que beaucoup de paramètres d'audit sont sur « Non configuré », et que certains événements demandent une configuration explicite.

- **Où** : `secpol.msc` en local, ou une stratégie de groupe (GPO) dans « Configuration avancée de la stratégie d'audit » (_Advanced Audit Policy Configuration_), sous les paramètres de sécurité.
- **Quoi activer** (succès et échec) au minimum : _Audit Logon_, _Audit Logoff_, _Audit Account Lockout_, _Audit Special Logon_ (catégorie Ouvrir/fermer la session) ; _Audit User Account Management_ et _Audit Security Group Management_ (catégorie Gestion des comptes) ; sur les contrôleurs de domaine, _Audit Kerberos Authentication Service_ et _Audit Kerberos Service Ticket Operations_ (catégorie Ouverture de session de compte).
- **En ligne de commande** (administrateur) : `auditpol /set /subcategory:"Logon" /success:enable /failure:enable`.
- **Taille du journal** : un journal Sécurité trop petit écrase les anciens événements, ceux d'une intrusion de la semaine dernière compris. Augmentez-la.

## Journal Sécurité : connexions

| ID     | Signification (Microsoft)                                   |
| ------ | ----------------------------------------------------------- |
| `4624` | Ouverture de session réussie (créée sur la machine accédée) |
| `4625` | Échec d'ouverture de session                                |
| `4634` | Fermeture de session                                        |
| `4647` | Fermeture de session à l'initiative de l'utilisateur        |
| `4648` | Ouverture de session avec des identifiants explicites       |
| `4672` | Privilèges spéciaux attribués à une nouvelle session        |

`4672` apparaît dès qu'une session reçoit un privilège sensible (par exemple `SeDebugPrivilege` ou `SeBackupPrivilege`) : les comptes SYSTEM en génèrent en permanence, donc ce qui compte est un **compte utilisateur inattendu** dans cette liste.

### Les types d'ouverture de session (`LogonType`)

Dans `4624` et `4625`, le champ `LogonType` dit _comment_ la session a été ouverte :

- **2** Interactive : clavier devant la machine.
- **3** Network : accès réseau (partage de fichiers, par exemple).
- **4** Batch : tâche exécutée sans intervention de l'utilisateur.
- **5** Service : démarrage d'un service.
- **7** Unlock : déverrouillage du poste.
- **8** NetworkCleartext : réseau, mot de passe transmis à l'authentification sous forme non hachée.
- **9** NewCredentials : nouveaux identifiants pour les connexions sortantes (`runas /netonly`, par exemple).
- **10** RemoteInteractive : Bureau à distance (RDP).
- **11** CachedInteractive : identifiants mis en cache, sans contacter le contrôleur de domaine.

Des échecs `4625` de type 10 en rafale venant d'une adresse inconnue évoquent un Bureau à distance exposé qu'on attaque. Des échecs de type 3 répétés peuvent venir d'un partage ou d'un service qui présente un mot de passe périmé : le champ `Source Network Address` aide à trancher.

## Journal Sécurité : comptes et groupes

| ID     | Signification (Microsoft)                                 |
| ------ | --------------------------------------------------------- |
| `4720` | Compte utilisateur créé                                   |
| `4722` | Compte utilisateur activé                                 |
| `4724` | Tentative de réinitialisation du mot de passe d'un compte |
| `4725` | Compte utilisateur désactivé                              |
| `4726` | Compte utilisateur supprimé                               |
| `4728` | Membre ajouté à un groupe global avec sécurité activée    |
| `4732` | Membre ajouté à un groupe local avec sécurité activée     |
| `4756` | Membre ajouté à un groupe universel avec sécurité activée |
| `4740` | Compte utilisateur verrouillé                             |

Un `4720` suivi d'un `4728` ou `4732` qui ajoute le nouveau compte à un groupe d'administrateurs, hors de toute demande, mérite une explication immédiate. Pour `4740`, le champ _Caller Computer Name_ donne la machine d'où venaient les tentatives qui ont verrouillé le compte : c'est le moyen le plus rapide de trouver le poste qui garde un vieux mot de passe en mémoire.

## Journal Sécurité : Kerberos (contrôleurs de domaine)

- `4768` : un ticket d'authentification Kerberos (TGT) a été demandé. Un code résultat `0x6` signifie que le nom d'utilisateur n'existe pas : en série, c'est un indice d'énumération de comptes.
- `4769` : un ticket de service Kerberos a été demandé.
- `4771` : la pré-authentification Kerberos a échoué. Le code `0x18` signifie un mauvais mot de passe ; beaucoup d'événements en peu de temps peuvent indiquer une attaque par force brute.

Ces trois événements ne sont générés que sur les contrôleurs de domaine. Les détails de l'annuaire sont dans l'[aide-mémoire Active Directory](/cheatsheets/active-directory/).

## Journal Sécurité : le signal d'alarme

- `1102` : le journal d'audit a été effacé. Microsoft recommande de l'investiguer : il n'y a normalement aucune raison d'effacer le journal Sécurité à la main.
- `4719` : la stratégie d'audit du système a été modifiée.
- `4697` : un service a été installé dans le système (Windows 10 et Windows Server 2016 ou plus récent, sous-catégorie _Audit Security System Extension_).

## Journal Système : redémarrages

- `41` (Kernel-Power, niveau critique) : le système a redémarré sans arrêt propre, enregistré au démarrage suivant. Coupure de courant, écran bleu ou arrêt forcé au bouton ; un code d'erreur (`BugcheckCode`) à zéro oriente plutôt vers l'alimentation.
- `1074` : un arrêt ou un redémarrage a été demandé par un processus ou un utilisateur (`shutdown.exe` y inscrit le motif).
- `6006` : arrêt normal.
- `6008` : l'arrêt précédent n'était pas prévu. Il peut aussi apparaître après un arrêt forcé par un programme alors que le poste est verrouillé.

Après l'installation des mises à jour du [Patch Tuesday](/blog/patch-tuesday-octobre-2026-pme/), ces événements permettent de distinguer un redémarrage demandé (`1074`) d'un arrêt sauvage (`41`, `6008`).

## Filtrer : Observateur d'événements et PowerShell

Dans l'**Observateur d'événements**, ouvrez « Journaux Windows », puis « Sécurité » ou « Système », et utilisez « Filtrer le journal actuel » ou « Créer une vue personnalisée » pour saisir un ou plusieurs ID.

En PowerShell (exécuté en administrateur pour lire le journal Sécurité), `Get-WinEvent` avec `-FilterHashtable` filtre à la source, plus efficacement qu'un `Where-Object` :

```powershell
# Redémarrages inattendus et demandés, sur 7 jours
Get-WinEvent -FilterHashtable @{
    LogName   = 'System'
    Id        = 41, 1074, 6006, 6008
    StartTime = (Get-Date).AddDays(-7)
}

# Le journal d'audit a-t-il été effacé ?
Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 1102 }
```

### Détecter une rafale d'échecs de connexion

```powershell
$echecs = Get-WinEvent -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4625
    StartTime = (Get-Date).AddHours(-1)
}
$echecs | ForEach-Object {
    $d = @{}
    ([xml]$_.ToXml()).Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [pscustomobject]@{ Compte = $d['TargetUserName']; Source = $d['IpAddress']; Type = $d['LogonType'] }
} | Group-Object Compte, Source, Type |
    Sort-Object Count -Descending |
    Select-Object -First 10 Count, Name
```

Des dizaines d'échecs pour un même compte et une même adresse en une heure : verrouillez, bloquez la source et vérifiez le champ `Status` de l'événement (`0xC000006A` mauvais mot de passe, `0xC0000064` compte inexistant, `0xC0000072` compte désactivé). Pour un mail d'hameçonnage reçu juste avant, [lisez ses en-têtes](/blog/lire-en-tetes-email-received-spf-dkim-dmarc/). Toutes les commandes utiles sont dans l'[aide-mémoire des événements Windows](/cheatsheets/evenements-windows/).

## Sources

- [Microsoft Learn : Appendix L, événements à surveiller](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/appendix-l--events-to-monitor)
- [Microsoft Learn : événement 4624](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624)
- [Microsoft Learn : événement 4625](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4625)
- [Microsoft Learn : événement 4672](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4672)
- [Microsoft Learn : événement 4740](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4740)
- [Microsoft Learn : événement 4768](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4768)
- [Microsoft Learn : événement 4771](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4771)
- [Microsoft Learn : événement 4697](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4697)
- [Microsoft Learn : événement 1102](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-1102)
- [Microsoft Learn : événement 41 (Kernel-Power)](https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/event-id-41-restart)
- [Microsoft Support : événement 6008](https://support.microsoft.com/en-US/servicing/servers/hotfix/2018/04/event-id-6008-is-unexpectedly-logged-to-the-system-event-log-after-you-shut-down-and-restart-your-co)
- [Microsoft Learn : paramètres avancés de la stratégie d'audit](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/advanced-security-audit-policy-settings)
- [Microsoft Learn : auditpol set](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/auditpol-set)
- [Microsoft Learn : Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent?view=powershell-7.5)
