---
title: 'DNS records explained: A, MX, CNAME, TXT and the others'
description: 'The role of each DNS record (A, AAAA, CNAME, MX, TXT, NS, SOA, CAA, PTR, SRV), with examples, classic pitfalls, email (SPF, DKIM, DMARC) and basic dig and nslookup commands.'
date: 2026-10-28
translationOf: 'enregistrements-dns-a-mx-cname-txt-expliques'
category: dns
tags: ['DNS', 'MX', 'CNAME', 'TXT', 'dig', 'nslookup']
---

DNS is the Internet's phone book: it turns a name (`www.example.com`) into useful information (an IP address, a mail server, a proof of ownership). Each piece of information is a **record** of a given type. Here are the ones you really meet, what they do, and the mistakes that cost hours.

## The records, one by one

| Type  | Role                                                 | Example                                              |
| ----- | ---------------------------------------------------- | ---------------------------------------------------- |
| A     | name to IPv4 address                                 | `www  IN A 192.0.2.10`                               |
| AAAA  | name to IPv6 address (RFC 3596)                      | `www  IN AAAA 2001:db8::10`                          |
| CNAME | alias: this name is another name                     | `blog IN CNAME www.example.com.`                     |
| MX    | mail servers, with priority                          | `@    IN MX 10 mail.example.com.`                    |
| TXT   | free text (SPF, DKIM, DMARC, ownership checks)       | `@    IN TXT "v=spf1 include:_spf.example.net -all"` |
| NS    | authoritative name servers for the zone              | `@    IN NS ns1.example-host.net.`                   |
| SOA   | the zone's "identity card"                           | one per zone, managed by the DNS host                |
| CAA   | authorities allowed to issue certificates (RFC 8659) | `@    IN CAA 0 issue "letsencrypt.org"`              |
| PTR   | reverse lookup: address to name                      | `25.2.0.192.in-addr.arpa. IN PTR mail.example.com.`  |
| SRV   | locates a service: priority, weight, port, server    | `_imaps._tcp IN SRV 0 1 993 mail.example.com.`       |

The addresses above (`192.0.2.x`, `2001:db8::`) are documentation examples. A few useful details:

- **MX**: the lower the value, the higher the priority (RFC 1035). With no MX at all, a sending server falls back to the domain's address record (A or AAAA), per RFC 5321: rarely what you want.
- **SOA**: holds the primary server, a contact address, a serial number and refresh timers. Its last field is in practice used as the caching time for "does not exist" answers (RFC 2308).
- **PTR**: the address is written backwards, under `in-addr.arpa` for IPv4 (RFC 1035) and under `ip6.arpa`, one hexadecimal digit at a time, for IPv6 (RFC 3596). The PTR is managed by whoever owns the IP address, so usually your ISP or hosting provider, not your zone.
- **SRV**: the name takes the form `_service._protocol.domain` (RFC 2782); the target must have an address record and cannot be an alias.
- **CAA**: see [TLS certificate lifetimes](/en/blog/tls-certificate-lifetimes-200-100-47-days/) for the context.

## Classic pitfalls

- **CNAME at the apex** (`example.com`). A CNAME cannot coexist with any other record on the same name (RFC 2181), and the apex carries at least NS and SOA, often MX and TXT. Some hosts offer an equivalent called ALIAS or ANAME.
- **MX pointing to a CNAME**. The target of an MX or NS must not be an alias (RFC 2181): it must have an A or AAAA record.
- **TTL too long before a change**. Resolvers keep the answer until the TTL expires. Lower it in advance, then restore it afterwards.
- **"Propagation"**: nothing propagates, caches expire. See [troubleshooting with dig and nslookup](/en/blog/dns-troubleshooting-dig-nslookup-propagation-ttl/) and the [DNS propagation](/en/tools/dns-propagation/) tool.
- **Forgotten trailing dot**: in a zone file, `mail.example.com` without a trailing dot becomes `mail.example.com.example.com.`. Some interfaces append the domain on their own, others do not.
- **Several SPF records**: only one SPF TXT record per name; two make SPF invalid.
- **Truncated TXT value**: a TXT string is limited to 255 characters, so it must be split into several strings within the same record.

## Email: MX, SPF, DKIM, DMARC

For a domain to receive and send mail properly, four elements work together:

1. **MX**: where to deliver mail addressed to the domain.
2. **SPF** (RFC 7208), a TXT at the apex: which servers may send for this domain.
3. **DKIM** (RFC 6376), a TXT under `selector._domainkey.domain`: the public key used to verify message signatures.
4. **DMARC** (RFC 7489), a TXT under `_dmarc.domain`: the policy to apply when SPF and DKIM fail, and where to send reports, for example `v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com`.

The details are in [SPF, DKIM and DMARC explained](/en/blog/spf-dkim-dmarc-explained/). To understand why a message was filed as spam or rejected, see [email deliverability troubleshooting](/en/blog/email-deliverability-troubleshooting-spam-bounces/) and [reading email headers](/en/blog/read-email-headers-received-spf-dkim-dmarc/). When changing provider, the [email migration guide](/en/blog/email-migration-google-workspace-microsoft-365/) covers the records to switch. A PTR consistent with the sending server's name is also a common check by receiving servers.

## dig and nslookup: the basic commands

```
dig example.com A +short              # IPv4 address
dig example.com MX +short             # mail servers
dig example.com TXT +short            # SPF and verifications
dig _dmarc.example.com TXT +short     # DMARC policy
dig -x 192.0.2.25 +short              # PTR (reverse lookup)
dig @8.8.8.8 example.com NS           # query a specific resolver
```

```
nslookup -type=MX example.com
nslookup -type=TXT example.com 8.8.8.8
nslookup 192.0.2.25
```

On Windows, `nslookup` is built in; `Resolve-DnsName example.com -Type MX` does the same in PowerShell. The site's [DNS tool](/en/tools/dns/) gathers these checks (A, AAAA, MX, SPF, DKIM, DMARC, CAA…) in a single report. To remember the common commands, the [networking cheat sheet](/cheatsheets/reseau/) is a handy reminder.

## Sources

- [RFC 1035: domain names, implementation and specification](https://www.rfc-editor.org/rfc/rfc1035) (SOA, MX, PTR)
- [RFC 2181: clarifications to the DNS specification](https://www.rfc-editor.org/rfc/rfc2181) (CNAME alone on its name, MX and NS not aliases, TTL)
- [RFC 2308: negative caching of DNS queries](https://www.rfc-editor.org/rfc/rfc2308)
- [RFC 2782: SRV records](https://www.rfc-editor.org/rfc/rfc2782)
- [RFC 3596: DNS extensions for IPv6 (AAAA, ip6.arpa)](https://www.rfc-editor.org/rfc/rfc3596)
- [RFC 5321: SMTP](https://www.rfc-editor.org/rfc/rfc5321) (section 5.1, implicit MX)
- [RFC 7208: SPF](https://www.rfc-editor.org/rfc/rfc7208)
- [RFC 6376: DKIM](https://www.rfc-editor.org/rfc/rfc6376)
- [RFC 7489: DMARC](https://www.rfc-editor.org/rfc/rfc7489)
- [RFC 8659: CAA](https://www.rfc-editor.org/rfc/rfc8659)
