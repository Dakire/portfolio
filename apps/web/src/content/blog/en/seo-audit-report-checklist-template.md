---
title: 'SEO Audit Report: a 30-Point Checklist, Template and Free PDF Export'
seoTitle: 'SEO audit report: checklist, template and free PDF'
description: 'What an SEO audit report should contain, in what order to fix issues, with a 30-point checklist and a free tool that generates the report as a PDF.'
summary: 'What a technical SEO audit report must cover (server, indexing, tags, content, links, sharing, security), the order of fixes, indicative thresholds and how to get a free report you can export to PDF.'
date: 2026-11-10
translationOf: 'rapport-audit-seo-checklist-modele'
category: web
tags: ['SEO', 'Audit', 'Report', 'Indexing', 'Tags']
---

An **SEO audit report** is a technical snapshot of a page or site at a given moment: what stops Google from crawling, indexing or displaying it properly, ranked by priority, with the fix for each point. Here is what it should contain, in what order to act, and how to get a free one, including as a PDF.

## In short

- A good report sorts problems into **critical** (the page will not be indexed), **important** (it will be poorly displayed or understood) and **info**.
- It covers **server and indexing** first (HTTP status, redirects, HTTPS, robots, canonical), then **tags** and **content**, then **links**, **sharing** and **security**.
- The free [SEO report](/en/tools/seo/) tool runs more than 30 checks on a page and offers **JSON export** and **print or save as PDF**.
- A technical report says nothing about rankings, backlinks or competitors: complete it with Search Console.

## What an SEO audit report contains

| Family                           | What is checked                                                                                                         | Why                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Server and HTTP                  | response code (200), redirect chain, HTTPS, HSTS, response time, compression                                            | a failing or slow page is not (well) indexed    |
| Indexing                         | `meta robots`, `X-Robots-Tag` header, canonical, `robots.txt` (page blocked or not), sitemap                            | decides whether the page can appear in results  |
| Tags                             | `title`, meta description, language, viewport, a single `h1`, heading order                                             | what Google shows and understands first         |
| Content                          | word count, image `alt` attributes                                                                                      | thin content or images without alternative text |
| Links                            | sampled links tested, broken links (404)                                                                                | a broken link wastes crawling and hurts users   |
| Sharing                          | Open Graph, Twitter/X card, favicon                                                                                     | the preview when the page is shared             |
| Structured data                  | schema.org JSON-LD blocks: presence, validity, types                                                                    | eligibility for rich results                    |
| Basic security and accessibility | Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, field labels, `main`/`nav` landmarks | trust, protection and assistive reading         |

## Thresholds to know (indicative)

Google publishes no "official" length: these are display guidelines for search results.

- **Title**: about 30 to 60 characters, unique across the site, subject first. Longer titles are truncated.
- **Meta description**: about 70 to 160 characters. It does not directly affect ranking, but it affects clicks.
- **One `h1`** per page, then `h2` and `h3` in order, without skipping levels.
- **Redirects**: ideally none, at most one. A chain of three or more is fixed at the source.
- **Core Web Vitals** (measure with PageSpeed Insights or Search Console): LCP under 2.5 s, INP under 200 ms, CLS under 0.1.
- **Links**: no internal link to a page that returns 404 or redirects.

## In what order to fix

1. **Everything critical**: 404 or 5xx pages, an accidental `noindex`, a page blocked by `robots.txt`, a canonical pointing elsewhere, an expired TLS certificate. Until these are fixed, the rest is secondary.
2. **Tags**: a unique, well-written `title` and meta description, and a clear `h1`. This is the best effort-to-result ratio.
3. **Content and links**: alternative text, broken links, orphan pages (no internal link leads to them).
4. **Sharing and structured data**: Open Graph for clean previews, JSON-LD for rich results.
5. **Security headers**: they count little for ranking but a lot for trust and site protection.

## Get a free report as a PDF

1. Open the [SEO report](/en/tools/seo/) tool and enter the address of a public page.
2. Run the analysis: the score out of 100 and the list of points to fix appear, sorted by priority, with the fix for each.
3. Click **Print or save as PDF** to get a report you can send, or **Export as JSON** to process it in a script.

The analysed address is not stored. The tool is limited to 12 analyses per hour and examines **one page at a time**: for a whole site, repeat it on the key pages (home page, a service page, an article).

## What a technical report does not tell you

- **Rankings** and the keywords that bring traffic: that is the job of [Search Console](https://search.google.com/search-console).
- **Backlinks** (incoming links) and domain authority.
- **Editorial quality**: useful, up-to-date content remains the main factor.
- **Sitemap** errors, which deserve their own check: see [sitemap.xml errors and how to fix them](/en/blog/sitemap-xml-errors-search-console/).

## Frequently asked questions

### Is a free SEO report reliable?

For technical checks (tags, HTTP codes, redirects, headers), yes: they are measurable facts. For rankings, no tool can guarantee anything.

### How often should I repeat an audit?

After every redesign, host or CMS change, and at least once a quarter on the important pages.

### Should I aim for 100 out of 100?

No. A score is a guideline: an "info" point with no consequence does not justify breaking a page that works. Fix the critical first, then the important.
