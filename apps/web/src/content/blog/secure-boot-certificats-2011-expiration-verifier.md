---
title: 'Secure Boot : les certificats de 2011 ont expiré, comment vérifier'
description: 'Les certificats Secure Boot de 2011 ont expiré en juin et octobre 2026. Ce que cela change, comment vérifier un poste ou un serveur, mettre à jour le firmware, et le cas de Linux, du double démarrage et des machines virtuelles.'
date: 2026-10-28
category: poste-de-travail
tags: ['Secure Boot', 'UEFI', 'Windows', 'Linux', 'Virtualisation']
---

Trois certificats Microsoft de 2011, au cœur de Secure Boot, ont expiré cette année. Au 28 octobre 2026, les trois échéances sont passées. Je n'ai pas trouvé de bilan publié sur d'éventuelles pannes après ces dates ; la documentation de Microsoft indique que les machines non mises à jour **continuent de démarrer**. Le sujet reste utile : ce qui se joue, c'est la capacité à recevoir les futures protections du démarrage.

## Les certificats concernés

D'après Microsoft (KB 5062710) :

| Certificat de 2011                    | Expiration      | Remplacé par                                                | Rôle                                                                             |
| ------------------------------------- | --------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Microsoft Corporation KEK CA 2011     | 24 juin 2026    | Microsoft Corporation KEK 2K CA 2023                        | Signe les mises à jour de la base `db` et de la liste de révocation `dbx`        |
| Microsoft UEFI CA 2011                | 27 juin 2026    | Microsoft UEFI CA 2023 et Microsoft Option ROM UEFI CA 2023 | Signe les chargeurs de démarrage tiers (Linux, par exemple) et les ROM d'options |
| Microsoft Windows Production PCA 2011 | 19 octobre 2026 | Windows UEFI CA 2023                                        | Signe le chargeur de démarrage de Windows                                        |

Les systèmes concernés vont de Windows 10 et 11 à Windows Server 2012 (ESU) jusqu'à Windows Server 2025, donc aussi [les serveurs 2016](/blog/fin-support-windows-server-2016-janvier-2027/).

## Ce que ça change concrètement

Selon Microsoft, une machine sans les certificats de 2023 « continue de démarrer et de fonctionner normalement », et les mises à jour Windows continuent de s'installer. En revanche, elle ne pourra plus recevoir de nouvelles protections du démarrage : mises à jour du gestionnaire de démarrage, de la base `db` et de la liste de révocation, correctifs de failles découvertes plus tard. Cela peut aussi toucher le durcissement de BitLocker ou les chargeurs tiers. C'est une érosion progressive plus qu'une panne brutale.

C'est la même couche que celle de [la faille UEFI PXE](/blog/faille-uefi-pxe-edk2-cve-2026-97631/) : le firmware s'exécute avant tout le reste, et il est souvent oublié dans l'inventaire.

## Vérifier l'état d'un poste ou d'un serveur

Sous Windows, en PowerShell administrateur. D'abord, Secure Boot est-il actif ? (`True` attendu ; s'il est désactivé, les mises à jour ne s'appliquent pas)

```powershell
Confirm-SecureBootUEFI
```

Ensuite, l'état du déploiement des certificats, dans la clé de registre `Servicing` :

```powershell
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\SecureBoot\Servicing" |
  Select-Object UEFICA2023Status, UEFICA2023Error
```

`UEFICA2023Status` vaut `NotStarted`, `InProgress` ou `Updated`. `UEFICA2023Error` doit être à 0. Si la clé `Servicing` est absente, la mise à jour n'a pas démarré.

Pour lire directement la base `db` du firmware (commande disponible depuis les mises à jour cumulatives du 14 avril 2026) :

```powershell
Get-SecureBootUEFI -Name db -Decoded
```

Cherchez une entrée `CN=Windows UEFI CA 2023, O=Microsoft Corporation, C=US`.

Le journal **Système** donne aussi le verdict (source TPM-WMI) : l'événement **1808** signale que l'appareil a les nouveaux certificats et le gestionnaire de démarrage signé en 2023 ; **1801** que les certificats sont prêts mais pas encore appliqués au firmware ; **1795** que le firmware a renvoyé une erreur ; **1802** que la mise à jour est bloquée par un problème connu du firmware ; **1032** qu'elle est incompatible avec la configuration BitLocker actuelle.

## Appliquer la mise à jour

- **Par défaut**, Windows Update déploie les certificats sur les appareils jugés « à haute confiance ». Microsoft prévoit environ 48 heures et un ou plusieurs redémarrages.
- **Gérée par l'administrateur** : clés de registre, WinCS, Intune ou stratégie de groupe. Ne mélangez pas les méthodes sur une même machine. Par registre, Microsoft documente la valeur `AvailableUpdates` à `0x5944`, la tâche planifiée `\Microsoft\Windows\PI\Secure-Boot-Update`, un redémarrage quand la valeur atteint `0x4100`, puis un second passage de la tâche. Testez d'abord sur quelques machines de chaque modèle.
- **Firmware** : dans certains cas, une mise à jour du BIOS/UEFI est nécessaire. Consultez le site du constructeur (touches d'accès et réglages dans l'[aide-mémoire BIOS/UEFI](/cheatsheets/bios-uefi/)).
- **BitLocker** : gardez les clés de récupération accessibles avant d'intervenir.

