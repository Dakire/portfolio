---
title: 'RAM and SSD Shortage: Why Prices Are Rising, and When to Buy'
seoTitle: 'RAM and SSD Shortage in 2026: Prices, Causes, What to Do'
description: 'RAM and SSD prices are rising in 2026 as AI demand (HBM, servers) soaks up memory. What Samsung says, the impact on PCs, and when to buy.'
summary: 'Memory makers are reserving their fabs for AI server chips (HBM, server DRAM, enterprise SSDs), and PC memory is becoming scarce and expensive. Samsung reports a record third quarter and an even tighter supply in 2027. For an individual or a small business, this changes how to buy: what is needed now, what can wait, and what extends the life of a fleet.'
date: 2026-11-06
translationOf: 'penurie-ram-ssd-prix-ia-2026'
category: actualites
tags: ['RAM', 'SSD', 'Hardware', 'Samsung', 'AI']
---

_Written on 6 November 2026. Figures come from Samsung (results of 29 October 2026), TrendForce and IDC; they are contract prices between manufacturers and industry buyers, not shop prices. **No price forecast is certain**: those quoted here are the analysts', dated, and they have already been revised several times._

## What is happening

Three manufacturers make most of the world's DRAM: Samsung, SK hynix and Micron. For two years, a growing share of their fabs has been making **HBM** (High Bandwidth Memory), the stacked memory attached to the GPUs in AI servers, and server memory. It sells for much more, under multi-year contracts.

Capacity that goes to HBM and servers no longer serves PCs, phones or retail memory modules. The same logic applies to the NAND flash in SSDs: data centres are buying enterprise SSDs in bulk.

## What Samsung announced on 29 October 2026

- A **record operating profit** of 107.44 trillion won in the third quarter, 106.5 trillion of it from the semiconductor division (CNBC).
- **HBM4** sales more than tripled in a quarter, and HBM supply for 2027 is **already "effectively sold out"** at target prices (Samsung, reported by TrendForce).
- **Average DRAM prices up about 20%** in a quarter, and NAND up by high teens (Samsung's earnings call, reported by TrendForce).
- **Long-term agreements** signed with ten major customers, ten more under negotiation.
- Looking ahead: Samsung expects AI investment to **accelerate in 2027** and memory supply to **tighten further** (CNBC).

In other words, the world's largest memory maker does not expect any easing next year.

## What the analysts say

- **TrendForce** (30 September 2026) expects fourth-quarter 2026 contract prices to rise **10 to 15%** for conventional DRAM and **15 to 20%** for NAND, quarter on quarter. It notes that PC brands are **cutting SSD capacities** in mainstream models to contain costs, and that PC DRAM supply **could fall in 2027** as fabs shift to servers.
- **IDC** (2 June 2026) expects PC shipments to fall **11.3%** in 2026, with an **average selling price up 17%**, and "no relief before the end of 2027". Its analysts say prices are unlikely to return to 2025 levels even as capacity grows.

These are forecasts: they can be wrong either way, and they cover prices between industry players. Shop prices follow with a delay and depend on resellers' stock.

## What it changes in practice

- **New PCs**: more expensive for the same specification, or the same price with less memory or a smaller SSD. **Read the spec sheet**, not just the price: a laptop sold with 8 GB in 2026 will feel short very quickly.
- **Retail RAM modules and SSDs**: more volatile prices, with large gaps between resellers.
- **Servers**: server memory gets priority at the manufacturers, but it is also the most in demand. Long lead times and short-validity quotes are becoming common.
- **Smartphones**: the same trend, less visibly.

## What to do

1. **A real need now** (slow machine, failure, new hire): do not wait for a drop nobody expects before late 2027. Buy, but with the right amount of memory.
2. **Get enough memory to last**: 16 GB is a reasonable minimum for an office PC on Windows 11, 32 GB for development, virtualization or large files. Adding memory later will probably cost more, and many laptops have soldered memory that cannot be upgraded.
3. **Upgrade rather than replace** when you can: a module or an SSD in a machine with a free slot costs less than a new PC. Check the exact reference (DDR4 or DDR5, speed, form factor) before ordering.
4. **Extend the life of your fleet**: an SSD instead of a hard drive and a cleaned-up startup often give a machine several more years. Watch out for PCs that cannot move to Windows 11, though: see [Windows 10 End of Support: Planning the Move to Windows 11](/en/blog/windows-10-end-of-support-upgrade-to-windows-11/).
5. **Do not overbuy to stockpile**: buying modules "just in case" ties up money on a forecast that can turn. Buy for an identified need.
6. **For a fleet**, ask for short-validity quotes and compare the full configuration. Plan replacements in batches rather than in a rush.
7. **Beware of prices that look too good** for RAM and SSDs sold online: shortages attract counterfeits (fake capacity, recycled chips). Buy from an identifiable reseller.

To check the installed memory on a Windows PC, `Get-CimInstance Win32_PhysicalMemory` gives the reference of each module. The [unit converter](/en/tools/unit-converter/) helps compare GB and GiB in spec sheets.

## Key points

- Memory is going to AI: HBM and servers come before PCs.
- Samsung and the analysts expect no easing before the end of 2027; these are forecasts, not certainties.
- Buy for a real need, with enough memory to last, and extend what can be extended.

## Sources

- [CNBC, 29 October 2026: Samsung Electronics third-quarter results](https://www.cnbc.com/2026/10/29/samsung-electronics-third-quarter-earnings.html)
- [TrendForce, 29 October 2026: Samsung on HBM4 sales, DRAM and NAND prices](https://www.trendforce.com/news/2026/10/29/news-samsung-says-hbm-share-matches-dram-standing-as-hbm4-sales-triple-ds-margin-hits-72-10-lta-clients-signed)
- [TrendForce, 30 September 2026: 4Q26 memory price forecast](https://www.trendforce.com/presscenter/news/20260930-13258.html)
- [IDC, 2 June 2026: the PC market and the memory shortage](https://www.idc.com/resource-center/blog/pc-market-enters-volatile-territory-as-memory-shortage-persists-through-2027/)
