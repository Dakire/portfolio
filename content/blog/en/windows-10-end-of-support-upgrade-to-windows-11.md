---
title: Windows 10 End of Support: Planning the Move to Windows 11
description: Hardware requirements, fleet inventory, Extended Security Updates (ESU), Windows 11 lifecycle and a migration plan for a small business.
date: 2026-10-03
translationOf: fin-support-windows-10-passer-a-windows-11
---

**Windows 10 (version 22H2) support ended on 14 October 2025**: Microsoft no longer publishes free security fixes for this version. A computer that stays on it keeps working, but it is no longer patched, which creates a security problem, a compliance problem (insurance, cyber-insurance, audits) and, over time, a software compatibility problem. Here is how to approach the transition in a small organization.

## 1. Windows 11 requirements

Windows 11 requires newer hardware than Windows 10:

- A 64-bit processor, 1 GHz or faster, 2 or more cores, **on the list of compatible processors** (in practice, Intel 8th generation or later and AMD Ryzen 2000 series or later, with exceptions).
- **TPM 2.0** (Trusted Platform Module).
- **UEFI** boot with **Secure Boot** available.
- At least 4 GB of RAM and 64 GB of storage.

The two points that block most often: a **processor that is too old**, and **TPM or Secure Boot disabled** in the BIOS (in which case it is simply a setting).

## 2. Inventory the fleet

You can't plan without knowing what you have. For each computer, record: model, age, processor, RAM, storage, Windows version and edition, and user. Device management or inventory tools (Intune, an inventory tool) do this automatically. Otherwise, a PowerShell script is enough for a small fleet:

```powershell
Get-Tpm | Select-Object TpmPresent, TpmReady
Confirm-SecureBootUEFI
Get-CimInstance Win32_Processor | Select-Object Name
Get-CimInstance Win32_ComputerSystem | Select-Object Model, TotalPhysicalMemory
```

Microsoft's **PC Health Check** app also gives a compatibility verdict computer by computer.

## 3. Sort computers into three categories

1. **Compatible and up to date**: in-place upgrade possible.
2. **Compatible after adjustment**: TPM or Secure Boot to enable in the BIOS, firmware update.
3. **Not compatible**: replacement to budget for, in priority order (most exposed, oldest, most critical machines).

## 4. If a computer can't migrate right away

Microsoft offers **Extended Security Updates (ESU)** for Windows 10 version 22H2. They contain only critical and important security fixes, with no new features and no general support.

- **Businesses and education organizations**: up to **3 years** of coverage, i.e. until October 2028. The announced price is **$61 per device for the first year, then it doubles each year** ($122, then $244). ESU is included at no extra cost for Windows 10 machines hosted on Windows 365 or Azure Virtual Desktop.
- **Individuals**: a single year, ending on **13 October 2026**. In the European Economic Area (France included), enrollment is free with a Microsoft account. Elsewhere, it requires Windows Backup sync, 1,000 Microsoft Rewards points or a one-time $30 payment.

Amounts and conditions may change: check **Microsoft's official page** before deciding. ESU is a stopgap, not a strategy: it costs money, and for businesses its price doubles every year.

For a computer that absolutely must stay on Windows 10 (line-of-business software or specific hardware), isolate it: no direct Internet access if possible, network segmentation, limited user rights, regular backups.

## 5. Test your applications

Before the general rollout, validate with a representative **pilot group** (one machine per department or type of use):

- Line-of-business software and drivers (printers, scanners, specific peripherals).
- Connections to servers, VPN, network shares.
- Email add-ins and Office macros.

The vast majority of applications that work on Windows 10 work on Windows 11. Problems mostly come from old drivers and very old applications.

## 6. Deploy

- **In-place upgrade** for compatible computers: data and applications are kept. Make **backups** first.
- **Clean install** for new machines or those to be reset. A modern deployment tool (Autopilot with Intune, for example) lets you prepare a computer without manual intervention. Microsoft Deployment Toolkit (MDT), long used, was officially retired by Microsoft in January 2026 (no more updates, security fixes or support): if you still use it, plan to move away from it.
- Roll out **in waves**: pilot first, then one department at a time, with a dedicated support slot.
- Plan the **communication**: what changes in the interface (Start menu, taskbar, settings) and who to contact.

## 7. Understand the lifecycle of Windows 11 itself

Windows 11 also reaches end of support, **per version**. Each annual update is supported for a limited time: as a rule **24 months for Home and Pro editions, 36 months for Enterprise and Education**. Staying on an old version therefore ends up exposing you to the same problem as Windows 10.

Two dates to remember for Home and Pro editions:

- **Windows 11 24H2**: end of support on **13 October 2026**.
- **Windows 11 25H2**: end of support on **12 October 2027**.

Enterprise and Education editions get 12 extra months. Check the exact dates for your version on Microsoft's lifecycle page, and set up update rings (a small group first, then the rest of the fleet).

## Typical plan for a small business

1. Full fleet inventory.
2. Classification: compatible, to adjust, to replace.
3. Replacement budget and schedule.
4. Pilot with a small group.
5. Rollout in waves.
6. Ongoing tracking of Windows version lifecycles.

The sooner the better: a planned migration almost always costs less than an emergency one.

## Sources

- [Microsoft: Windows 10 Home and Pro lifecycle](https://learn.microsoft.com/en-us/lifecycle/products/windows-10-home-and-pro) (end of support on 14 October 2025)
- [Microsoft: Windows 11 Home and Pro lifecycle](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro)
- [Microsoft: Windows 11 specifications and system requirements](https://www.microsoft.com/en-us/windows/windows-11-specifications)
- [Petri: Microsoft Deployment Toolkit reaches end of support](https://petri.com/microsoft-deployment-toolkit-end-of-support/)
- [Redmond Magazine: Windows 10 Extended Security Updates pricing](https://redmondmag.com/articles/2024/04/04/microsoft-reveals-pricing-for-windows-10-extended-security-updates.aspx)
