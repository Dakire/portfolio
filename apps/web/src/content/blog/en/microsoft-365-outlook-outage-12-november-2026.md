---
title: 'Global Microsoft 365 and Outlook Outage of 12 November 2026'
seoTitle: 'Microsoft 365 and Outlook Outage of 12 November 2026'
description: 'Global Exchange Online and Outlook outage on 12 November 2026: what is established, what remains unknown, and how to limit the impact on your organization.'
summary: 'On 12 November 2026, Exchange Online and Outlook were disrupted for many hours in 74 countries, with effects on Teams, SharePoint and Copilot. Microsoft rules out a cyberattack and points to a saturated secure-connection process; the trigger was not identified as of 13 November.'
date: 2026-11-14
translationOf: 'panne-microsoft-365-outlook-12-novembre-2026'
category: actualites
tags: ['Microsoft 365', 'Outlook', 'Exchange Online', 'Outage']
---

_Written on 14 November 2026, from articles by Le Monde Informatique, franceinfo and Ouest-France (French media). Microsoft had not published a final report at the time of writing: the "unknown" points below may change. Sources at the end._

## What is established

- **Start**: Thursday **12 November 2026**. The exact start time is not given in the articles I read.
- **Affected services**: mainly **Exchange Online and Outlook** (sending and receiving messages, mailbox access, calendars). According to Le Monde Informatique, the outage also hit **Copilot, SharePoint Online, Planner** and some admin tools. **Teams** was affected less: chat and video calls mostly worked, but calendars and meeting scheduling did not. The Microsoft 365 connectors of OpenAI and Anthropic were also disrupted.
- **Scale**: problems reported in **74 countries and territories** according to Downdetector, with over **130,000 reports** about Outlook in the United States at the peak. These figures come from user reports: they do not give the exact number of people affected (media range from "tens of thousands" to "millions").
- **Duration**: nearly 11 hours after the start, Microsoft was still struggling to stabilize its infrastructure. It kept working on Friday 13 November and noted improvements, without announcing a full recovery in the articles I read.
- **Stated cause**: Microsoft first mentioned an overload of some components. The investigation then pointed to a **process responsible for establishing secure connections on the servers, saturated** and preventing normal request handling.
- **Cyberattack**: Microsoft executive Charles Lamanna said nothing suggested an attack.
- **Recovery attempts**: redistributing connections, restarting machines, restoring some configurations. Several servers became unavailable again after being put back into service.

## What remains unknown

- The **trigger** of the saturation was not identified.
- The **full resolution time** and the **incident ID** were not in the articles I read.
- A **post-incident review** from Microsoft should follow, as with earlier outages; I cannot guarantee its date or content.

## What to do during an outage like this

1. **Confirm the problem is on Microsoft's side** before touching your workstations or configuration: check the **Microsoft 365 admin center** (service health, incidents) and the public status page. A problem limited to a few users does not have the same cause as a global incident.
2. **Warn users through an independent channel** (SMS, phone, another messaging app): do not rely on email to announce an email outage.
3. **Do not resend failed messages in a loop**: queues drain on their own, and resends create duplicates. External senders whose message could not be delivered usually get a temporary error, then the server retries.
4. **Document** the start and end times on your side: useful for an SLA claim, a service credit request or a post-mortem.
5. **After the outage**, look for lost or late messages: if you doubt a delivery, Exchange Online message trace shows what happened to a specific message.

## Prepare for next time

- Have **a fallback channel** to warn and coordinate the team (phone, third-party chat).
- Keep **essential contacts outside the mailbox** (exported directory, on-call numbers).
- Know where to read the service status and who announces it internally.
- Check that your **MX and SPF/DKIM/DMARC records** are correct: after an outage, delayed messages can reveal a misconfigured domain. [SPF, DKIM and DMARC Explained](/en/blog/spf-dkim-dmarc-explained/) covers the topic, and [email deliverability troubleshooting](/en/blog/email-deliverability-troubleshooting-spam-bounces/) helps analyze a bounce.

## Key takeaways

- The 12 November outage mainly hit Exchange Online and Outlook, in 74 countries, with effects on Teams, SharePoint and Copilot.
- Microsoft rules out a cyberattack and describes a saturated secure-connection process; the trigger remained to be identified.
- Have a fallback channel and know how to read the service status before the next incident.

## Sources

- [Le Monde Informatique: Panne mondiale de Microsoft 365, Outlook perturbé pendant des heures (in French)](https://www.lemondeinformatique.fr/applications-developpement/panne-mondiale-de-microsoft-365-outlook-perturbe-p)
- [franceinfo: Une panne mondiale touche la messagerie Outlook de Microsoft (in French)](https://www.franceinfo.fr/internet/une-panne-mondiale-touche-la-messagerie-outlook-de-microsoft_8280611.html)
- [franceinfo: "no sign of malicious action or cyberattack" at this stage (in French)](https://www.franceinfo.fr/internet/microsoft/une-panne-mondiale-touche-la-messagerie-outlook-de-microsoft-les-mesures-pour-la-resoudre-ne-fonctionnent-pas-comme-prevu_8280422.html)
- [Ouest-France: what we know about the global outage (in French)](https://www.ouest-france.fr/high-tech/microsoft/microsoft-365-outlook-teams-ce-que-lon-sait-de-la-panne-mondiale-qui-touche-les-messageries-informatiques-bbb822ce-df27-11f1-9a29-f4bab172af08)
