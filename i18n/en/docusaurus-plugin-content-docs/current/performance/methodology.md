---
sidebar_position: 1
title: How we measure speed
description: How the Layero performance audit works — where and how the page is opened, which metrics we collect, how the Lighthouse score is calculated, how runs are compared and why the numbers differ from PageSpeed Insights.
---

# How we measure speed

The performance audit answers one question: **how fast does your site load
for a visitor in Russia**. To answer it honestly, we open the page in a real
browser, in a data center in Russia, on the published version of your site —
and record what appeared on screen and when.

This page explains how a run works, what every number in the report means and
when two runs of the same page can be compared.

:::tip[In short]

- The headline number is the **Lighthouse score**, from 0 to 100. It is built
  from five loading metrics with the same formula PageSpeed Insights uses.
- The page is opened **in Russia**, so the network is the one your audience
  has. PageSpeed Insights opens it from data centers abroad.
- Every run loads the page **several times**; the report shows the median
  of each metric.
- We only say "got worse" when the difference is **larger than the noise**.

:::

## How a run works

1. **You pick a branch, a page and a device.** The run opens whatever is
   published on the branch right now, at its public address. You can enter a
   path (`/pricing?sort=price`) or a full address, including one on a
   connected domain.
2. **The browser loads the page several times.** We use Chrome and repeat the
   load so a one-off delay in a single pass doesn't skew the result. During
   the passes we record a video of the load, every network request and the
   main-thread activity.
3. **Lighthouse checks the page separately.** It scores four categories and
   lists what is worth fixing.
4. **We build the report.** Each metric is the median across the passes; the
   score and recommendations come from Lighthouse. A run usually takes under
   two minutes.

If you order the same page on the same deploy and device within 10 minutes,
no new run starts: the code hasn't changed, and new numbers would differ only
by noise. We show the finished run instead. If needed, start a fresh one
manually.

### Devices

| | Desktop | Phone |
|---|---|---|
| Screen | wide, like a laptop | a mid-range smartphone |
| Network | no artificial throttling | a slow mobile network |
| Lighthouse profile | desktop | mobile |

The device sets the profile for the **whole** report: the browser passes and
Lighthouse run under the same conditions. That's why phone and desktop runs
are never compared with each other — they are two separate series.

## The Lighthouse score

The Lighthouse score is a weighted sum of five lab metrics. Each metric is
first mapped to a 0–100 score on a curve built from real-world sites, then
multiplied by its weight:

| Metric | Weight |
|---|---|
| Total Blocking Time (TBT) | 30% |
| Largest Contentful Paint (LCP) | 25% |
| Cumulative Layout Shift (CLS) | 25% |
| First Contentful Paint (FCP) | 10% |
| Speed Index (SI) | 10% |

| Score | Meaning |
|---|---|
| 90–100 | good |
| 50–89 | needs improvement |
| 0–49 | poor |

The practical takeaway: **TBT, LCP and CLS move the score the most**.
Speeding up FCP by half a second helps, but the score grows less than from
the same gain in TBT.

Besides Performance, Lighthouse scores Accessibility, Best Practices and SEO —
they are on the report's "Lighthouse" tab but don't count toward the headline
score.

## Metrics

The thresholds are Google's: within "good" a visitor doesn't notice a
problem, in "poor" they almost certainly do.

| Metric | What it measures | Good | Poor |
|---|---|---|---|
| **LCP** — Largest Contentful Paint | when the largest element of the first screen rendered: the hero image or headline | up to 2.5 s | over 4 s |
| **CLS** — Cumulative Layout Shift | how much the layout moves while loading | up to 0.1 | over 0.25 |
| **TBT** — Total Blocking Time | how long the page couldn't respond to clicks because the main thread was busy | up to 200 ms | over 600 ms |
| **FCP** — First Contentful Paint | when the first text or image appeared | up to 1.8 s | over 3 s |
| **TTFB** — Time to First Byte | time from the request to the first byte of the server's response | up to 0.8 s | over 1.8 s |
| **SI** — Speed Index | how quickly the visible part of the screen fills in | up to 3.4 s on phone, 1.3 s on desktop | over 5.8 s and 2.3 s |

TBT is the lab stand-in for INP (Interaction to Next Paint, the delay in
responding to a visitor's action). Real responsiveness can only be measured on
live visitors, while TBT shows how long the main thread was busy and couldn't
have answered a click.

## What else is in the report

- **What to fix first** — the three Lighthouse recommendations with the
  largest expected gain in seconds.
- **Load video** — screen frames over time with event marks: first paint,
  main content, visually complete.
- **Waterfall** — every network request on a timeline, with connection
  phases and long main-thread tasks. This is where you see which file holds up
  everything else.
- **Page composition** and **third-party services** — weight by file type
  and domain, plus counters, widgets and other external scripts.
- **Advice** — detailed best-practice checks: caching, compression,
  render-blocking resources, privacy.
- **HAR** — the full request log, which opens in the browser's developer
  tools.

## Why the numbers differ from PageSpeed Insights

The score uses the same formula, but the conditions are different — on
purpose.

- **Location.** PageSpeed Insights loads the page from Google's data centers
  abroad. We load it from Russia: latency to Russian and foreign servers is
  the same as your audience's.
- **Lab, not live visitors.** PageSpeed Insights also shows Chrome field
  data — real visits over 28 days. Our audit is a lab test: one page, a known
  device, a known network. In exchange you can repeat it at any moment and
  compare it with the previous deploy.
- **Variance.** Even on the same code the score moves by a few points from
  run to run. One run gives you a pointer; draw conclusions from the trend
  over several.

## How we compare runs

The report and the run list compare a run with the previous run of **the
same page, on the same device, on the same branch, but on the previous
deploy**. Comparing two runs of one deploy is pointless: the difference
between them is just noise.

- **Got worse** — the score dropped by 3 points or more, or the main content
  (LCP) started appearing one and a half times slower.
- **Got better** — the score rose by 3 points or more.
- **No change** — the difference is smaller: within measurement noise.

We refine the threshold with repeated runs of the same pages, so it may shift
slightly over time.

:::note[Run under load]

If our server was busy with other work during the run, the numbers may have
come out worse than they really are. Such a run is marked and left out of
comparisons. You can repeat it for free — the retry doesn't count toward the
monthly limit.

:::

## Schedule

A page can be measured on a schedule: every 3 or 6 hours, daily or weekly.
Daily and weekly runs happen at night Moscow time — the server is idle then
and the numbers are more accurate. Every run measures whatever is published on
the branch at that moment. Runs from one schedule are grouped under its name
in the run list, so you can see how speed changed from deploy to deploy.

## Limits

- The audit is available on the Pro plan. The limit is 500 runs a month per
  organization, manual and scheduled combined; it resets on the 1st.
- You can only measure addresses of your own project: branch addresses, the
  project address and domains connected to it.
- The audit measures a single page load without signing in. Actions after the
  load — clicks, navigation, forms — are not part of the run.
