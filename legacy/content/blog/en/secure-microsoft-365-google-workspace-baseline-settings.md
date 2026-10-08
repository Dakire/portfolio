---
title: Securing Microsoft 365 and Google Workspace: Baseline Settings
description: MFA, admin accounts, legacy authentication, auto-forwarding, external sharing, backup and offboarding: the essential measures for a small business.
date: 2026-10-03
translationOf: securiser-microsoft-365-google-workspace-reglages-de-base
---

Email and cloud storage hold most of a company's data, and compromised accounts are one of the main entry points for attacks (phishing, CEO fraud, ransomware). The good news: **a few well-chosen settings** greatly reduce the risk. According to Microsoft, multifactor authentication combined with blocking legacy authentication stops more than 99.9% of common identity attacks. The principles are the same for Microsoft 365 and Google Workspace.

## 1. Enforce multifactor authentication (MFA)

This is the measure that brings the most. A stolen password is no longer enough to get in.

- **Microsoft 365**: Entra ID's security defaults require MFA for all users, block legacy authentication and protect access to the Azure portal. They are enabled automatically on new tenants. For finer control, **Conditional Access** (by location, device, risk) requires at least a Microsoft Entra ID P1 license, included for example in Microsoft 365 Business Premium.
- **Google Workspace**: **2-Step Verification** is applied per organizational unit from the Admin console, with a grace period for enrollment. Google is progressively rolling out its requirement for administrator accounts.

Whenever possible, prefer phishing-resistant methods (**security keys, passkeys**) over SMS codes, and make them **mandatory for administrators**.

## 2. Protect administrator accounts

- Limit the **number of administrators** to the strict minimum, with the least privileged role for each task (avoid the "super admin" role for convenience).
- Use **dedicated admin accounts**, separate from the everyday mailbox account: phishing on the mailbox must not give access to the admin console.
- Set up **two emergency ("break-glass") accounts**, reserved for emergencies and tied to no particular person, so you don't lose access in case of an MFA outage or a configuration mistake. Since MFA became mandatory on Microsoft admin portals, these accounts must also have an MFA method: Microsoft recommends a **FIDO2 security key** or certificate-based authentication rather than a simple password kept offline. Exclude them from at least one Conditional Access policy, and alert on any sign-in.

## 3. Block legacy authentication

Old protocols (IMAP, POP, SMTP authenticated with a plain username and password) do not support MFA and are the target of password-guessing attacks.

- In Microsoft 365, security defaults already block legacy authentication. Otherwise, disable basic authentication for the protocols you don't need, or block it with Conditional Access. Basic authentication for **SMTP AUTH** (used by scanners and applications) is still possible today, but Microsoft plans to disable it by default at the end of 2026 on existing tenants, ahead of a final removal whose date has not yet been announced.
- In Google Workspace, access for "less secure apps" has been removed since 14 March 2025: applications must use OAuth, or an app password on accounts that have 2-Step Verification.
- List the devices that send mail (scanners, applications): they often use these protocols and will have to move to a modern method (SMTP relay authenticated by IP address, dedicated connector, OAuth).

## 4. Watch automatic mail forwarding

After a compromise, the attacker frequently creates a **forwarding rule** to an external address, to keep reading mail even after the password has been changed.

- Restrict or forbid **automatic forwarding to external addresses**.
- Regularly audit mailbox rules and delegations.
- Set up **alerts** for forwarding-rule creation and suspicious sign-ins.

## 5. Control external sharing

- Set a **restrictive** default sharing policy: share only with named people, no "anyone with the link" without an expiry date for sensitive data.
- Limit the external domains allowed for confidential documents.
- Periodically check who has access to important shared spaces.

## 6. Authenticate outbound mail

SPF, DKIM and DMARC protect both your deliverability and your brand against domain spoofing. It is as much a security measure as an email one: see [SPF, DKIM and DMARC explained](/en/blog/spf-dkim-dmarc-explained/).

## 7. Enable and keep logs

Without logs, it is impossible to know what happened after an incident. Check that **auditing** is enabled, that the retention period suits your needs, and know where to look: sign-in, admin, file access and mail logs.

## 8. Back up, because retention is not a backup

Cloud platforms guarantee the availability of the service, **not the restoration of your data** after a deletion, corruption or ransomware. The recycle bin and retention have a limited duration. A **third-party backup** (separate from the tenant) is the only real guarantee for critical data.

## 9. Handle employee departures

Define and apply a procedure for every departure:

1. Disable the account and revoke sessions and app passwords.
2. Retrieve or transfer the data (mailbox, documents) to the manager.
3. Handle the subscriptions, aliases and groups they owned.
4. Recover the device and remove access to third-party tools (SSO).
5. Only delete the license after backing up what needs to be kept.

## 10. Raise awareness

Technology is not enough: short, regular phishing awareness training (spotting a fake message, verifying a payment request through a second channel) remains one of the most cost-effective measures.

## Where to start?

If you could only do three things this week: **enforce MFA for everyone**, **protect administrator accounts** and **block external automatic forwarding**. The rest follows, in order of risk, at your organization's pace.

## Sources

- [Microsoft: security defaults in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/fundamentals/security-defaults)
- [Microsoft: emergency access (break-glass) accounts](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access)
- [Microsoft Message Center notice MC786329 on the end of basic authentication for SMTP AUTH](https://www.itelio.com/en/microsoft-message-center/MC786329) (relayed by Itelio, updated January 2026)
- [Google: transition from less secure apps to OAuth](https://knowledge.workspace.google.com/admin/sync/transition-from-less-secure-apps-to-oauth)
- [Google: 2-Step Verification enforcement for administrators](https://knowledge.workspace.google.com/admin/security/about-2sv-enforcement-for-admins)
