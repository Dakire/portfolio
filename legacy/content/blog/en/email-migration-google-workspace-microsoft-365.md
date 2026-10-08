---
title: Migrating to Microsoft 365 or Google Workspace: a Checklist
description: Inventory, migration method, TTL, MX cutover and checks: the steps that prevent lost emails when you change mail providers.
date: 2026-10-03
translationOf: migration-messagerie-google-workspace-microsoft-365
---

An email migration is a low-tolerance project: if mail stops arriving for half a day, everyone notices. The technology is rarely the problem. What derails a project is almost always **what was not inventoried**: a shared mailbox, an application that sends mail, a forgotten alias. Here is a checklist that works for both Google Workspace and Microsoft 365.

## 1. Inventory before touching anything

- **User mailboxes**, with their size (it determines how long the copy takes).
- **Aliases** and secondary addresses.
- **Shared / resource mailboxes** (rooms, equipment) and **distribution lists / groups**.
- **Delegations** and permissions between mailboxes.
- **Calendars and contacts**: not every method migrates them.
- **Local archives** (PST files or equivalent) that exist only on one computer.
- **Forwarding rules** and automatic sorting rules.
- Everything that **sends mail** with your domain: scanners, printers, ERP, CRM, monitoring tools, websites. These devices often use an SMTP relay on the old server, which will disappear with it.

## 2. Choose the migration method

| Method | How it works | Suited for |
|---|---|---|
| IMAP migration | Copies mailbox contents over IMAP | Non-Exchange source. Generally does not transfer calendars or contacts |
| Cutover migration | Everything is copied, then you switch at once | Exchange source, small organizations. Microsoft limits it to 2,000 mailboxes and advises staying under 150 |
| Staged / hybrid migration | Mailboxes migrate in batches, with coexistence | Larger organizations, or a migration spread over several weeks |
| Vendor tools | Google's data migration service, Microsoft 365 admin center migration wizards | Depends on source and target: check the current documentation |

The right method depends on the source (Exchange, IMAP, other) and the size. In every case, **run a pilot first** on 2 or 3 accounts.

## 3. Prepare DNS, 48 hours ahead

DNS is the heart of the cutover. The **MX** record tells senders where to deliver your domain's mail: changing it is the switch.

- **Lower the TTL** of the MX records (for example to 300 seconds) at least 48 hours ahead, depending on the old TTL. On the day, the cutover will then take effect within minutes and a rollback will be possible.
- **Verify domain ownership** with the new provider (verification TXT record).
- Prepare the target records: MX, SPF, DKIM, DMARC. For the theory, see [SPF, DKIM and DMARC explained](/en/blog/spf-dkim-dmarc-explained/).
- Record the current state of **the whole zone** (export or screenshot) so you can roll back.

## 4. Copy the data before the cutover

Most of the volume is copied **before** the MX change, in the background, with no downtime. On the day, only an incremental sync of the latest messages remains. Allow some margin: on large mailboxes, the copy can take several days.

## 5. Cutover day

1. Pick a low-traffic slot (end of day or weekend).
2. Run a final sync.
3. **Change the MX records** to the new provider and delete the old ones (don't leave two competing servers at the same priority).
4. Update **SPF**: add the new provider and remove the old one once the cutover is validated.
5. Enable **DKIM** with the new provider.
6. Send and receive test messages, with internal addresses, Gmail, Outlook.com and a third-party domain.
7. Run a **last sync** to pick up the mail that arrived during propagation (mail delivered to the old server because some DNS caches take time to expire).

## 6. After the cutover

- **Reconfigure the clients**: Outlook profile, mail apps, smartphones. This is often what generates the most tickets: prepare documentation and an on-site presence.
- **Reconfigure the devices and applications** that send mail (printers, scanners, business applications) with the new SMTP settings.
- **Check forwarding rules, delegations and shared calendars.**
- Watch the **DMARC** reports over the following weeks: a forgotten sender will show up immediately.
- **Wait before cleaning up**: Microsoft recommends waiting up to 72 hours after the MX change before deleting the migration batch, so that all senders have picked up the new destination.
- **Keep the old server** read-only while you validate (at least a few weeks) before decommissioning it.

## Classic pitfalls

- **TTL not lowered**: the cutover takes hours to propagate, with mail split between two servers.
- **Forgotten application**: an ERP that sent its invoices through the old relay silently stops sending.
- **Shared or resource mailboxes** badly migrated, delegations lost. On Microsoft 365, a shared mailbox over 50 GB requires a license.
- **Calendars and contacts not migrated** because IMAP was chosen.
- **No rollback plan**: with a short TTL and the original DNS zone saved, going back takes a single change.
- **Insufficient communication**: tell users what changes, when, and who to contact.

## In summary

A successful migration relies mostly on preparation: complete inventory, pilot, lowered TTL, prepared DNS and a rollback plan. The cutover itself only takes a few minutes.

## Sources

- [Microsoft: cutover migration to Exchange Online](https://learn.microsoft.com/en-us/exchange/mailbox-migration/cutover-migration-to-office-365) (limits, TTL, 72-hour delay)
- [Microsoft: add DNS records to connect your domain](https://learn.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/create-dns-records-at-any-dns-hosting-provider)
- [Google: data migration service](https://support.google.com/a/answer/6351475)
