---
title: 'Troubleshooting DNS with dig and nslookup'
description: 'Query the right server, understand DNS "propagation" and TTL, and spot the most common zone mistakes (apex CNAME, MX, TXT, delegation).'
date: 2026-10-03
translationOf: 'diagnostic-dns-dig-nslookup-propagation-ttl'
category: dns
tags: ['DNS', 'dig', 'nslookup', 'TTL']
---

A large share of "mysterious" outages (unreachable website, mail no longer arriving, certificate that won't validate) come from DNS. The good news: with three or four commands and a good understanding of caching, you can diagnose them quickly.

## The tools

| Tool              | Platform                                          | Example                                 |
| ----------------- | ------------------------------------------------- | --------------------------------------- |
| `dig`             | Linux, macOS (and Windows through the BIND tools) | `dig example.com A`                     |
| `nslookup`        | Windows, Linux, macOS                             | `nslookup -type=MX example.com`         |
| `Resolve-DnsName` | PowerShell                                        | `Resolve-DnsName example.com -Type TXT` |

`dig` is the most precise. `dig +short` prints only the answer, while plain `dig` also shows the **TTL**, the server queried and the response status.

## Record types to know

- **A / AAAA**: IPv4 / IPv6 address.
- **CNAME**: alias to another name.
- **MX**: mail servers, with a priority (the lowest number wins).
- **TXT**: free text, used by SPF, DKIM, DMARC and domain ownership checks.
- **NS**: authoritative name servers for the zone.
- **PTR**: reverse resolution (IP to name), important for sending mail.

## Query the right server

The answer depends on **who you ask**. Your computer queries a resolver (your router's, your company's, or a public one), which caches answers. To know what is really published, query an **authoritative** server directly:

```
dig NS example.com +short                  # which servers are authoritative?
dig @ns1.example-host.net example.com A    # what they really publish
dig @8.8.8.8 example.com A                 # what a public resolver sees
dig +trace example.com                     # follows the delegation chain from the root
```

If the authoritative server's answer is correct and your resolver's is not, the problem is a **cache**, not the zone.

## "Propagation" and TTL

People often talk about "DNS propagation", but nothing really propagates: a change is published immediately on the authoritative servers, and resolver **caches** keep the old value until its **TTL** (time to live, in seconds) expires.

- A TTL of 3600 means a resolver may keep the old answer for up to an hour.
- For a planned change (MX, web server), **lower the TTL in advance** (at least the length of the old TTL before the change), then set it back to a normal value afterwards.
- On your Windows computer, clear the local cache with `ipconfig /flushdns`; on macOS and Linux, the command depends on the resolution service in use. This does not purge your provider's resolver cache.
- If the name did not exist before the record was created, the negative answer is also cached (according to the negative TTL defined in the SOA).

## Common configuration mistakes

- **CNAME at the zone apex** (`example.com`). A CNAME cannot coexist with other records on the same name, and the apex carries at least NS and SOA, and often MX and TXT. Some hosts offer an equivalent called ALIAS or ANAME.
- **MX pointing to a CNAME** or directly to an IP address: an MX must point to a name that has an A/AAAA record.
- **Two SPF records** among the TXT records, or an SPF that exceeds 10 lookups: SPF becomes invalid.
- **Missing or extra trailing dot** in an interface that expects a fully qualified name: `mail.example.com` may be interpreted as `mail.example.com.example.com`.
- **Badly formatted TXT**: quotes, truncated value, stray characters copied from a document. A value longer than 255 characters must be split into several strings.
- **Inconsistent delegation**: the name servers declared at the registrar are not the ones hosting the zone you are editing. You are then editing a zone nobody queries.
- **DNSSEC**: an outdated DS record at the registrar after a change of DNS host makes the domain invalid for resolvers that validate DNSSEC. The symptom: it stops resolving for some users only.

## A five-command method

```
dig NS example.com +short             # 1. who is authoritative?
dig @<ns> example.com A +noall +answer  # 2. what do they publish?
dig @8.8.8.8 example.com A            # 3. what does a public resolver see?
dig MX example.com +short             # 4. email: where does the mail go?
dig TXT example.com +short            # 5. SPF and verifications
```

Comparing these answers is enough to locate the problem: a badly edited zone, an inconsistent delegation, or simply a cache waiting to expire.

For the email side (SPF, DKIM, DMARC), see [SPF, DKIM and DMARC explained](/en/blog/spf-dkim-dmarc-explained/) and [troubleshooting email deliverability](/en/blog/email-deliverability-troubleshooting-spam-bounces/).

## Sources

- [RFC 1034: Domain names, concepts and facilities](https://www.rfc-editor.org/rfc/rfc1034) (a CNAME cannot coexist with other records)
- [RFC 2181: Clarifications to the DNS specification](https://www.rfc-editor.org/rfc/rfc2181) (an MX must not point to an alias)
- [RFC 2308: Negative caching of DNS queries](https://www.rfc-editor.org/rfc/rfc2308)
- [RFC 7208: SPF](https://www.rfc-editor.org/rfc/rfc7208) (10-lookup limit)
