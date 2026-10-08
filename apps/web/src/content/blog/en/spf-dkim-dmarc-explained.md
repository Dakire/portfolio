---
title: 'SPF, DKIM and DMARC: a Configuration Guide'
description: 'What each DNS record does, ready-to-adapt examples, common pitfalls and a step-by-step rollout plan up to a DMARC reject policy.'
date: 2026-10-03
translationOf: 'spf-dkim-dmarc-expliques'
category: messagerie
tags: ['SPF', 'DKIM', 'DMARC', 'DNS']
---

Email is very easy to forge: the "From" field is, by design, just a claim. **SPF, DKIM and DMARC** are three complementary mechanisms, published in your domain's DNS, that let receiving servers check that a message really comes from you. Without them, your emails end up in spam and anyone can spoof your domain.

## One sentence each

- **SPF**: the list of servers allowed to send mail for your domain.
- **DKIM**: a cryptographic signature added to every message, verifiable with a public key published in DNS.
- **DMARC**: the rule that says what to do when SPF and DKIM fail, and that asks receivers to send you reports.

## SPF: who is allowed to send?

SPF is a **TXT** record at the root of the domain:

```
example.com.  TXT  "v=spf1 include:_spf.google.com include:spf.protection.outlook.com -all"
```

- `include:` authorizes a provider's servers (here Google Workspace and Microsoft 365).
- `ip4:` / `ip6:` authorizes a specific address or range (an application server, an internal relay).
- `-all`: everything else is rejected. `~all`: everything else is suspicious (softfail). The first is stricter; the second is more forgiving during a testing phase.

Three rules to remember:

1. **One SPF record per domain.** Two `v=spf1` records make SPF invalid (a "permerror"). They must be merged.
2. **At most 10 DNS lookups** (`include`, `a`, `mx`, `redirect`, `exists`, `ptr`). Beyond that, SPF fails with a "permerror". `ip4:` and `ip6:` do not count. Stacking services (newsletter, CRM, ticketing, Microsoft, Google) quickly blows through the limit.
3. SPF checks the domain of the **envelope address** (Return-Path), not the one shown in "From". It also breaks on automatic forwarding, because the forwarding server is not in your list. That is why DKIM is essential.

## DKIM: a signed message

When sending, the server signs some headers and the message body with a **private key**. The receiver fetches the **public key** from DNS, at `<selector>._domainkey.<domain>`, and verifies the signature.

```
google._domainkey.example.com.  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkqh..."
```

Practical points:

- The **selector** lets you run several keys in parallel (one per sending service, or to rotate keys).
- Use **2048-bit** keys when the provider allows it.
- In **Google Workspace**, the key is generated in the Admin console (Apps > Google Workspace > Gmail > Authenticate email), then published as a TXT record. In **Microsoft 365**, you publish two **CNAME** records (`selector1._domainkey` and `selector2._domainkey`) pointing to Microsoft, then enable signing in the Defender portal.
- Some DNS interfaces limit a TXT string to 255 characters: a 2048-bit key must then be split into several consecutive strings (most DNS hosts do this automatically).

## DMARC: policy and reports

DMARC is a TXT record at `_dmarc.<domain>`:

```
_dmarc.example.com.  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@example.com; adkim=r; aspf=r"
```

It introduces the notion of **alignment**: for DMARC to pass, SPF _or_ DKIM must succeed **and** the authenticated domain must match the domain in the "From" header that the user sees. This is what stops an attacker from passing SPF with their own domain while displaying yours.

The essential tags:

| Tag              | Purpose                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `p=none`         | Monitoring only: nothing is blocked, but you receive reports                                            |
| `p=quarantine`   | Failing messages go to spam                                                                             |
| `p=reject`       | Failing messages are rejected                                                                           |
| `rua=`           | Address that receives aggregate reports (XML, daily)                                                    |
| `adkim` / `aspf` | Alignment mode: `r` (relaxed, allows subdomains) or `s` (strict)                                        |
| `sp=`            | Policy applied to existing subdomains                                                                   |
| `np=`            | Policy applied to subdomains that do not exist in DNS (against spoofing of invented subdomains)         |
| `t=y`            | Test mode: receivers apply a milder policy (`reject` becomes `quarantine`, `quarantine` becomes `none`) |
| `pct=`           | Former percentage of messages subject to the policy, removed from the current standard (see below)      |

> **Standard update.** DMARC was revised in May 2026: [RFC 9989](https://www.rfc-editor.org/rfc/rfc9989.html) replaces the 2015 RFC 7489. It removes `pct` and introduces `np` and `t`. Many receiving servers still understand `pct`, but you should no longer rely on it for a gradual rollout.

## Gradual rollout plan

Jumping straight to `p=reject` is the best way to block your own legitimate mail (a forgotten sending tool, a printer, a business application). The safe approach:

1. **Inventory** every service that sends mail with your domain: mailbox provider, newsletter, invoicing, CRM, scanners, applications.
2. Publish SPF and DKIM for each of them.
3. Publish DMARC with **`p=none`** and an `rua` address, and let it run for 2 to 4 weeks. Read the reports (a DMARC analysis tool makes the XML readable).
4. Fix the legitimate senders that fail.
5. Move to **`p=quarantine`**, with `t=y` during the validation phase (or, on older deployments, `pct=10`, then 50, then 100). Watch the reports for a few weeks.
6. Move to **`p=reject`** once the reports are clean, removing `t=y`.

## Why this is now mandatory

Since 1 February 2024, Google (Gmail) and Yahoo require SPF, DKIM and DMARC from senders of more than 5,000 messages per day, with at least `p=none`. Microsoft has applied equivalent rules to Outlook.com since 5 May 2025: non-compliant messages are rejected with error `550 5.7.515`. These thresholds target high volumes, but SPF, DKIM and DMARC remain the foundation of good deliverability even for a small organization.

## Common mistakes

- Two SPF records published by two different people.
- Exceeding the 10-lookup limit after adding a new service.
- DKIM enabled on the provider side but the record never published (or published with a copy-paste error).
- DMARC set to `p=reject` before the sender inventory is done.
- An `rua` address hosted on another domain without the required authorization record: the reports are never sent.

## Check what is published

From a terminal:

```
dig +short TXT example.com
dig +short TXT _dmarc.example.com
dig +short TXT google._domainkey.example.com
```

On Windows: `Resolve-DnsName -Type TXT example.com`. To validate a real message, open its full headers and look for the `Authentication-Results` line, which shows `spf=pass`, `dkim=pass` and `dmarc=pass`. The full method is described in the article [troubleshooting email deliverability](/en/blog/email-deliverability-troubleshooting-spam-bounces/).

## Sources

- [RFC 7208: Sender Policy Framework (SPF)](https://www.rfc-editor.org/rfc/rfc7208) (10-lookup limit)
- [RFC 6376: DomainKeys Identified Mail (DKIM)](https://www.rfc-editor.org/rfc/rfc6376)
- [RFC 9989: DMARC](https://www.rfc-editor.org/rfc/rfc9989.html) (May 2026, replaces RFC 7489)
- [Google: email sender guidelines](https://support.google.com/a/answer/81126)
- [Microsoft: Outlook.com requirements for high-volume senders](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730)
