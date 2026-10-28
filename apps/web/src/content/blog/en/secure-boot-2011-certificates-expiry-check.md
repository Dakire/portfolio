---
title: 'Secure Boot: the 2011 Certificates Have Expired, How to Check'
description: 'The 2011 Secure Boot certificates expired in June and October 2026. What it changes, how to check a PC or server, firmware updates, and what to do about Linux, dual-boot and virtual machines.'
date: 2026-10-28
translationOf: 'secure-boot-certificats-2011-expiration-verifier'
category: poste-de-travail
tags: ['Secure Boot', 'UEFI', 'Windows', 'Linux', 'Virtualization']
---

Three Microsoft certificates from 2011, at the heart of Secure Boot, expired this year. As of 28 October 2026, all three deadlines have passed. I did not find any published review of outages after these dates; Microsoft's documentation says that machines that have not been updated **keep booting**. The subject still matters: what is at stake is the ability to receive future boot protections.

## The certificates involved

According to Microsoft (KB 5062710):

| 2011 certificate                      | Expires         | Replaced by                                                  | Role                                                                |
| ------------------------------------- | --------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| Microsoft Corporation KEK CA 2011     | 24 June 2026    | Microsoft Corporation KEK 2K CA 2023                         | Signs updates to the `db` database and the `dbx` revocation list    |
| Microsoft UEFI CA 2011                | 27 June 2026    | Microsoft UEFI CA 2023 and Microsoft Option ROM UEFI CA 2023 | Signs third-party boot loaders (Linux, for example) and option ROMs |
| Microsoft Windows Production PCA 2011 | 19 October 2026 | Windows UEFI CA 2023                                         | Signs the Windows boot loader                                       |

Affected systems range from Windows 10 and 11 to Windows Server 2012 (ESU) up to Windows Server 2025, so [2016 servers](/en/blog/windows-server-2016-end-of-support-january-2027/) too.

## What it changes in practice

According to Microsoft, a machine without the 2023 certificates "continues to start and operate normally", and Windows updates keep installing. However, it will no longer be able to receive new boot protections: updates to the boot manager, to the `db` database and the revocation list, and fixes for vulnerabilities discovered later. It can also affect BitLocker hardening or third-party boot loaders. It is a gradual erosion rather than a sudden outage.

This is the same layer as [the UEFI PXE flaw](/en/blog/uefi-pxe-flaw-edk2-cve-2026-97631/): firmware runs before everything else, and it is often forgotten in the inventory.

## Checking the state of a PC or server

On Windows, in an elevated PowerShell. First, is Secure Boot on? (`True` expected; if it is off, the updates do not apply)

```powershell
Confirm-SecureBootUEFI
```

Then the certificate deployment state, in the `Servicing` registry key:

```powershell
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\SecureBoot\Servicing" |
  Select-Object UEFICA2023Status, UEFICA2023Error
```

`UEFICA2023Status` is `NotStarted`, `InProgress` or `Updated`. `UEFICA2023Error` should be 0. If the `Servicing` key is missing, the update has not started.

To read the firmware `db` database directly (command available since the cumulative updates of 14 April 2026):

```powershell
Get-SecureBootUEFI -Name db -Decoded
```

Look for an entry `CN=Windows UEFI CA 2023, O=Microsoft Corporation, C=US`.

The **System** event log also gives the verdict (source TPM-WMI): event **1808** means the device has the new certificates and the 2023-signed boot manager; **1801** that the certificates are ready but not yet applied to the firmware; **1795** that the firmware returned an error; **1802** that the update is blocked by a known firmware issue; **1032** that it is incompatible with the current BitLocker configuration.

## Applying the update

- **By default**, Windows Update deploys the certificates to devices considered "high confidence". Microsoft estimates about 48 hours and one or more restarts.
- **Administrator-managed**: registry keys, WinCS, Intune or Group Policy. Do not mix methods on the same machine. Through the registry, Microsoft documents the `AvailableUpdates` value set to `0x5944`, the scheduled task `\Microsoft\Windows\PI\Secure-Boot-Update`, a restart when the value reaches `0x4100`, then a second run of the task. Test on a few machines of each model first.
- **Firmware**: in some cases a BIOS/UEFI update is required. Check the manufacturer's site (access keys and settings in the [BIOS/UEFI cheat sheet](/cheatsheets/bios-uefi/)).
- **BitLocker**: keep the recovery keys within reach before you start.

