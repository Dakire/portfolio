---
title: 'November 2026 Patch Tuesday: an Outlook Zero-Day and 1,093 Fixes'
seoTitle: 'November 2026 Patch Tuesday: Outlook Zero-Day, Priorities'
description: 'Patch Tuesday of 10 November 2026: an exploited Outlook zero-day (NTLM hash leak), 1,093 flaws fixed and the updates to install first.'
summary: 'The 10 November 2026 Patch Tuesday fixes 1,093 vulnerabilities, including an already exploited Outlook zero-day: a booby-trapped Office file can leak the user’s NTLMv2 hash. Here is the install order for a small organization, with the figures to check yourself.'
date: 2026-11-14
translationOf: 'patch-tuesday-novembre-2026-zero-day-outlook'
category: securite
tags: ['Patch Tuesday', 'Outlook', 'Windows', 'Updates']
---

_Written on 14 November 2026, from the recaps by IT-Connect, Qualys and Dark Reading. Totals vary by source; the reference is the [MSRC Security Update Guide](https://msrc.microsoft.com/update-guide), CVE by CVE. Sources at the end._

## The number: about 1,100 flaws

Microsoft fixed **1,093 vulnerabilities** on 10 November 2026 (excluding Edge), according to IT-Connect, against 1,407 in October: the second largest batch in its history. Other sources count differently (up to 1,235 when including third-party fixes): keep the order of magnitude. Breakdown cited: Windows 733, Office 174, SQL Server 52, SharePoint Server 27, Exchange Server 9; **63 critical flaws**.

As with [the October Patch Tuesday](/en/blog/patch-tuesday-october-2026-small-business/), volume matters little for a small organization: what counts is the install order.

## Install first: the exploited Outlook zero-day

- **CVE-2026-124194**, spoofing in **Outlook**, scored **6.5** and rated moderate by Microsoft, but **already exploited**. CISA added it to its Known Exploited Vulnerabilities (KEV) catalog on 10 November, with a 24 November deadline for US federal agencies.
- **The mechanism**: a booby-trapped Office file, opened by the user, makes Outlook connect to a network location controlled by the attacker, **without the usual warning** about external content. Result: a leak of the user's **NTLMv2 hash**, usable for offline cracking or NTLM relay.
- **The conditions**: network connectivity and a user action. Microsoft gives no detail about the attacks observed.
- **The versions**: Microsoft 365 Apps for Enterprise, Office LTSC 2021 and LTSC 2024. Fixed versions listed: **16.0.14334.21048** (LTSC 2021) and **16.0.17932.21140** (LTSC 2024).
- **Note**: this fix comes through the **Office update**, not only Windows Update. Check the update channel of your Microsoft 365 Apps.

**Reduce the risk meanwhile**: block outbound SMB traffic (port 445) to the Internet at the firewall, which stops the hash from reaching an external server, and limit NTLM where you can. The article [Windows Event Log IDs to Know](/en/blog/windows-event-log-ids-to-know/) helps spot abnormal NTLM authentications.

## Handle next: critical but not exploited

According to IT-Connect:

| Component        | CVE                               | Score       | Key point                                                                                                                                 |
| ---------------- | --------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Windows Search   | CVE-2026-116928                   | 9.8         | Unauthenticated code execution, triggerable through an attachment indexed on the Exchange server side. Fix in Windows cumulative updates. |
| LDAP             | CVE-2026-119958                   | 9.8         | Unauthenticated code execution on domain controllers. Exploitation rated less likely.                                                     |
| Exchange Server  | CVE-2026-118207                   | 8.8         | Code execution by a low-privileged account. Fix KB5133453, Exchange SE only.                                                              |
| Outlook          | CVE-2026-110043, -110068, -111309 | 8.8         | Three code-execution flaws triggered by viewing a booby-trapped email.                                                                    |
| Active Directory | CVE-2026-118146, -118148          | 8.8 and 7.5 | The second gives SYSTEM; exploitation rated more likely.                                                                                  |
| Hyper-V          | CVE-2026-113861                   | 7.5         | VM escape, among eight privilege escalations.                                                                                             |

On a fleet with **domain controllers and Exchange**, those servers come before workstations. With no on-premises servers, workstations and Office cover most of it.

## Cumulative updates

| Version                     | KB        |
| --------------------------- | --------- |
| Windows 11 24H2, 25H2, 26H2 | KB5132061 |
| Windows 11 23H2             | KB5131087 |
| Windows 10 21H2 / 22H2      | KB5131096 |
| Windows Server 2025         | KB5131080 |
| Windows Server 2022         | KB5131090 |
| Windows Server 2019         | KB5131085 |
| Windows Server 2016         | KB5131291 |

Two calendar points: **Windows 11 23H2 Enterprise and Education** gets its last update this month; and [Windows Server 2016 end of support](/en/blog/windows-server-2016-end-of-support-january-2027/) is approaching (January 2027). The OWA and email-sending block that appeared after October's Windows Server updates is reported as **fixed** by the 10 November updates (KB5131080).

## Plan for a small organization

1. **Today**: push the **Office / Microsoft 365 Apps** updates (Outlook zero-day) and the Windows cumulative updates to a few pilot machines.
2. **This week**: roll out to workstations, then servers (domain controllers and Exchange first), after a backup or restore point.
3. **Check** after installing: build number (`winver`), update status, email and OWA.
4. **Next date**: the **8 December 2026** Patch Tuesday.

## Key takeaways

- A single zero-day, but exploited: **Outlook, CVE-2026-124194**, fixed through Office.
- 1,093 flaws in total: do not rely on the exact number, follow the priorities.
- Servers first if you have a domain controller or Exchange; blocking outbound SMB reduces hash leaks.

## Sources

- [IT-Connect: Patch Tuesday November 2026 recap (in French)](https://www.it-connect.fr/patch-tuesday-novembre-2026-recapitulatif/)
- [Qualys: Microsoft Patch Tuesday, November 2026 Security Update Review](https://blog.qualys.com/vulnerabilities-threat-research/2026/11/10/microsoft-patch-tuesday-november-2026-security-update-review)
- [Dark Reading: November Patch Tuesday, an overflowing cornucopia of CVEs](https://darkreading.com/vulnerabilities-threats/november-patch-tuesday-cornucopia-cves)
- [eSecurity Planet: Microsoft patches an Outlook zero-day as November Patch Tuesday targets 1,000+ vulnerabilities (in French)](https://www.esecurityplanet.com/fr/news/microsoft-corrige-une-faille-zero-day-dans-outlook-alors-que-le-patch-tuesday-de-novembre-cible-plus-de-1-000-vulnerabil/)
