---
title: 'Windows Server 2016: End of Support on 12 January 2027'
description: 'Windows Server 2016 extended support ends on 12 January 2027. Inventory, migrating to Server 2025 or 2022, Extended Security Updates (ESU) through Azure Arc, Active Directory and a plan for a small organization.'
date: 2026-10-28
translationOf: 'fin-support-windows-server-2016-janvier-2027'
category: poste-de-travail
tags: ['Windows Server', 'Active Directory', 'Migration', 'ESU']
---

According to Microsoft Learn, **extended support for Windows Server 2016 ends on 12 January 2027**. Mainstream support ended back in January 2022. After that date there are no more free security fixes: a 2016 server keeps running, but every vulnerability discovered afterwards stays open. At the time of writing, about eleven weeks remain. Here is how to approach it in a small organization, in the same spirit as [the end of Windows 10](/en/blog/windows-10-end-of-support-upgrade-to-windows-11/).

## 1. Take stock of what is really running

Before choosing anything, you need to know what you have. For each 2016 server, physical or virtual:

- the installed **roles** (domain controller, file, print, DHCP/DNS, IIS, Remote Desktop, WSUS...);
- the **business applications** and their vendor (which Windows Server version they support);
- the **licence**: type (OEM, volume), whether Software Assurance is included, client access licences (CALs);
- the **dependencies**: who connects to what, which backups, which hypervisor.

To list the installed roles and features:

```powershell
Get-WindowsFeature | Where-Object Installed
```

Do not forget the "forgotten" servers: a test virtual machine that became production, a print server in a corner.

## 2. Choose the target: Server 2025 or 2022

According to Microsoft Learn, extended support for **Windows Server 2022** runs until October 2031 and for **Windows Server 2025** until November 2034. Microsoft recommends the latest version. A few pointers:

- **Server 2025**: the longest lifetime. Check that your business applications are validated by their vendor.
- **Server 2022**: a cautious choice if a vendor has not yet validated Server 2025; its extended support runs until 2031.
- Each Windows Server version needs **its own licence**, unlike a workstation.

## 3. The options, from best to worst

**Migrate to a supported version.** This is the normal route. Two methods:

- **New server, then migrate roles and data**: the cleanest. The built-in tools (Windows Server Migration Tools, Storage Migration Service for file servers) help.
- **In-place upgrade**: from installation media, a 2016 server can go directly to 2019, 2022 or 2025 (Microsoft allows up to four versions of gap towards Server 2025). Back up first, and not every role supports it.

**Buy Extended Security Updates (ESU).** Microsoft has opened ESUs for Windows Server 2016: _critical_ and _important_ fixes for a maximum of three years, through 2030, with no new features. What the Microsoft documentation says:

- Through **Azure Arc**: configurable in the Azure portal since 3 August 2026, **billing starts on 13 January 2027**, paid monthly. You need to install the Azure Connected Machine agent (version 1.62 or higher); only the Standard and Datacenter editions are supported.
- **Licensing condition**: Software Assurance (Enterprise Agreement, Open Value, etc.), or subscription/SPLA licensing. A small organization on OEM licences therefore probably does not qualify.
- **Free** for servers hosted in Azure (Azure virtual machines, Azure VMware Solution, the Azure Stack portfolio), according to Microsoft's ESU page. Moving to Azure is therefore also a stop-gap option.
- Microsoft's page also mentions purchase through volume licensing, in annual increments. Prices do not appear in the pages I read: confirm with your reseller.

ESU is a stop-gap, not a strategy: it costs money, and it does not remove the technical debt.

## 4. What can break

**Active Directory.** This is the point that needs the most care.

- Microsoft recommends **not upgrading a domain controller in place**, but installing new servers, promoting them, moving the FSMO roles, then demoting the old ones. The schema is prepared automatically at promotion.
- A **Server 2025 controller does not work with the 2012 R2 functional level**: you must be at the 2016 level at least. The functional level is only raised after the old controllers have been removed, and you cannot always go back.
- SYSVOL replication must use **DFSR** (Windows Server 2016 is the last version to handle the old FRS).
- Cheat sheet: [Active Directory](/cheatsheets/active-directory/).

**Other roles.** Print and Fax Services and AD FS cannot be upgraded in place (migration, using `Printbrm.exe` for printing). For Remote Desktop, a mixed-version farm is not supported, and RDS licences must be migrated. Check the [role migration matrix](https://learn.microsoft.com/en-us/windows-server/get-started/upgrade-migrate-roles-features).

**Applications.** Drivers, backup agents, antivirus, business software: test on a copy before the switch.

## 5. A plan for a small organization

1. Inventory of servers, roles, applications and licences.
2. Choice of target, checked with the vendors.
3. Budget (licences, possibly hardware) and a realistic schedule.
4. Install the new server next to the old one, migrate the roles, test with a few users.
5. Cut over outside working hours, with a verified backup.
6. Keep the old server powered off for a while, then remove it.

## 6. If migration is impossible before the date

For a server that has to stay on 2016 (frozen application, specific hardware), reduce its exposure:

- isolate it in a **dedicated VLAN**, with firewall rules limited to the flows that are needed;
- no direct Internet access, and no exposed Remote Desktop;
- reduced administration rights and stronger authentication;
- regular backups, including an offline one, and a tested restore;
- a written exit date, so the exception does not become permanent.

Also think about the **2011 Secure Boot certificates** that expire this year: 2016 servers are affected, see [the Secure Boot article](/en/blog/secure-boot-2011-certificates-expiry-check/).

## Sources

- [Microsoft Learn: Windows Server 2016 lifecycle](https://learn.microsoft.com/en-us/lifecycle/products/windows-server-2016)
- [Microsoft: Support for Windows Server 2016 will end in January 2027 (KB 5069229)](https://support.microsoft.com/help/5069229)
- [Microsoft Learn: Windows Server 2022 lifecycle](https://learn.microsoft.com/en-us/lifecycle/products/windows-server-2022) and [Windows Server 2025](https://learn.microsoft.com/en-us/lifecycle/products/windows-server-2025)
- [Microsoft Learn: deliver Windows Server ESUs through Azure Arc](https://learn.microsoft.com/en-us/azure/azure-arc/servers/prepare-extended-security-updates)
- [Microsoft: Extended Security Updates for SQL Server and Windows Server](https://www.microsoft.com/windows-server/extended-security-updates)
- [Microsoft Learn: plan your Windows Server upgrade path](https://learn.microsoft.com/en-us/windows-server/get-started/install-upgrade-migrate)
- [Microsoft Learn: upgrade and migrate roles and features](https://learn.microsoft.com/en-us/windows-server/get-started/upgrade-migrate-roles-features)
- [Microsoft Learn: upgrade domain controllers](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/upgrade-domain-controllers)
- [Microsoft Learn: Active Directory functional levels](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/active-directory-functional-levels)