## Linux and dual-boot

Firmware does not check expiry dates at boot: a Linux that boots today with Secure Boot keeps booting. The risk is elsewhere. Future `shim` builds will be signed with the 2023 certificate; firmware that does not know it may refuse them, and will not receive future revocations. Canonical states that its shim updates after June 2026 are signed with the new CA, and AlmaLinux already publishes shims signed with both.

The `db` database belongs to the firmware, shared by every installed system: a dual-boot setup therefore depends on an up-to-date database, whether it is updated from Windows or from Linux. On Linux:

```bash
mokutil --sb-state
mokutil --db | grep 'UEFI CA 2023'
mokutil --kek | grep 'KEK 2K CA 2023'
```

If nothing comes out, look for a firmware update first, then `fwupdmgr refresh` and `fwupdmgr update`. Be careful: AlmaLinux notes that some manufacturers block standalone `db` updates (do not force it), and that the change alters TPM register PCR 7: an automatic LUKS unlock bound to that register will need to be re-enrolled, with your passphrase at hand. Do not remove the 2011 CA.

## Virtual machines

- **Hyper-V**: on 30 March 2026 Microsoft resolved a known issue (event 1795) on Hyper-V virtual machines. For older VMs, the update goes through Windows, if the virtual firmware allows it.
- **VMware**: Broadcom (KB 423893) describes VMs created before ESXi 8.0 U2 or on hardware version 13: their platform key (PK) may be empty, which blocks the KEK update. The VMs keep booting; expiry mainly blocks updates.
- **Proxmox/OVMF**: the documentation says that new EFI disks created with `pve-edk2-firmware` 4.2025.05-1 or later contain both sets of certificates. For an older disk, shut the VM down and run `qm enroll-efi-keys <vmid>` (or "Enroll Updated Certificates" in the interface); the `ms-cert=2023k` option confirms the enrollment. For a Windows guest, then follow Microsoft's procedure, and disable BitLocker protectors beforehand (`manage-bde -protectors -disable <drive>`). See the [Proxmox cheat sheet](/cheatsheets/linux-proxmox/).

## Do not disable Secure Boot to "fix" it

Turning Secure Boot off makes the warning go away, and also the protection that blocks tampered boot loaders. It is not a fix: Microsoft even states that, with Secure Boot off, the certificate update steps do not apply. The right path: update the firmware, apply the certificates, and verify with the commands above.

## Sources

- [Microsoft: Windows Secure Boot certificate expiration and CA updates (KB 5062710)](https://support.microsoft.com/help/5062710)
- [Microsoft: registry key updates for IT-managed Secure Boot updates (KB 5068202)](https://support.microsoft.com/en-us/help/5068202)
- [Microsoft: guidance for IT professionals and organizations](https://support.microsoft.com/en-us/topic/secure-boot-certificate-updates-guidance-for-it-professionals-and-organizations-e2b43f9f-b424-42df-bc6a-8476db65ab2f)
- [Microsoft: Secure Boot DB and DBX variable update events](https://support.microsoft.com/en-us/topic/secure-boot-db-and-dbx-variable-update-events-37e47cf8-608b-4a87-8175-bdead630eb69)
- [Microsoft: PowerShell, using the -Decoded parameter in Get-SecureBootUEFI (KB 5093574)](https://support.microsoft.com/help/5093574)
- [Broadcom: Secure Boot certificate expirations in VMware virtual machines (KB 423893)](https://knowledge.broadcom.com/external/article/423893)
- [Proxmox VE: QEMU/KVM virtual machines documentation, Secure Boot CA expiration](https://pve.proxmox.com/pve-docs/chapter-qm.html)
- [AlmaLinux: transition to the Microsoft 2023 certificates](https://wiki.almalinux.org/documentation/secure-boot-2023-certificates)
- [Ubuntu: Microsoft UEFI CA rotation](https://discourse.ubuntu.com/t/microsoft-uefi-ca-rotation-what-it-means-for-ubuntu-users-and-vendors/82652)
