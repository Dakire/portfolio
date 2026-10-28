---
title: 'Orange Outage of 21 October 2026: What We Know and How to Protect Yourself'
description: 'Ten hours without Orange and Sosh mobile service: timeline, announced cause, and concrete measures so an operator outage does not stop a small business.'
date: 2026-10-28
translationOf: 'panne-orange-21-octobre-2026-reseau-mobile'
category: actualites
tags: ['Orange', 'Outage', 'Business continuity']
---

On **Wednesday 21 October 2026**, the Orange and Sosh mobile network went down across France for nearly ten hours. Calls, SMS and mobile internet were cut, for consumers and businesses alike. A few days later, the cause is better understood, and the outage is a good prompt for a simple question: what happens in your organization if the operator goes down?

## What happened

- **Start** in the morning of 21 October; reports peaked around 11:50 am, with nearly 12,000 reports on Downdetector.
- **Scope**: the Orange and Sosh mobile network (about 21.6 million Orange mobile customers in France at the end of June). A few hundred SFR and Bouygues Telecom customers also reported problems; those operators did not comment, and a link to Orange's incident is not established.
- **Announced cause**: at first, Orange spoke of "an equipment failure in our mobile core network". Its managing director for France, Jérôme Hénique, then told Le Figaro about an **"unprecedented and exceptional" software bug** in Nokia equipment, ruling out a cyberattack.
- **Mechanism** (as reported by the press): the primary and backup equipment ran the same software version, so the backup suffered the same bug. Certain error messages triggered it, and each restart brought the equipment down again.
- **Resolution**: the problem was located around 5 pm, with about a hundred technicians involved, and service came back gradually in the early evening.
- **Commercial gesture**: mobile data allowance doubled for one month for affected subscribers. No other general measure announced, apart from contractual provisions for businesses.

## What we don't know

The technical details come from statements relayed by the press, not from a published incident report. Until Orange publishes a detailed analysis, treat the explanations as provisional.

## Why it matters to a small organization

An operator outage is more than an inconvenience. In practice, it cuts:

- **telephony**: the team's mobile lines, a switchboard forwarded to mobiles;
- **SMS codes**: SMS-based two-factor authentication, payment validation, sign-in to some services;
- **alerts**: monitoring or on-call systems that notify by SMS;
- **mobile internet**: tethering, 4G payment terminals, connected devices.

## The measures that actually help

1. **Don't rely on a single operator for essentials.** A second line with another operator, often as an eSIM on the same phone, costs little and covers this case.
2. **Keep a fixed backup connection, and the other way round.** This outage hit mobile: a landline was an alternative. A 4G/5G backup router covers the opposite case (fibre outage).
3. **Use apps over Wi-Fi.** Orange advised connecting to a Wi-Fi network to use the internet and messaging or video-call apps. A softphone or VoIP lets you stay reachable without a mobile network.
4. **Move authentication away from SMS.** An authenticator app or a security key works without a mobile network; a code sent by SMS does not. This is one of the basics in the [guide to securing Microsoft 365 and Google Workspace](/en/blog/secure-microsoft-365-google-workspace-baseline-settings/).
5. **Know what to do for emergencies.** The Tarn département reminded people that if a call fails, you can dial 112 from another available mobile network or from a landline.
6. **Have a written, offline plan.** Key contacts on paper or stored locally, a meeting point, someone who decides on plan B. Five lines are enough, as long as they exist before the outage.
7. **Check your contracts.** Businesses have specific contractual provisions: restoration commitments, penalties. Better to know them before you need them.

## Takeaways

- Even a major operator with redundant equipment can go down for a whole day: software redundancy doesn't help if the backup has the same bug.
- The weak point is often how mobile is used indirectly (SMS, 2FA) rather than the phone itself.
- A second operator on eSIM and authentication without SMS remove most of the risk for a low cost.

## Sources

- [Génération NT: an unprecedented software bug caused a ten-hour blackout (in French)](https://www.generation-nt.com/actualites/panne-orange-bug-logiciel-nokia-reseau-mobile-2083450)
- [France 3 Régions: Orange outage, what we know about the mobile network disruption (in French)](https://france3-regions.franceinfo.fr/occitanie/haute-garonne/toulouse/panne-orange-ce-que-l-on-sait-des-perturbations-qui-touchent-le-reseau-mobile-ce-mercredi-3436962.html)
