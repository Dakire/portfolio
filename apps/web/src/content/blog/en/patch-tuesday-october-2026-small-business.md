---
title: 'October 2026 Patch Tuesday: What to Install First in a Small Organization'
description: 'An exploited Windows Shell flaw, a record number of fixes, two known issues to watch and the end of Windows 11 24H2 Home and Pro: what to handle first and what can wait.'
date: 2026-10-28
translationOf: 'patch-tuesday-octobre-2026-pme'
category: securite
tags: ['Patch Tuesday', 'Windows 11', 'Security', 'Updates']
---

The **13 October 2026** Patch Tuesday is one of the largest ever published. For a small organization the volume matters little: what counts is knowing what to install right away, what can wait a few days and what to watch after installing. Here is a practical reading, with the sources so you can check for yourself.

## The total depends on who is counting

The numbers do not agree. BleepingComputer reports **1,411 flaws** fixed, excluding 348 fixes released earlier in October, and 70 critical ones. IT-Connect reports **1,407 flaws** and 69 critical. The categories overlap and their totals do not always add up. I could not read a single official total: the reference remains the [MSRC Security Update Guide](https://msrc.microsoft.com/update-guide), CVE by CVE. Remember the order of magnitude (more than 1,400), not the exact figure.

## What is exploited: install first

Only one flaw is flagged as **already exploited**: **CVE-2026-96951**, a security feature bypass in **Windows Shell**. According to the MSRC, it is a command injection (CVSS 8.8, status "Exploitation Detected") that lets an attacker evade **Mark of the Web**, the marker Windows adds to files that come from the internet to trigger warnings.

The scenario Microsoft describes: a crafted file received by email or instant message, which the user still has to open or follow a link to. Microsoft gives no detail about the attacks observed. In practice, a downloaded file or an email attachment may no longer trigger the usual warning. This is the update to push first on every computer. The advisory was revised on 26 October to add Microsoft Edge: update Edge too.

## Disclosed but not exploited

Two other zero-days are public but not exploited, according to BleepingComputer:

- **CVE-2026-108398** (.NET Framework): a Windows Defender Application Control bypass. It requires local authenticated access, and the MSRC rates it 8.8 ("Important"). Mostly relevant if you use WDAC.
- **CVE-2026-92707** (MessagePack-CSharp): denial of service, moderate severity. I did not re-read its MSRC page.

## Critical but not exploited

Several critical flaws are not exploited at publication. Install them within the week, without panic:

- **CVE-2026-96934**, Windows DHCP Server: remote code execution, CVSS 9.8, no authentication, exploitation rated "less likely". Only affects servers that run DHCP.
- **CVE-2026-70229**, Active Directory: remote code execution, CVSS 8.1, exploitation "more likely", but high attack complexity.
- **CVE-2026-70571**, Exchange Server: crafted email, CVSS 8.1, exploitation "more likely". Only affects Exchange servers you host yourself, not Exchange Online.

## How to deploy without losing sleep

Even with a small fleet, avoid "everyone at once":

1. **Pilot**: 2 to 5 representative computers (one per use: office work, accounting, a machine with line-of-business software). Install the same day or the next.
2. **Second wave**: the rest of the computers after 2 to 5 days without a reported incident.
3. **Servers last**, with a recent backup and a planned restart window.

For the exploited flaw, shorten this schedule: a pilot of a few hours, then the whole fleet. Computers still on Windows 10 without ESU receive nothing: see [Windows 10 end of support](/en/blog/windows-10-end-of-support-upgrade-to-windows-11/).

## Known issues to watch

The [Windows release health](https://learn.microsoft.com/en-us/windows/release-health/status-windows-11-24h2) page and the [KB5127648](https://support.microsoft.com/help/5127648) update page (Windows 11 24H2, 25H2 and 26H2) list, among others:

- **Remote Desktop, error 0xC000000D**: non-administrator users cannot connect to a remote computer that has **Administrator protection** enabled. The problem comes from the September preview update (KB5124010). Workaround: temporarily turn off this protection by resetting the "User Account Control Type Of Admin Approval Mode" policy in Intune or Group Policy. Microsoft security baselines enable it by default. The KB page states a fix for 26H2 and 25H2 in the updates of 27 October (KB5127936); on 28 October the release health page still showed "Mitigated". Check the status before deciding.
- **Smart App Control**: on some computers where it had been turned off, it cannot be turned back on (the option is grayed out). The same fix is announced for 26H2 and 25H2; for 24H2 a workaround exists, detailed on the KB page.

The same update does fix a black screen at sign-in on Azure Virtual Desktop hosts using FSLogix, and the unexpected closing of older applications that decode AC-3 audio.

The pilot exists precisely to catch such cases. If you use Remote Desktop, test it on the pilot before everyone else. The machine's logs help with diagnosis: see the [Windows events cheatsheet](/cheatsheets/evenements-windows/) and the [Windows 11 one](/cheatsheets/windows-11/).

## End of support for Windows 11 24H2 Home and Pro

On **13 October 2026**, Windows 11 **24H2 Home and Pro** reached the end of updates: the October update is the last one for these editions. The **Enterprise and Education** editions of 24H2 remain supported until 12 October 2027.

Microsoft recommends moving to **25H2** or **26H2** (26H2 is available for computers on 25H2 and 24H2). A feature update installs in one go, with a single restart: handle it in waves, like a patch, but right now for computers on 24H2 Home or Pro. A computer left on 24H2 no longer receives security fixes, including the one for CVE-2026-96951.

## Summary

1. This week: the Windows Shell fix (CVE-2026-96951) and Edge on all computers, after a short pilot.
2. Within the week: DHCP servers, Active Directory, Exchange Server if you have them.
3. Move 24H2 Home and Pro computers to 25H2 or 26H2.
4. Read the known issues before deploying, especially if you use Remote Desktop. For the underlying settings, see [securing Microsoft 365 and Google Workspace](/en/blog/secure-microsoft-365-google-workspace-baseline-settings/).

On the same theme, on the email side: [Exchange Online and the end of password-based SMTP AUTH](/en/blog/exchange-online-smtp-auth-basic-authentication-end-2026/).

## Sources

- [Microsoft MSRC: CVE-2026-96951, Windows Shell security feature bypass](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-96951)
- [Microsoft MSRC: CVE-2026-108398 (.NET Framework)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-108398)
- [Microsoft MSRC: CVE-2026-96934 (DHCP Server)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-96934)
- [Microsoft MSRC: CVE-2026-70229 (Active Directory)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-70229)
- [Microsoft MSRC: CVE-2026-70571 (Exchange Server)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-70571)
- [Microsoft: KB5127648 update of 13 October 2026](https://support.microsoft.com/help/5127648)
- [Microsoft Learn: Windows 11 24H2 known issues (release health)](https://learn.microsoft.com/en-us/windows/release-health/status-windows-11-24h2)
- [Microsoft Learn: Windows 11 Home and Pro lifecycle](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro)
- [BleepingComputer: October 2026 Patch Tuesday](https://www.bleepingcomputer.com/news/microsoft/microsoft-october-2026-patch-tuesday-fixes-1-411-flaws-3-zero-days/)
- [IT-Connect: October 2026 Patch Tuesday recap (in French)](https://www.it-connect.fr/patch-tuesday-octobre-2026-recapitulatif/)
