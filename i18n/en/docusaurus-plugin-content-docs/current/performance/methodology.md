---
sidebar_position: 1
title: How we measure speed
description: What the Layero performance audit measures — Core Web Vitals, Lighthouse and Coach, how to read the metrics and what the final score is built from.
---

# How we measure speed

The performance audit opens your site in a real browser, several times in a
row, in a stable network and device profile — and records **what the user
saw and when**. From that recording we build the speed metrics, the loading
screenshots (filmstrip) and the list of every network request (waterfall).

Each run is repeated several times, and the report shows the **median** — so
one-off spikes (a backgrounded tab, a stray GC pause) don't skew the picture.

## Why these metrics matter

Speed isn't a "nice to have" — it directly affects the business:

- **Bounce rate.** The slower a page loads, the more people leave before it
  finishes. Every extra second costs conversions.
- **Search.** Core Web Vitals are an official Google ranking factor. A slow
  site indexes worse and ranks lower.
- **Trust.** Shifting layout and frozen clicks read as "the site is broken,"
  even when everything technically works.

That's why the overview gives a verdict up front — *fast / could be better /
has problems* — and the metrics below break it down.

## Colors and zones

Every metric has three zones, based on Google's thresholds:

| Color | Zone | Meaning |
|---|---|---|
| 🟢 Green | good | within norm, nothing to do |
| 🟡 Yellow | could be better | acceptable, but there's headroom |
| 🔴 Red | poor | the user notices this, worth fixing |

## Headline scores

These are the "single-number" scores (0–100) — a good place to start.

### Lighthouse

Google's auditor — the same "canonical" score you see in PageSpeed Insights
and Search Console. We run Lighthouse in the same profile as the other
metrics and show four categories:

- **Performance** — load speed;
- **Accessibility** — usability for people with impairments (contrast, alt, ARIA);
- **Best practices** — modern web practices (HTTPS, security, correct APIs);
- **SEO** — basic search optimization (meta tags, indexability, mobile-friendliness).

### Coach

The audit engine's built-in analyst. It checks the page against a set of best
practices and scores 0–100 in three categories:

- **Performance** — render-blocking resources, caching, compression, asset size;
- **Best practice** — correct markup and headers;
- **Privacy** — third-party trackers and data sharing.

Coach complements Lighthouse: it doesn't just assign a score, it lists the
**specific issues** by priority — what to fix first.

## Core Web Vitals

Google's key metrics — how a real user **perceives** the load.

- **LCP** (Largest Contentful Paint) — when the largest visible element (the
  hero image or heading) rendered. Good ≤ 2.5 s.
- **CLS** (Cumulative Layout Shift) — how much the layout "jumps" during
  load. 0 is ideal, good ≤ 0.1.
- **TBT** (Total Blocking Time) — total time the page couldn't respond to
  clicks because the main thread was busy. Good ≤ 200 ms. This is the lab
  proxy for INP/FID.

## Detailed loading metrics

When the verdict isn't enough and you need to see *where* the time goes:

- **TTFB** (Time to First Byte) — from request to the server's first response
  byte. Depends on the backend and network. Good ≤ 0.8 s.
- **FCP** (First Contentful Paint) — when the first content (text or image)
  appeared on screen. Good ≤ 1.8 s.
- **Speed Index** — how quickly the visible area fills in. Lower is better.
- **Requests and weight** — how many resources and bytes the page loaded.
  Fewer and lighter means faster.

## Assets and waterfall

- **Assets** — a breakdown of every resource: by content type, by domain,
  the heaviest files and the response codes. Click a response-code bar to see
  exactly which requests returned it.
- **Waterfall** — a timeline of every network request: when each started,
  the connection phases (DNS, TLS, wait, download) and long CPU tasks. Hover a
  request bar to see its timings.

## Where the data comes from

All metrics are captured on the deployed site at its real public address —
exactly what your visitors see. You can start a new audit any time from the
project's "Performance" tab.
