---
title: 'TLS certificates: 200, then 100, then 47 days of validity'
description: 'Since 15 March 2026, a public TLS certificate lasts 200 days at most, then 100 days in 2027 and 47 days in 2029. The schedule, what it changes and how to prepare.'
date: 2026-10-28
translationOf: 'certificats-tls-duree-de-vie-200-100-47-jours'
category: securite
tags: ['TLS', 'Certificates', 'ACME', "Let's Encrypt", 'CAA', 'DNS']
---

Since 15 March 2026, a public TLS certificate can no longer be issued for more than **200 days**. That is only the first step: the maximum drops to 100 days in 2027, then 47 days in 2029. Renewing a certificate by hand "once a year" is already over; before long it will mean doing it almost every month.

## The schedule

The rule comes from CA/Browser Forum ballot SC-081v3 (the body that brings together certificate authorities and the root program owners Apple, Google, Microsoft and Mozilla). It was adopted in April 2025, then folded into the _Baseline Requirements_ (version 2.2.2, January 2026). The maximum lifetimes apply to certificates **issued** from each date:

| Certificate issued   | Maximum lifetime | Domain validation reuse |
| -------------------- | ---------------- | ----------------------- |
| before 15 March 2026 | 398 days         | 398 days                |
| from 15 March 2026   | 200 days         | 200 days                |
| from 15 March 2027   | 100 days         | 100 days                |
| from 15 March 2029   | 47 days          | 10 days                 |

The last column matters as much as the first. Before issuing, the certificate authority must have validated that you control the domain, and it may only reuse that validation for the period shown. In 2029, a validation older than 10 days will be useless: you will have to revalidate at almost every renewal.

These are maximums that certificate authorities commit to respect: none of them will issue you a longer certificate. The text even recommends not aiming for the exact maximum (199, 99 and 46 days). Another milestone: from 15 March 2028, some email-based validation methods (addresses built as `admin@` or `postmaster@`, or email to the CAA or TXT contact) will no longer be accepted. Validation by changing the DNS remains provided for.

## Automation becomes the rule

At 47 days, renewing by hand is no longer sustainable. The standard protocol is **ACME** (RFC 8555), used by Let's Encrypt and by many commercial authorities. An ACME client (certbot, acme.sh, Caddy, Traefik, your hosting panel's integration…) requests, validates and installs the certificate without anyone lifting a finger.

Let's Encrypt has published its own schedule:

- 13 May 2026: the opt-in `tlsserver` profile moves to 45 days;
- 10 February 2027: the default `classic` profile moves to 64 days, with 10 days of validation reuse;
- 16 February 2028: the `classic` profile moves to 45 days, with 7 hours of reuse.

One thing to watch: a client set to renew every 60 days will no longer be enough. Let's Encrypt recommends using ACME Renewal Information (ARI), which tells the client when to renew, or failing that renewing at two thirds of the certificate's lifetime.

## HTTP or DNS validation

Two common methods:

- **HTTP-01**: the authority fetches a file on port 80 of the site. Simple, but impossible for a wildcard certificate (`*.example.com`), and the server must be reachable from the Internet.
- **DNS-01**: the client publishes a temporary TXT record. It accepts wildcards and works for non-public services, but the client needs to be able to edit your DNS zone, hence an API at your DNS provider. Let's Encrypt advises limiting the rights of those credentials, or delegating the challenge answer with a CNAME to a dedicated zone.

Let's Encrypt is also working on a method called DNS-PERSIST-01, whose TXT record would not change at each renewal. It has been announced but not yet standardized: worth watching, not worth planning around.

## Shared hosting

On a typical shared hosting plan, the certificate is most often issued and renewed by the host: you have nothing to do, and the move to 47 days is their problem. Two cases fall outside that: a certificate bought elsewhere and imported by hand, and a certificate on a domain whose DNS is not managed by the host (DNS validation may then need action on your side). When in doubt, check the control panel or ask the host: the exact behaviour depends on the plan.

## CAA: say who may issue

A **CAA** DNS record (RFC 8659) lists the authorities allowed to issue for your domain:

```
example.com.  IN CAA 0 issue "letsencrypt.org"
example.com.  IN CAA 0 issuewild ";"
example.com.  IN CAA 0 iodef "mailto:security@example.com"
```

Here only Let's Encrypt may issue, wildcards are forbidden, and refused attempts are reported to an address. When you change authority or host, **remember to update the CAA record**, otherwise issuance fails. The site's [DNS tool](/en/tools/dns/) flags missing or restrictive CAA records, and the [propagation checker](/en/tools/dns-propagation/) lets you confirm that a change is visible everywhere.

## Certificates installed by hand

The real risk is not the website, it is everything that does not speak ACME or that has been forgotten: firewalls and VPNs, NAS units, printers and access controllers, Exchange servers, monitoring appliances, hypervisor admin interfaces. For each one:

1. list it (where, which domain, which expiry, who renews it);
2. check whether it supports ACME, or can receive a certificate through an API or a script;
3. failing that, put a reverse proxy in front to hold the certificate, or use a certificate from an internal authority if the service is not public (the rules above only concern public certificates).

## Monitoring expiry dates

Even with automation, a renewal can fail silently (expired DNS token, changed firewall rule, forgotten CAA). Set up an alert on the **expiry date actually served**, for example with a probe that connects to the service and alerts at 14 then 7 days, rather than a date in a calendar. Let's Encrypt also recommends monitoring for certificates that were not renewed on time.

## Sources

- [CA/Browser Forum: ballot SC-081v3](https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/) (25 issuers in favour, none against, 4 root programs in favour)
- [Baseline Requirements 2.2.2 (PDF)](https://cabforum.org/working-groups/server/baseline-requirements/documents/CA-Browser-Forum-TLS-BR-2.2.2.pdf) (sections 4.2.1 and 6.3.2, dates of 15 March 2026, 2027 and 2029)
- [Let's Encrypt: decreasing certificate lifetimes from 90 to 45 days](https://letsencrypt.org/2025/12/02/from-90-to-45)
- [Let's Encrypt: challenge types (HTTP-01, DNS-01)](https://letsencrypt.org/docs/challenge-types/)
- [RFC 8555: ACME](https://www.rfc-editor.org/rfc/rfc8555)
- [RFC 8659: CAA records](https://www.rfc-editor.org/rfc/rfc8659)

See also [troubleshooting DNS with dig and nslookup](/en/blog/dns-troubleshooting-dig-nslookup-propagation-ttl/) and [DNS records explained](/en/blog/dns-records-explained-a-mx-cname-txt/).
