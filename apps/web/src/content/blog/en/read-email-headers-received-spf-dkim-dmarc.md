---
title: 'Reading Email Headers: Received, SPF, DKIM, DMARC'
description: 'Where to find headers in Outlook, Gmail and Thunderbird, how to read Received, Authentication-Results and DKIM-Signature, and what to conclude from spam, spoofing or a delay.'
date: 2026-10-28
translationOf: 'lire-en-tetes-email-received-spf-dkim-dmarc'
category: messagerie
tags: ['Headers', 'SPF', 'DKIM', 'DMARC', 'Deliverability']
---

A suspicious message, an email that arrived three hours late, an invoice "from the director" that nobody asked for: in every case the answer is in the **headers**, the part of the message that mail clients hide by default. This article shows where to get them, how to read them in the right order and what to conclude.

## Where to find the headers

- **Gmail**: open the message, select the "More" icon next to "Reply", then "Show original". A button copies everything.
- **Outlook (new version and Outlook on the web)**: "More actions" at the top of the message, then "View", then "View message details".
- **Classic Outlook (Windows)**: open the message in its own window, "File", "Properties"; the headers are in the "Internet headers" box.
- **Thunderbird**: `Ctrl+U` ("View Message Source") shows the raw message, headers included.

Exact labels vary with the language and version of the client. Then copy all the headers: the site's [email header analyzer](/en/tools/email-headers/) decodes them (path, delays, SPF, DKIM, DMARC, alignment), which is handy to check your manual reading.

## Read the `Received` lines from bottom to top

Each server that handles the message adds a `Received` line at the **start** of the message (RFC 5321). The oldest line is therefore at the very bottom and the most recent at the very top. You read the path from bottom to top:

```
Return-Path: <bounce@mail.example.org>
Received: from mx.example.net (mx.example.net [192.0.2.25])
        by mailbox.example.com with ESMTPS id a1b2c3
        for <alice@example.com>; Tue, 27 Oct 2026 09:14:07 +0100
Received: from out.example.org (out.example.org [198.51.100.10])
        by mx.example.net with ESMTPS id d4e5f6
        for <alice@example.com>; Tue, 27 Oct 2026 09:14:05 +0100
```

In a line, `from` gives the name announced by the sender (EHLO) and the IP address seen by the receiver, `by` the server that received the message, `with` the protocol, and the date is the time of reception. The path above goes from `out.example.org` to `mx.example.net`, then to your mailbox, in two seconds.

One important caveat: these fields are purely informational (RFC 5322). A malicious sender can write fake `Received` lines at the bottom of the stack. Only the lines added by **your own** servers, at the top, deserve trust.

## Authentication-Results: the verdict

This header is added by the server that checked the message on arrival (RFC 8601):

```
Authentication-Results: mailbox.example.com;
       spf=pass smtp.mailfrom=bounce@mail.example.org;
       dkim=pass header.d=example.org header.s=sel1;
       dmarc=pass header.from=example.org
```

