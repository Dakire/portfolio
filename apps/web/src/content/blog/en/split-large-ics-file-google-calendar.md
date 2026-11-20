---
title: 'Split an ICS file that is too big for Google Calendar'
seoTitle: 'Split an ICS File That Is Too Big to Import'
description: 'Why an .ics file is refused on import, how to split it without breaking recurring series, and which method to pick for each case.'
summary: 'A calendar .ics export refused on import: the likely cause, how to split it without separating a series from its exceptions, and how to choose between event count, size, year or month.'
date: 2026-11-20
translationOf: 'decouper-fichier-ics-trop-gros-google-agenda'
category: messagerie
tags: ['Calendar', 'ICS', 'Google Calendar', 'Import', 'iCalendar']
---

A calendar export holds years of events, and the import fails. The file is an `.ics` (iCalendar), plain text, so you can split it as long as you cut in the right place.

## Why the import is refused

According to Google Calendar's help page on import problems, the file must not exceed 1 MB. That help page is several years old: check the current limit on [Google's help](https://support.google.com/calendar/answer/45654) before you decide what to do. The help suggests two fixes: export a shorter date range from the original application, or split the file into several smaller ones.

I do not know of an equivalent documented limit for other calendars: if the import fails elsewhere, the error message remains your best lead.

## Where to cut an ICS file

An `.ics` file contains a calendar (`VCALENDAR`) wrapping a series of events (`VEVENT`). You only cut between two events, never in the middle, and every file must stay a complete calendar with its header and footer.

One case needs care: recurring events. A series (`RRULE`) and its exceptions (a moved or cancelled occurrence, marked by `RECURRENCE-ID`) share the same identifier (`UID`), defined by [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545). If the series goes into one file and its exceptions into another, the destination calendar treats them as separate events. A series and its exceptions must therefore stay in the same file.

## Which method to choose

My [ICS file splitter](/en/tools/ics-splitter/) keeps series whole and offers six ways to split:

- **By size**, when the import enforces a limit: you set the maximum size per file. An event larger than the limit gets its own file.
- **By number of events**, for even batches.
- **By year**, to archive or import one period at a time.
- **By month**, when a year is still too heavy.
- **One event per file**, to isolate specific events.
- **By calendar**, when the file holds several calendars joined end to end.

The file is read and split in your browser: it stays on your computer.

## Importing the pieces

Each file is imported separately. In Google Calendar, import is done from the web version on a computer, in the settings. If the export is a ZIP archive, extract the `.ics` files first: one per calendar.

Before importing, choose the destination calendar carefully. To find the events of a source calendar that are missing from a destination calendar, there is the [ICS comparison tool](/en/tools/ics-compare/).

## What to do, in order

1. Export a shorter date range if the original application allows it.
2. Otherwise, split by size, leaving a margin under the import limit.
3. Import the files one by one, then count the events in the destination calendar.
