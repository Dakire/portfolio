---
title: 'AI at Work: Comparing the Assistants from an IT Technician’s Seat'
seoTitle: 'AI Assistants Compared for IT Technicians'
description: 'How I pick an AI assistant for scripts, troubleshooting and documentation: ChatGPT, Claude, Gemini, Copilot, Mistral, DeepSeek and Perplexity compared.'
summary: 'I have used AI since 2022 and started with ChatGPT. This guide compares seven assistants on what matters in an IT job: PowerShell scripts, troubleshooting, documentation, reading logs, and above all what you can hand them without breaching GDPR. Each tool has its own article, with dated pricing.'
date: 2026-11-06
translationOf: 'ia-informatique-comparatif-assistants-ligne-editoriale'
category: ia
tags: ['AI', 'ChatGPT', 'Claude', 'Gemini', 'GDPR']
---

_Written on 6 November 2026. Pricing and versions: official pages read that day._

## My editorial line

I have used AI since 2022 and started with ChatGPT, in November 2022, as soon as the conversational version came out. I use it to correct texts, quickly check information and write code.

Rules for this guide:

- **I say what I tested and what I did not.** An opinion without a trial is presented as such.
- **Prices and versions are dated** and come from official pages when they can be read. When I could not read them, I say so.
- **An AI that gets it wrong is not a scandal, it is the starting point.** Each article says where the tool tends to make things up.
- **No partnership, no affiliate link.**

## The comparison in one table

| Assistant                   | Where it is comfortable                                    | Where I stay wary                                    | Article                                                                 |
| --------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| ChatGPT                     | General use, many features (files, images, voice, tasks)   | Plans and prices that move often, ads on Go          | [ChatGPT](/en/blog/chatgpt-it-use-cases-pricing-privacy/)               |
| Claude                      | Long texts, code, documents to rewrite                     | Usage limits that vary by plan                       | [Claude](/en/blog/claude-it-use-cases-pricing-privacy/)                 |
| Gemini                      | Google ecosystem (Workspace, Drive, Gmail), large context  | Many plans and tiers, names that change              | [Gemini](/en/blog/gemini-it-use-cases-pricing-privacy/)                 |
| Microsoft Copilot           | Work in Word, Excel, Outlook, Teams with the tenant's data | Paid licence on top, results tied to existing rights | [Copilot](/en/blog/microsoft-copilot-365-it-use-cases-pricing-privacy/) |
| Mistral (Le Chat, now Vibe) | French provider, general use, development                  | Product name in transition                           | [Mistral](/en/blog/mistral-le-chat-vibe-it-use-cases-pricing-privacy/)  |
| DeepSeek                    | Models available through an API at low cost                | Data processed in China: rule out for work data      | [DeepSeek](/en/blog/deepseek-it-use-cases-privacy/)                     |
| Perplexity                  | Search with cited sources                                  | Check every source; the answer is not the source     | [Perplexity](/en/blog/perplexity-search-sources-it-use-cases/)          |

This table is my reading at the time of writing. Day to day, I use Claude, Gemini and ChatGPT.

## What I ask AI to do in an IT job

1. **Write or fix a script** (PowerShell, Bash, Python): reliable for a skeleton, never for running without review. Always test with `-WhatIf` or on a test account.
2. **Point a troubleshooting session in a direction**: an error message, a possible cause, the diagnostic commands to run. The AI suggests, the machine answers.
3. **Document**: turn notes into a procedure, rephrase a reply to a client, proofread a report.
4. **Read logs**: summarize an excerpt, spot a pattern. Provided the excerpt has been anonymized.

## What you never paste into an assistant

My rule, on every assistant: never a password, bank details or IBAN, and never a first or last name. More broadly, unless the service is covered by a contract that governs data processing, **do not paste**:

- passwords, API keys, tokens, sign-in secrets, BitLocker keys;
- personal data of clients or colleagues (names, emails, numbers, IP addresses tied to a person);
- message contents, contracts, confidential documents;
- internal network diagrams, addressing plans, full firewall rule sets;
- raw, non-anonymized logs.

**Anonymize**: replace names with `client-A`, addresses with `192.0.2.10`, domains with `example.com`. For professional use, prefer a provider's business plan, which spells out how data is used, and read its terms. The French data protection authority (CNIL) publishes recommendations on AI: [cnil.fr/fr/intelligence-artificielle](https://www.cnil.fr/fr/intelligence-artificielle) (in French).

## What to do

1. **Pick one main tool**, and a second to check it. More than that is scattering.
2. **Write a one-page rule** for the team: what is allowed, what is forbidden, who the contact is.
3. **Anonymize before pasting.** Make it a reflex, not a guideline.
4. **Review everything that runs.** Script, firewall rule, query: read and understood before it is launched.
5. **Date your choices**: a price or a model from November 2026 will not hold in 2027.

## Sources

- [CNIL: artificial intelligence](https://www.cnil.fr/fr/intelligence-artificielle) (French)
- The sources specific to each assistant are in its own article.
