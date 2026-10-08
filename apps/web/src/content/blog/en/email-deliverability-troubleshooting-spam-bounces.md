---
title: 'Emails Going to Spam or Bounced: A Troubleshooting Method'
description: 'Read a bounce message, analyze headers, check SPF/DKIM/DMARC, reputation and reverse DNS: a step-by-step approach to find the cause.'
date: 2026-10-03
translationOf: 'delivrabilite-diagnostiquer-mails-spam-rejetes'
category: messagerie
tags: ['Deliverability', 'SPF', 'DKIM', 'DMARC']
---

"My email isn't arriving": a classic ticket. The causes vary widely (authentication, reputation, content, recipient configuration), but the troubleshooting method is always the same. The goal is to move from intuition to **facts** readable in the bounce message and in the headers.

## Step 1: read the bounce message (NDR)

When a server refuses a message, it sends back a non-delivery report. It contains an **SMTP code** and an **enhanced status code**, along with some text. Don't skim it: it is the best clue you have.

| Code                            | Common meaning                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `4xx`                           | **Temporary** refusal: automatic retry (greylisting, rate limiting)                                        |
| `5xx`                           | **Permanent** refusal                                                                                      |
| `550 5.1.1`                     | Recipient address does not exist (typo, deleted account)                                                   |
| `550 5.7.26` (Gmail)            | The message fails authentication (SPF or DKIM)                                                             |
| `550 5.7.509` (Exchange Online) | The sender domain fails DMARC and publishes a `reject` policy                                              |
| `550 5.7.515` (Outlook.com)     | A high-volume sender (more than 5,000 messages per day) does not meet the SPF, DKIM and DMARC requirements |
| `550 5.7.1` / `554 5.7.1`       | Policy refusal: blocklist, reputation, recipient rule                                                      |
| `552 5.2.2`                     | Recipient mailbox full                                                                                     |

The bounce text often contains a link to the provider's documentation. Follow it.

## Step 2: if the mail arrives but lands in spam, read the headers

Open the received message, display the **full headers** ("Show original" in Gmail, "View message details" in Outlook), and look for this line:

```
Authentication-Results: mx.google.com;
       dkim=pass header.d=example.com;
       spf=pass smtp.mailfrom=example.com;
       dmarc=pass header.from=example.com
```

- `spf=fail` or `softfail`: the sending server is not authorized in SPF.
- `dkim=none`: the message is not signed. `dkim=fail`: invalid signature (message altered in transit, wrong key published).
- `dmarc=fail`: neither passes **with alignment** on the visible domain.

Google offers a header analyzer that also shows the delays between servers (useful to spot a delayed message).

## Step 3: check DNS

Verify that what is published matches what you think is published:

```
dig +short TXT example.com              # SPF
dig +short TXT _dmarc.example.com       # DMARC
dig +short TXT selector._domainkey.example.com   # DKIM
dig +short MX example.com
```

Look for: two SPF records, an SPF beyond 10 DNS lookups, a non-existent DKIM selector, an MX pointing to a CNAME. Details are in [SPF, DKIM and DMARC explained](/en/blog/spf-dkim-dmarc-explained/) and [troubleshooting DNS with dig and nslookup](/en/blog/dns-troubleshooting-dig-nslookup-propagation-ttl/).

## Step 4: examine the IP and its reputation

If the message is correctly authenticated but still refused or classified as spam, look at **reputation**:

- Is the sending IP address on a blocklist? Several online tools query the main lists at once.
- For a server you manage: the IP must have a consistent **reverse DNS (PTR)** that matches the name announced by the server during the SMTP connection (HELO/EHLO).
- For Gmail, **Google Postmaster Tools** shows domain and IP reputation, spam rate and authentication status (only for verified domains sending enough volume).
- For Microsoft, the SNDS program and the delisting portal let you monitor an IP.

On a shared service (Google Workspace, Microsoft 365) you share IPs with other customers: the **domain** and the quality of its authentication matter most.

## Step 5: look at content and behavior

When everything is technically correct, look for:

- A sudden volume increase, or a mass mailing from an address that had not sent in bulk before.
- Shortened links, executable or password-protected attachments, content made only of images.
- A high complaint rate: Google asks to stay below 0.30% spam reports in Postmaster Tools, and advises aiming for under 0.10%. For marketing mail in volume (more than 5,000 messages per day), **one-click unsubscribe** is mandatory.
- A poor-quality recipient list (outdated or purchased addresses).

## Step 6: test end to end

- Send a message to a test address from an analysis service (it gives a score and details authentication and content).
- Send to several mailbox providers (Gmail, Outlook.com, a corporate domain) to see whether the problem is general or specific to one provider.
- After fixing, **test again**: DNS caches can delay the effect of a change by a few hours.

## Quick troubleshooting checklist

1. What is the bounce code? What does the text say?
2. `spf`, `dkim`, `dmarc`: `pass` or not in the headers?
3. Does the published DNS match what you expect?
4. Is the IP or domain listed or has a poor reputation?
5. Does a recent change (new service, migration, new sending application) explain when the problem started?

Point 5 is often the most telling: a deliverability problem that starts on a specific day most often coincides with a change, for example after an [email migration](/en/blog/email-migration-google-workspace-microsoft-365/).

## Sources

- [Google: email sender guidelines](https://support.google.com/a/answer/81126)
- [Microsoft: SMTP errors and non-delivery reports in Exchange Online](https://learn.microsoft.com/en-us/troubleshoot/exchange/email-delivery/ndr/non-delivery-reports-in-exchange-online)
- [Microsoft: Outlook.com requirements for high-volume senders](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730)
- [RFC 3463: Enhanced Mail System Status Codes](https://www.rfc-editor.org/rfc/rfc3463)
