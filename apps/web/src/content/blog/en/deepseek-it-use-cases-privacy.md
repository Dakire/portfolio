---
title: 'DeepSeek for an IT Technician: Use Cases, Limits and GDPR'
seoTitle: 'DeepSeek at Work: IT Use Cases, Limits and GDPR'
description: 'DeepSeek in an IT job: its appeal through the API, European regulators’ concerns about data, and why I hand it no data.'
summary: 'DeepSeek stands out for models available through an API at low cost. Its main issue is data: its privacy policy places processing on servers in China, which led European authorities to react in 2025. Here is what I take from it, what I could not verify, and the usage rule I draw.'
date: 2026-11-06
translationOf: 'deepseek-usages-it-confidentialite'
category: ia
tags: ['DeepSeek', 'AI', 'GDPR', 'Privacy']
---

_Written on 6 November 2026. The regulatory information dates from 2025; I found no recent source on the status of the proceedings._

## My starting point

I tested it, through the API, for development.

## What it does well

- **API access**: the official documentation presents endpoints compatible with those of OpenAI and Anthropic, which makes integration into existing tools easier.
- **Recent models**: the release notes page mentions DeepSeek-V4-Pro and DeepSeek-V4.1-Flash-1017 on the day I read it (no publication date shown).
- **Appeal for development**: the documentation mentions integrations with AI-assisted programming tools.

## Where I stay wary: data

- DeepSeek's privacy policy states, according to the press, that **users' data is stored on servers in China** and may be shared with affiliated companies and service providers.
- **In January 2025**, the Italian data protection authority (the Garante) blocked access to the app while it checked how data is collected and stored; the Berlin commissioner asked Apple and Google to remove the app, judging the transfer of data to China non-compliant with GDPR; the French CNIL announced it would examine its practices. This information comes from the press of the time.
- **I found no recent source** on the current status of these proceedings. Check the statements of the Garante, the Berlin authority and the CNIL before relying on this paragraph.

Practical consequence: avoid it, in its app as on its website, for any **professional or personal data**.

What interests me: value for money. No client or colleague has asked me about using it in a company. My rule, for every assistant: never a password, bank details or IBAN, and never a first or last name.

## IT use cases (without real data)

| Need               | What I ask it                                | Precaution                       |
| ------------------ | -------------------------------------------- | -------------------------------- |
| Syntax question    | A command option, a regular expression       | No client data, nothing internal |
| Exercise, learning | A fictional sample script                    | Test in a lab                    |
| API integration    | Evaluate a model on public or synthetic data | Never production data            |

## Privacy and GDPR

- **Do not paste** professional or personal data.
- For business use, **assess the contract and where processing takes place** before anything else; if you cannot conclude, pass.
- If you use published model weights and run them yourself, the data question is different: your own infrastructure then does the processing, and securing it is up to you. Check the licence of the model you use, which I could not confirm on the page I read.

## Pricing and versions

I could not read an official price list for the app; the API documentation publishes per-model prices. **Check the official platform the day you decide.**

## What to do

1. **Do not open it to the team** for work data without a written assessment.
2. To test, use fictional data.
3. Write a rule: "no AI tool that has not been approved for work data".
4. Read the authorities' statements before taking a position.

## Sources

- [DeepSeek API release notes (official page)](https://api-docs.deepseek.com/news/news), read on 6 November 2026
- [Journal du Geek, 30 January 2025: DeepSeek banned in Europe](https://www.journaldugeek.com/2025/01/30/tout-juste-lance-deepseek-est-deja-interdit-en-europe/) (French)
- [IT-Connect: Germany asks Google and Apple to remove the app](https://www.it-connect.fr/ia-allemagne-demande-google-et-apple-supprimer-applications-deepseek/) (French)
- [CNIL: artificial intelligence](https://www.cnil.fr/fr/intelligence-artificielle) (French)