- **SPF**: `pass`, `fail`, `softfail` (the domain considers the sending unauthorized without stating it firmly: look closer, don't reject outright), `neutral`, `none`, `temperror` (transient DNS error), `permerror` (unreadable record).
- **DKIM**: `pass`, `fail`, `none` (no signature), `policy`, `neutral`, `temperror`, `permerror`.
- **DMARC**: `pass` (at least one validated SPF or DKIM identifier is **aligned** with the `From` domain), `fail` (a policy exists but nothing is aligned), `none` (no DMARC policy published), `temperror`, `permerror`.

The properties tell you what was checked: `smtp.mailfrom` (the envelope address tested by SPF), `header.d` and `header.s` (domain and selector of the DKIM signature), `header.from` (the domain of the visible `From`).

Another point from RFC 8601: only trust the header carrying the name of **your own** receiving server (the identifier at the start of the line). A sender can insert a fake one, and a `pass` is never proof of good faith: spam can pass DKIM if its sender signed it.

## The other useful fields

- **`Return-Path`**: added at final delivery, it repeats the envelope address (`MAIL FROM`) to which bounces are sent. This is the address SPF checks.
- **`From`**: the **displayed** address. The envelope and the `From` can legitimately differ (sending through a provider), but it is the first thing to check when in doubt.
- **`Message-ID`**: an identifier that is supposed to be globally unique, with a domain name to the right of the `@`. A domain that doesn't fit the sender is one more clue, not proof.
- **`DKIM-Signature`**: `d=` is the signing domain, `s=` the selector. The public key lives in DNS, as a TXT record at `s._domainkey.d`: with `d=example.org` and `s=sel1`, you query `sel1._domainkey.example.org` (see [DNS records explained](/en/blog/dns-records-explained-a-mx-cname-txt/) and [DNS diagnostics with dig](/en/blog/dns-troubleshooting-dig-nslookup-propagation-ttl/)).
- **`ARC-Seal`, `ARC-Message-Signature`, `ARC-Authentication-Results`**: set by an intermediary (mailing list, forwarding) that modifies the message and sometimes breaks SPF or DKIM. ARC keeps a record of the original results; `cv=pass` means the chain is valid. These fields help explain a `fail` inherited from forwarding.

## Three typical cases

### Case 1: the message lands in spam

```
Authentication-Results: mailbox.example.com;
       spf=softfail smtp.mailfrom=info@example.org;
       dkim=none;
       dmarc=fail header.from=example.org
```

The sending server (for example `198.51.100.77`) is not in the domain's SPF, nothing is signed and nothing is aligned. **Conclusion**: either a third party is impersonating this domain, or a legitimate sender hasn't set up authentication. If it is an expected partner, send them these lines; the full method is in [the deliverability troubleshooting guide](/en/blog/email-deliverability-troubleshooting-spam-bounces/).

### Case 2: spoofing

```
From: "Management" <direction@example.com>
Return-Path: <x7@mail.example.net>
Authentication-Results: mailbox.example.com;
       spf=pass smtp.mailfrom=x7@mail.example.net;
       dkim=pass header.d=example.net;
       dmarc=fail header.from=example.com
```

SPF and DKIM pass, but for `example.net`, a **different** domain from the displayed one. The message is genuine for its real sender, not for `example.com`: DMARC fails for lack of alignment. **Conclusion**: spoofed `From`. Don't reply, report it, and harden the targeted domain with [SPF, DKIM and DMARC](/en/blog/spf-dkim-dmarc-explained/) set to `reject` and [the basic Microsoft 365 and Google Workspace settings](/en/blog/secure-microsoft-365-google-workspace-baseline-settings/). The analyzer also flags a display name that contains another address, or a different `Reply-To`.

### Case 3: the message arrives hours late

Read the `Received` lines from bottom to top and compare the dates of two consecutive lines: the big gap points to the server that held the message. A few minutes between two attempts suggests a queue or a temporary refusal (greylisting, rate limiting); several hours inside your own chain points rather to your filtering gateway. Watch the time zones: the offset (`+0100`) is written in each date, and server clocks are not always perfectly set.

## Sources

- [RFC 8601: Authentication-Results](https://www.rfc-editor.org/rfc/rfc8601.html)
- [RFC 5321: SMTP (trace, Received, Return-Path)](https://www.rfc-editor.org/rfc/rfc5321.html)
- [RFC 5322: message format (From, Message-ID, trace fields)](https://www.rfc-editor.org/rfc/rfc5322.html)
- [RFC 6376: DKIM (DKIM-Signature, d= and s=)](https://www.rfc-editor.org/rfc/rfc6376.html)
- [RFC 7208: SPF (results)](https://www.rfc-editor.org/rfc/rfc7208.html)
- [RFC 9989: DMARC (alignment and results)](https://www.rfc-editor.org/rfc/rfc9989.html)
- [RFC 8617: ARC](https://www.rfc-editor.org/rfc/rfc8617.html)
- [IANA: Email Authentication Result Names](https://www.iana.org/assignments/email-auth/email-auth.xhtml)
- [Google: show the original of a Gmail message](https://support.google.com/mail/answer/29436)
- [Microsoft: view internet message headers in Outlook](https://support.microsoft.com/en-us/office/view-internet-message-headers-in-outlook-cd039382-dc6e-4264-ac74-c048563d212c)
- [Mozilla: Thunderbird keyboard shortcuts](https://support.mozilla.org/en-US/kb/keyboard-shortcuts-thunderbird)