## Linux et double démarrage

Le firmware ne vérifie pas les dates d'expiration au démarrage : un Linux qui démarre aujourd'hui avec Secure Boot continue de démarrer. Le risque est ailleurs. Les futurs `shim` seront signés avec le certificat de 2023 ; un firmware qui ne le connaît pas pourra les refuser, et ne recevra plus les futures révocations. Canonical précise que ses mises à jour de shim après juin 2026 sont signées avec la nouvelle CA, et AlmaLinux publie déjà des shims signés avec les deux.

La base `db` est celle du firmware, partagée par tous les systèmes installés : un double démarrage dépend donc d'une base à jour, qu'on la mette à jour depuis Windows ou depuis Linux. Sous Linux :

```bash
mokutil --sb-state
mokutil --db | grep 'UEFI CA 2023'
mokutil --kek | grep 'KEK 2K CA 2023'
```

Si rien ne sort, cherchez d'abord une mise à jour du firmware, puis `fwupdmgr refresh` et `fwupdmgr update`. Attention : AlmaLinux note que certains constructeurs bloquent les mises à jour autonomes de `db` (n'insistez pas), et que le changement modifie le registre TPM PCR 7 : un déchiffrement LUKS automatique lié à ce registre devra être réenrôlé, passphrase à portée de main. Ne supprimez pas la CA de 2011.

## Machines virtuelles

- **Hyper-V** : Microsoft a résolu le 30 mars 2026 un problème connu (événement 1795) sur les machines virtuelles Hyper-V. Pour les VM anciennes, la mise à jour passe par Windows, si le firmware virtuel la permet.
- **VMware** : Broadcom (KB 423893) décrit les VM créées avant ESXi 8.0 U2 ou en version matérielle 13 : leur clé de plateforme (PK) peut être vide, ce qui bloque la mise à jour de la KEK. Les VM continuent de démarrer ; l'expiration bloque surtout les mises à jour.
- **Proxmox/OVMF** : la documentation indique que les nouveaux disques EFI créés avec `pve-edk2-firmware` 4.2025.05-1 ou plus contiennent les deux jeux de certificats. Pour un disque plus ancien, éteignez la VM puis lancez `qm enroll-efi-keys <vmid>` (ou « Enroll Updated Certificates » dans l'interface) ; l'option `ms-cert=2023k` confirme l'enrôlement. Sous Windows invité, suivez ensuite la procédure Microsoft, et désactivez les protecteurs BitLocker avant (`manage-bde -protectors -disable <lecteur>`). Voir l'[aide-mémoire Proxmox](/cheatsheets/linux-proxmox/).

## Ne pas désactiver Secure Boot pour « régler »

Désactiver Secure Boot fait disparaître l'avertissement, et aussi la protection qui bloque les chargeurs altérés. Ce n'est pas un correctif : Microsoft précise d'ailleurs que, Secure Boot désactivé, les étapes de mise à jour des certificats ne s'appliquent pas. La bonne voie : mettre à jour le firmware, appliquer les certificats, vérifier avec les commandes ci-dessus.

## Sources

- [Microsoft : Windows Secure Boot certificate expiration and CA updates (KB 5062710)](https://support.microsoft.com/help/5062710)
- [Microsoft : clés de registre pour les mises à jour Secure Boot gérées par l'IT (KB 5068202)](https://support.microsoft.com/en-us/help/5068202)
- [Microsoft : conseils pour les professionnels de l'IT](https://support.microsoft.com/en-us/topic/secure-boot-certificate-updates-guidance-for-it-professionals-and-organizations-e2b43f9f-b424-42df-bc6a-8476db65ab2f)
- [Microsoft : événements de mise à jour des variables DB et DBX](https://support.microsoft.com/en-us/topic/secure-boot-db-and-dbx-variable-update-events-37e47cf8-608b-4a87-8175-bdead630eb69)
- [Microsoft : PowerShell, utiliser le paramètre -Decoded de Get-SecureBootUEFI (KB 5093574)](https://support.microsoft.com/help/5093574)
- [Broadcom : expiration des certificats Secure Boot dans les machines virtuelles VMware (KB 423893)](https://knowledge.broadcom.com/external/article/423893)
- [Proxmox VE : documentation des machines virtuelles QEMU/KVM, expiration des CA Secure Boot](https://pve.proxmox.com/pve-docs/chapter-qm.html)
- [AlmaLinux : transition vers les certificats Microsoft 2023](https://wiki.almalinux.org/documentation/secure-boot-2023-certificates)
- [Ubuntu : rotation de la CA Microsoft UEFI](https://discourse.ubuntu.com/t/microsoft-uefi-ca-rotation-what-it-means-for-ubuntu-users-and-vendors/82652)
