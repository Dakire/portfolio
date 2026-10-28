---
title: 'Supermarket Fridge Cyberattack in France: What We Know and the Lessons'
description: 'On the night of 11 to 12 October 2026, refrigeration controllers in hundreds of supermarkets were hacked. Equipment, cause, losses, and measures for any connected device.'
date: 2026-10-28
translationOf: 'cyberattaque-frigos-supermarches-controleurs-froid'
category: actualites
tags: ['Cyberattack', 'IoT', 'End of life']
---

On the night of **11 to 12 October 2026**, attackers took remote control of the refrigeration controllers of several hundred French supermarkets: temperature setpoints changed, alarms disabled, fresh and frozen food to be thrown away. Nobody has claimed the attack. Two weeks later, we know what was hit and why it was possible. It is a textbook case for any organization with connected devices, even a small one.

## What happened

- **Chains affected**, confirmed by the retailers to AFP according to franceinfo: at least 300 Intermarché/Netto stores, fewer than a hundred Coopérative U stores, 80 Carrefour supermarkets, about thirty Monoprix and several E.Leclerc stores.
- **Method**: the attackers reached the control systems of the Danish manufacturer **Danfoss** remotely, then those of **Dixell**, and changed temperature setpoints. Since alarm thresholds were changed too, the drift was not detected right away.
- **Effects**: very high temperatures in some stores (50 to 80 °C depending on the source, figures not verified), damaged equipment, destroyed food. A Carrefour Market manager in Rennes saw their freezers set to 95 °C in the app.
- **Losses**: estimates vary widely, from "several million euros" (franceinfo) to several tens of millions (The Record), or €200,000 to €300,000 per supermarket according to Linéaires, not counting equipment damage. The figures are provisional.
- **Investigation**: the Paris prosecutor's office opened an investigation led by the Ofac, and the Prime Minister asked ANSSI to take on the case.

## The equipment involved

CERT-FR bulletin **CERTFR-2026-ALE-012**, published on 12 October and updated on the 13th and 16th, lists:

- **Danfoss** controllers of the **AK-SC** and **AK-SM** series;
- **Copeland xweb** supervisors;
- **Dixell xweb** supervisors.

According to Danfoss, most affected devices are **old and end-of-life** (notably the AK-SM 800 and AK-SC 355 models), and no longer receive security updates. Others were simply not up to date.

## Why it was possible

The common thread is a classic one: management interfaces **reachable from the Internet**, on hardware that is no longer patched. CERT-FR is unambiguous: exposing a management interface on the Internet is contrary to good practice, and an end-of-life device with no fix, exposed, has a very high probability of being compromised.

Experts disagree on how sophisticated the attack was. One points to an unapplied update and a very simple password (an unverified hypothesis), another to documented flaws, the most recent dating from April 2025, and a third calls the operation "somewhat sophisticated" given how many devices were hit at once. What is established: the exact origin of the intrusion remains to be determined.

## What to do, even with a single connected device

CERT-FR details the steps for the affected equipment. They apply to any connected device (refrigeration controller, alarm, camera, controller, UPS, printer):

1. **Remove Internet exposure**, including for devices with a public IP address. Before cutting data reporting to the service provider, check your insurance clauses.
2. **Use a VPN or a protected network** for remote access. Filtering the provider's IP addresses on a firewall is only an emergency measure, not a lasting one.
3. **Update the firmware**, enable the manufacturer's strictest security mode ("Strict" at Danfoss) and **change default passwords**.
4. **Check the configuration** after an incident: here, notably the defrost schedules.
5. **Don't rely on a factory reset** for a compromised device: it removes persistence, but the device stays vulnerable and will probably be attacked again.
6. **Replace end-of-life hardware.** Same logic as for [the end of Windows 10](/en/blog/windows-10-end-of-support-upgrade-to-windows-11/): equipment that no longer receives fixes cannot stay exposed.

Two common-sense additions, which are my opinion and not official guidance: **inventory what is connected** (you can't protect what you don't know about), and keep an **independent temperature probe** with its own alarm, not going through the same network as the controller.

## One point on regulation

The EU Cyber Resilience Act (CRA) will not force manufacturers to fix this kind of hardware. According to The Record, citing ENISA, vulnerability-handling obligations only apply during the support period defined by the manufacturer, and do not apply to products placed on the market before 11 December 2027 or whose support has ended. The attacked controllers fall in that category. In practice, the responsibility to isolate or replace them stays with the operator.

## Takeaways

- Hardware that is no longer patched and reachable from the Internet eventually gets taken.
- A forgotten connected device (refrigeration, alarm, camera) is an entry point like any other.
- The cost of a replacement or a VPN is small compared to the loss of a stock.

## Sources

- [CERT-FR: bulletin CERTFR-2026-ALE-012, incident on remote controllers of refrigeration installations (in French)](https://cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/)
- [franceinfo: a hack "not that sophisticated" (in French)](https://www.franceinfo.fr/internet/securite-sur-internet/cyberattaques/un-piratage-pas-si-sophistique-que-ca-ce-que-l-on-sait-de-la-cyberattaque-qui-a-fait-monter-en-temperature-les-frigos-de-supermarches_8235061.html)
- [Process Alimentaire: supermarket cyberattack, vulnerable refrigeration controllers (in French)](https://www.processalimentaire.com/procedes/cyberattaque-des-supermarches-des-controleurs-de-froid-vulnerables)
- [The Record: EU cyber law won't force fixes for fridges in French attack](https://therecord.media/eu-cyber-law-wont-force-fixes-for-fridges-in-french-attack)
