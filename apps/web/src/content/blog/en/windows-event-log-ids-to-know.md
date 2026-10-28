---
title: 'Windows Event Log IDs Worth Knowing'
description: 'The security and startup events to watch in a small business: logons, accounts, groups, lockouts, Kerberos, with PowerShell filters and the audit prerequisites.'
date: 2026-10-28
translationOf: 'journaux-evenements-windows-id-a-connaitre'
category: securite
tags: ['Windows', 'Logs', 'Active Directory', 'Audit', 'PowerShell']
---

When a PC reboots by itself, an account gets locked out every morning or you suspect an intrusion, the first source is always the same: the event logs. There are thousands of event types; in a small business, about twenty IDs are enough to answer most everyday questions. This article lists them with their meaning, explains how to filter them and reminds you of a prerequisite that is often forgotten: **without an audit policy, some events do not exist**.

## Prerequisite: turn auditing on

Not every security event is written by default. Microsoft states that the default logging behavior varies by version and edition, that many audit settings are left on "Not Configured", and that some events need explicit configuration.

- **Where**: `secpol.msc` locally, or a Group Policy Object (GPO) under "Advanced Audit Policy Configuration", in the security settings.
- **What to enable** (success and failure) at a minimum: _Audit Logon_, _Audit Logoff_, _Audit Account Lockout_, _Audit Special Logon_ (Logon/Logoff category); _Audit User Account Management_ and _Audit Security Group Management_ (Account Management category); on domain controllers, _Audit Kerberos Authentication Service_ and _Audit Kerberos Service Ticket Operations_ (Account Logon category).
- **From the command line** (administrator): `auditpol /set /subcategory:"Logon" /success:enable /failure:enable`.
- **Log size**: a Security log that is too small overwrites older events, including those of last week's intrusion. Increase it.

## Security log: logons

| ID     | Meaning (Microsoft)                                                              |
| ------ | -------------------------------------------------------------------------------- |
| `4624` | An account was successfully logged on (created on the machine that was accessed) |
| `4625` | An account failed to log on                                                      |
| `4634` | An account was logged off                                                        |
| `4647` | User initiated logoff                                                            |
| `4648` | A logon was attempted using explicit credentials                                 |
| `4672` | Special privileges assigned to new logon                                         |

`4672` appears whenever a session receives a sensitive privilege (for example `SeDebugPrivilege` or `SeBackupPrivilege`): SYSTEM logons generate it constantly, so what matters is an **unexpected user account** in that list.

### Logon types (`LogonType`)

In `4624` and `4625`, the `LogonType` field says _how_ the session was opened:

- **2** Interactive: at the machine's keyboard.
- **3** Network: network access (a file share, for example).
- **4** Batch: a task running without the user's intervention.
- **5** Service: a service being started.
- **7** Unlock: the workstation was unlocked.
- **8** NetworkCleartext: network, with the password passed to the authentication package in unhashed form.
- **9** NewCredentials: new credentials for outbound connections (`runas /netonly`, for example).
- **10** RemoteInteractive: Remote Desktop (RDP).
- **11** CachedInteractive: cached credentials, without contacting the domain controller.

A burst of `4625` failures of type 10 from an unknown address suggests an exposed Remote Desktop that is under attack. Repeated type 3 failures can come from a share or a service presenting an expired password: the `Source Network Address` field helps you decide.

## Security log: accounts and groups

| ID     | Meaning (Microsoft)                                      |
| ------ | -------------------------------------------------------- |
| `4720` | A user account was created                               |
| `4722` | A user account was enabled                               |
| `4724` | An attempt was made to reset an account's password       |
| `4725` | A user account was disabled                              |
| `4726` | A user account was deleted                               |
| `4728` | A member was added to a security-enabled global group    |
| `4732` | A member was added to a security-enabled local group     |
| `4756` | A member was added to a security-enabled universal group |
| `4740` | A user account was locked out                            |

A `4720` followed by a `4728` or `4732` that adds the new account to an administrators group, with no request behind it, deserves an immediate explanation. For `4740`, the _Caller Computer Name_ field gives the machine the attempts came from: it is the quickest way to find the PC that is holding on to an old password.

