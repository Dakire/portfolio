---
title: 'sitemap.xml Errors in Search Console: Causes and Fixes'
seoTitle: 'Sitemap errors: causes and fixes (Search Console)'
description: "Couldn't fetch sitemap, HTML sitemap, URL not allowed: the real causes of a rejected sitemap.xml and how to fix them, with a free sitemap checker."
summary: "The most common sitemap errors in Search Console (couldn't fetch, HTML sitemap, URL not allowed, too many URLs), their causes, the sitemap.xml format rules and how to test your file for free."
date: 2026-11-10
translationOf: 'sitemap-xml-erreurs-search-console'
category: web
tags: ['Sitemap', 'SEO', 'Search Console', 'robots.txt', 'Indexing']
---

A **sitemap.xml** lists the pages you want search engines to crawl. When Search Console rejects it ("Couldn't fetch", "Sitemap is an HTML page"…), it is almost always one of the causes below. Here is how to spot and fix them.

## In short

- Test the file first with the [sitemap checker](/en/tools/sitemap/): it reads `robots.txt`, validates the XML syntax and reports duplicates, blocked URLs and limit overruns.
- A valid sitemap contains **at most 50,000 URLs and 50 MB uncompressed**, in UTF-8, with **absolute URLs** from the same site.
- Only list pages that are **indexable, return 200 and do not redirect**, and are not blocked by `robots.txt` or `noindex`.
- Declare it in `robots.txt` with a line `Sitemap: https://example.com/sitemap.xml`.

## Search Console errors and their causes

| Message                              | Most frequent cause                                                                                        | Fix                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Couldn't fetch                       | wrong address, 404, 403 (firewall or security plugin), redirect, `robots.txt` blocking the file            | open the URL in a browser and with `curl -I`, aim for a 200 |
| Sitemap is an HTML page              | the URL returns an HTML page (error page, login page, CMS theme)                                           | serve XML with the `application/xml` type                   |
| XML parsing error                    | unescaped `&` (`&amp;`), unclosed tag, BOM or text before `<?xml`, encoding other than UTF-8               | validate the XML, escape `&`, `<`, `>`, `'` and `"` in URLs |
| URL not allowed                      | a URL in the sitemap is not under the same site (other domain, different `www`, `http` instead of `https`) | only put URLs of the exact site that holds the sitemap      |
| Too many URLs                        | more than 50,000 URLs or more than 50 MB                                                                   | split into several sitemaps and a **sitemap index**         |
| URL blocked by robots.txt            | the page is in the sitemap but `Disallow` forbids it                                                       | remove the page from the sitemap or lift the block          |
| Sitemap read but pages "not indexed" | pages with `noindex`, duplicates, redirected, 404, or canonical pointing to another page                   | include only canonical, 200, indexable pages                |

## Format rules

- A root `<urlset>` (list of pages) or `<sitemapindex>` (list of sitemaps), with the `http://www.sitemaps.org/schemas/sitemap/0.9` namespace.
- Each `<url>` contains at least a `<loc>`: the **absolute** address of the page.
- `<lastmod>` is optional, but if present it must be **true**: a date that changes on every build without a real change ends up being ignored by Google. W3C format (`2026-11-10` or `2026-11-10T09:30:00+01:00`).
- `<priority>` and `<changefreq>` are ignored by Google: no need to tune them.
- A **compressed** sitemap (`.xml.gz`) is accepted, with the 50 MB limit applying to the uncompressed file.

## URL list or index: do not change its nature

A real case on this site, on 15 October 2026: Search Console reported an error on `/sitemap.xml` while `/sitemap-0.xml` was accepted. The file was nevertheless valid XML, returned 200 and had the right type. The only difference: the previous version of that address was **a URL list**, and the new one a **sitemap index** pointing to `sitemap-0.xml`. The same submitted URL had changed nature.

The fix was to give `/sitemap.xml` back its direct URL-list form, without an intermediate index. There is no guarantee that this was the only possible cause (Search Console stays vague on the detail), but the practical rule is simple: **when a sitemap address is already submitted, keep its nature (list or index)**, and if you must change it, submit the new address.

## Verification procedure

1. Open the sitemap URL in a browser: XML is displayed, not a site page.
2. Check the header with `curl -I https://example.com/sitemap.xml`: code **200** and `Content-Type: application/xml` (or `text/xml`).
3. Run it through the [sitemap checker](/en/tools/sitemap/): syntax, URL count, duplicates, blocked URLs.
4. Check that `robots.txt` contains a `Sitemap:` line with the absolute address.
5. In Search Console: **Indexing → Sitemaps**, add the address and wait for the "Success" status.
6. Then check a few pages from the sitemap with the [SEO report](/en/tools/seo/): code 200, no `noindex`, canonical pointing to itself. See also [the SEO audit report template](/en/blog/seo-audit-report-checklist-template/).

## Frequently asked questions

### My sitemap is "Success" but pages are not indexed. Why?

A sitemap is only a suggestion. Google indexes according to the quality, uniqueness and perceived importance of pages. Check the detail in the "Pages" report of Search Console.

### Does a small site need a sitemap?

Not required if every page is linked from another, but it stays useful and costs nothing.

### How long before Google reads the sitemap?

A few hours to a few days. A "Couldn't fetch" status right after adding may disappear on its own; if it persists, go back over the table above.
