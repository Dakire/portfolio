---
title: 'OpenSSH and Symfony: the Vulnerabilities of the Week of 2 November 2026'
seoTitle: 'OpenSSH 10.6p2 Flaw and Symfony Fixes: What to Do'
description: 'OpenSSH flaw (CVE-2026-123158) on Linux systems without PAM such as Alpine, and Symfony security fixes of 4 November: who is affected and what to update.'
summary: 'Two things to handle this week if you run Linux servers or PHP sites. OpenSSH 10.6p2 fixes a password authentication bypass on some Linux systems built without PAM, Alpine first among them; the French CERT-FR issued an alert. On 4 November, Symfony published a new series of security fixes for all its maintained branches.'
date: 2026-11-06
translationOf: 'failles-openssh-symfony-novembre-2026'
category: actualites
tags: ['OpenSSH', 'Symfony', 'Linux', 'Patches']
---

_Written on 6 November 2026, from the CERT-FR alert, the OpenSSH release notes, the Alpine Linux advisory and Packagist's security advisory database. Sources at the end._

## 1. OpenSSH: authentication bypass on some Linux systems

### What is confirmed

- **The flaw**: CVE-2026-123158, fixed in **OpenSSH 10.6p2**, released on 5 November 2026. The release notes describe a password authentication bypass, exploitable through `sshd`, on some Linux systems **built and run without PAM**. OpenSSH considers the root cause to lie outside `sshd`, but fixes it on its side.
- **The alert**: the French CERT-FR published alert **CERTFR-2026-ALE-015** on 5 November. It targets Linux systems using the **musl** C library, built without PAM or with PAM disabled, and states that when the conditions are met the flaw is "trivial to exploit". **No active exploitation has been reported** so far.
- **Alpine Linux** (which uses musl) published an advisory on 5 November: every branch it checked, from 3.16 to 3.24 and edge, is affected, and fixed packages are available.

### Are you affected?

On Alpine, according to its advisory, **all** of these must hold:

- `openssh-server` built without PAM, or `openssh-server-pam` with `UsePAM no`;
- `PasswordAuthentication yes` (the default);
- an account whose password field is `*` in `/etc/shadow` (the case for `root` on base images since about 3.16);
- another local account with a real password (a `$5$` or `$6$` hash).

Mainstream distributions (Debian, Ubuntu, Red Hat and derivatives) use glibc and PAM: they do not match the CERT-FR description, but follow your distribution's bulletins anyway. Docker containers that do not run `sshd` are not affected, according to Alpine.

### What to do

1. **Update**, then **restart `sshd`** (updating alone does not restart the service). On Alpine:
   ```sh
   apk upgrade -U -a
   rc-service sshd restart
   ```
2. **If you cannot update right away**, disable password authentication, as both CERT-FR and Alpine recommend. First check that key-based login works, in a **second session** that you keep open:
   ```sh
   echo 'PasswordAuthentication no' > /etc/ssh/sshd_config.d/no-password.conf
   sshd -t && rc-service sshd restart
   sshd -T | grep -i passwordauthentication
   ```
3. **Look for suspicious logins**: CERT-FR relays the researcher's command, which lists successful password logins to accounts whose password is disabled (run as root; adjust the log path to your system):
   ```sh
   awk -F : '$2 == "*" {print $1}' /etc/shadow | xargs -r -I{} grep "Accepted password for {}" /var/log/messages
   ```
4. **More generally**, an SSH server exposed to the internet should accept keys only.

## 2. Symfony: a new series of security fixes (4 November)

### What is confirmed

On 4 November 2026, the Symfony project published several security advisories, fixed in versions **5.4.56, 6.4.50, 7.4.23 and 8.1.11**. CERT-FR relayed them in advisory **CERTFR-2026-AVI-1460**. Versions released at the end of October do not include these fixes. Among the advisories (titles from Packagist's database):

- **Filesystem**: any prefix before "://" is treated as a root, letting paths escape their base directory;
- **HttpFoundation**: HEAD requests that bypass the `methods` option of `access_control` rules and firewalls (an incomplete fix of an earlier flaw); generated URLs that can point to a host chosen by the client; path rules enforced in front of PHP that can be bypassed;
- **HttpFoundation and FrameworkBundle**: the `private_ranges` trusted proxies shortcut wrongly trusts some IPv6 transition addresses;
- **Config**: a local file read (XXE) in `XmlUtils::parse()`.

### What to do

1. Run **`composer audit`** in each PHP project: it lists packages with a known advisory.
2. Update the Symfony components in your branch: `composer update 'symfony/*' --with-dependencies`, then run your tests.
3. If your application sits behind a proxy or load balancer, check the `trusted_proxies` configuration after the update.

This is exactly what happened to this site: CI blocked the release until the API and the client area moved to 8.1.11 and 7.4.23. A `composer audit` in the deployment pipeline costs nothing and avoids shipping a version known to be vulnerable.

## Key points

- OpenSSH: mainly Alpine and musl systems without PAM; update, restart `sshd`, and prefer keys over passwords.
- Symfony: move to 5.4.56, 6.4.50, 7.4.23 or 8.1.11 depending on your branch; `composer audit` flags it.

## Sources

- [CERT-FR alert CERTFR-2026-ALE-015: OpenSSH vulnerability (French)](https://www.cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-015/)
- [OpenSSH 10.6p2 release notes](https://www.openssh.org/txt/release-10.6p2)
- [Alpine Linux, 5 November 2026: OpenSSH password authentication bypass](https://alpinelinux.org/posts/2026-11-05-openssh-password-authentication-bypass/)
- [Symfony security advisory GHSA-6prc-h956-hxjq (Filesystem)](https://github.com/symfony/symfony/security/advisories/GHSA-6prc-h956-hxjq)
- [Packagist security advisory database](https://packagist.org/security-advisories/)