## Security log: Kerberos (domain controllers)

- `4768`: a Kerberos authentication ticket (TGT) was requested. A result code of `0x6` means the user name does not exist: in a series, it is a sign of account enumeration.
- `4769`: a Kerberos service ticket was requested.
- `4771`: Kerberos pre-authentication failed. Code `0x18` means a wrong password; many events in a short time can indicate a brute-force attack.

These three events are only generated on domain controllers. Directory details are in the [Active Directory cheatsheet](/cheatsheets/active-directory/).

## Security log: the alarm bells

- `1102`: the audit log was cleared. Microsoft recommends investigating it: there is normally no reason to clear the Security log by hand.
- `4719`: the system audit policy was changed.
- `4697`: a service was installed in the system (Windows 10 and Windows Server 2016 or later, subcategory _Audit Security System Extension_).

## System log: restarts

- `41` (Kernel-Power, critical level): the system rebooted without cleanly shutting down first, recorded at the next startup. Power loss, blue screen or forced power-off; a `BugcheckCode` of zero points rather to the power supply.
- `1074`: a shutdown or restart was requested by a process or a user (`shutdown.exe` records the reason there).
- `6006`: normal shutdown.
- `6008`: the previous shutdown was unexpected. It can also appear after a program forces a shutdown while the machine is locked.

After installing the [Patch Tuesday](/en/blog/patch-tuesday-october-2026-small-business/) updates, these events let you tell a requested restart (`1074`) from an abrupt shutdown (`41`, `6008`).

## Filtering: Event Viewer and PowerShell

In **Event Viewer**, open "Windows Logs", then "Security" or "System", and use "Filter Current Log" or "Create Custom View" to enter one or more IDs.

In PowerShell (run as administrator to read the Security log), `Get-WinEvent` with `-FilterHashtable` filters at the source, more efficiently than `Where-Object`:

```powershell
# Unexpected and requested restarts over 7 days
Get-WinEvent -FilterHashtable @{
    LogName   = 'System'
    Id        = 41, 1074, 6006, 6008
    StartTime = (Get-Date).AddDays(-7)
}

# Has the audit log been cleared?
Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 1102 }
```

### Detecting a burst of failed logons

```powershell
$failures = Get-WinEvent -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4625
    StartTime = (Get-Date).AddHours(-1)
}
$failures | ForEach-Object {
    $d = @{}
    ([xml]$_.ToXml()).Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [pscustomobject]@{ Account = $d['TargetUserName']; Source = $d['IpAddress']; Type = $d['LogonType'] }
} | Group-Object Account, Source, Type |
    Sort-Object Count -Descending |
    Select-Object -First 10 Count, Name
```

Dozens of failures for the same account and the same address within an hour: lock it down, block the source and check the event's `Status` field (`0xC000006A` bad password, `0xC0000064` nonexistent account, `0xC0000072` disabled account). For a phishing email received just before, [read its headers](/en/blog/read-email-headers-received-spf-dkim-dmarc/). All the useful commands are in the [Windows events cheatsheet](/cheatsheets/evenements-windows/).

## Sources

- [Microsoft Learn: Appendix L, events to monitor](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/appendix-l--events-to-monitor)
- [Microsoft Learn: event 4624](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624)
- [Microsoft Learn: event 4625](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4625)
- [Microsoft Learn: event 4672](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4672)
- [Microsoft Learn: event 4740](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4740)
- [Microsoft Learn: event 4768](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4768)
- [Microsoft Learn: event 4771](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4771)
- [Microsoft Learn: event 4697](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4697)
- [Microsoft Learn: event 1102](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-1102)
- [Microsoft Learn: event 41 (Kernel-Power)](https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/event-id-41-restart)
- [Microsoft Support: event 6008](https://support.microsoft.com/en-US/servicing/servers/hotfix/2018/04/event-id-6008-is-unexpectedly-logged-to-the-system-event-log-after-you-shut-down-and-restart-your-co)
- [Microsoft Learn: advanced security audit policy settings](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/advanced-security-audit-policy-settings)
- [Microsoft Learn: auditpol set](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/auditpol-set)
- [Microsoft Learn: Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent?view=powershell-7.5)
