---
title: 'Exchange Online: The End of Password-Based SMTP AUTH, and Your Scanners, Printers and Apps'
description: 'Microsoft will turn off password-based authenticated SMTP submission by default in Exchange Online at the end of December 2026. How to find what depends on it and migrate it.'
date: 2026-10-28
translationOf: 'exchange-online-smtp-auth-basic-fin-2026'
category: messagerie
tags: ['Exchange Online', 'Microsoft 365', 'SMTP', 'OAuth']
---

In many small organizations, email does not only leave from users' mailboxes. The scanner sends scans, the printer its alerts, the business software its invoices, an old script its backup reports. Often, all of this goes through **one Microsoft 365 account and its password**, via the `smtp.office365.com` server. That is exactly what Microsoft is about to close by default.

## What changes, and when

Message Center post **MC786329** (updated 27 January 2026) and the Exchange team blog describe the current timeline for **Basic** authentication (username and password) on client SMTP submission, also called **SMTP AUTH**:

- until **December 2026**, nothing changes;
- at the **end of December 2026**, Basic authentication for SMTP AUTH will be **disabled by default** for existing tenants, but an administrator will be able to re-enable it;
- tenants created **after December 2026** will not have it at all by default;
- the **final removal date** will be announced in the second half of 2027;
- the earlier dates (March-April 2026) are on hold.

Two clarifications. What goes away is the **password**: SMTP AUTH with **OAuth 2.0** remains supported. And this timeline has already moved several times: reread [the Exchange team post](https://techcommunity.microsoft.com/blog/exchange/updated-exchange-online-smtp-auth-basic-authentication-deprecation-timeline/4489835) before acting. Microsoft does not give the exact day of the end-of-December switch, so confirm it on that post.

Either way, do not count on another postponement: Microsoft's documentation on sending from devices already recommends against using Basic for this purpose.

## Step 1: find what sends email

The best starting point is the **SMTP AUTH Clients Submission** report in the Exchange admin center (in the mail flow reports; the exact location may change, so search for its name). According to MC786329, it shows, in an "authentication protocol" column, whether each client sends with Basic or OAuth. That is the list of what will break.

Complete it with an inventory on the configuration side. These commands come from Microsoft's [SMTP AUTH documentation on Microsoft Learn](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission), after connecting to Exchange Online PowerShell:

```powershell
Get-TransportConfig | Format-List SmtpClientAuthenticationDisabled

$Users = Get-CASMailbox -ResultSize unlimited
$Users | where {$_.SmtpClientAuthenticationDisabled -eq $false}
```

The first shows the organization setting (`True`: SMTP AUTH disabled). The second lists the mailboxes where SMTP AUTH is **explicitly enabled**. Note that this shows who is allowed, not who actually sends. A mailbox that follows the organization setting does not appear in this list. The report therefore remains the reference.

Also ask people: "which device or software sends email by itself?" A mailbox like `scan@` or `noreply@` is a good clue.

## Step 2: pick the right destination for each use

According to Microsoft's page [How to set up a multifunction device or application to send email](https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365), the options are as follows.

**SMTP AUTH with OAuth 2.0.** If the application or device supports it, this is the simplest change. Many older scanners cannot do it. TLS 1.2 minimum is also required, preferably on port 587: port 465 is not supported.

**High Volume Email (HVE).** For sending to **internal recipients only** (alerts, notifications, scans sent to a colleague). You create an HVE account with no mailbox and no license, and the device connects to `smtp.hve.mx.microsoft` on port 587, with TLS. The account authenticates with OAuth or a password, and does not depend on the organization's SMTP AUTH setting. The service is billed by usage (Microsoft 365 pay-as-you-go, with a billing policy tied to an Azure subscription): without that policy, the account cannot send. Limits: 50 recipients per message, 10 MB.

**SMTP relay through a connector.** For devices that must write to external recipients or do not support modern authentication. An inbound connector, authenticated by a TLS certificate (recommended) or a fixed, unshared public IP address, lets you send on port 25 to your domain's MX endpoint, using any address in the domain, with no mailbox or license. You need a correct SPF record (see [SPF, DKIM and DMARC explained](/en/blog/spf-dkim-dmarc-explained/)), and it cannot be used from a service hosted by a third party.

**An internal mail server**, if you have one, as a relay.

**Azure Communication Services Email**, which Microsoft cites for sending to both internal and external recipients.

**Microsoft Graph**, for a script or software you control: the [sendMail API](https://learn.microsoft.com/en-us/graph/api/user-sendmail) avoids SMTP altogether.

**Direct Send** also exists, but it only reaches the Microsoft 365 mailboxes of your own organization, without authentication. Microsoft reserves it for advanced cases and is working on an option to disable it by default: use it only as a last resort.

## A quick sort by type of use

- **Scanner or printer that sends to your colleagues**: HVE, or a connector relay if the device has a fixed IP.
- **Device that must write to customers**: connector relay, or another service.
- **ERP or business software**: OAuth if the vendor offers it (ask them); otherwise relay or HVE. Plan for a software update.
- **In-house script**: Graph, or SMTP with OAuth.

## Step 3: test, then monitor

1. Migrate one device first, check that the message arrives and does not land in spam.
2. Check that the displayed sender remains valid (sending "as" another address requires the _Send As_ permission). See [deliverability: diagnosing emails that land in spam](/en/blog/email-deliverability-troubleshooting-spam-bounces/).
3. Return to the report after a few days: no client should remain on Basic.
4. Do not re-enable SMTP AUTH for the whole organization "to be safe": limit it to the mailboxes that need it. See also [securing Microsoft 365 and Google Workspace](/en/blog/secure-microsoft-365-google-workspace-baseline-settings/) and the [Microsoft 365 PowerShell cheatsheet](/cheatsheets/powershell-m365/).

Same month, same vendor, another topic: [the October 2026 Patch Tuesday](/en/blog/patch-tuesday-october-2026-small-business/).

## Sources

- [Exchange team blog: SMTP AUTH Basic deprecation timeline](https://techcommunity.microsoft.com/blog/exchange/updated-exchange-online-smtp-auth-basic-authentication-deprecation-timeline/4489835)
- [MC786329: copy of the Message Center post](https://mc.merill.net/message/MC786329)
- [Microsoft Learn: enable or disable SMTP AUTH in Exchange Online](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission)
- [Microsoft Learn: set up a device or application to send email](https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365)
- [Microsoft Learn: High Volume Email for Microsoft 365](https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/high-volume-mails-m365)
- [Microsoft Learn: authenticate an IMAP, POP or SMTP connection using OAuth](https://learn.microsoft.com/en-us/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth)
- [Microsoft Learn: Graph, send mail (sendMail)](https://learn.microsoft.com/en-us/graph/api/user-sendmail)
