---
sidebar_position: 3
title: Usage and limits
description: What the Usage page counts, how the billing period works, the Free and Pro limits, what happens when a limit runs out, and what to do if usage grows.
---

# Usage and limits

:::caution[Draft]
This is a draft of the pricing grid. Limits and overage prices are **not yet
enforced in production**: the Usage page shows them, but nothing is capped or
charged. The numbers and rules may change before they take effect — we will
announce that in advance.
:::

The **Usage** page in the dashboard shows how much of each resource the
organization has used in the current billing period and how much is left
before the plan limit. How to pay for usage above the limit on Pro is
covered in [Overage billing](./overage).

## In short

- Limits are counted **per organization**: each organization has its own.
- On Pro the period is counted from the subscription payment date; on
  Free — from the day the organization was created.
- Numbers update every hour and become final after about a day.
- On Free a limit is hard: you cannot pay for usage above it. On Pro you
  can pay for usage above the limit if you turn on
  [overage billing](./overage); it is off by default.

## Where to look

**Dashboard → organization → Usage.** For each metric you see:

- how much has been used since the start of the period and how much is left;
- a chart by day;
- which projects use the most — the "By project" table;
- the date when the period ends and the counters reset.

## Billing period

The period is the window in which usage accumulates. Counters reset at the
start of each new period.

| Plan | Period | When a new one starts |
|---|---|---|
| Pro, monthly | 30 days from payment | on the subscription renewal day |
| Pro, yearly | monthly slices from the yearly payment date | every month on the same day |
| Pro free trial | the whole trial, 14 days | when the trial ends |
| Free | a month from the day the organization was created | every month on the same day |

Example for monthly Pro: paid on 14 September — the period runs from
14 September to 13 October, the next one from 14 October to 12 November.

Monthly slices of yearly Pro and Free periods are tied to the day of the
month. If a month has no such day, the new period starts on the last day
of that month, and a month later — from the original day again. For example, an organization
created on 31 January has periods from 31 January to 27 February, from
28 February to 30 March, and then from 31 March again.

Days are counted in UTC: a new period starts at 03:00 Moscow time.

The plan applies to the whole account, so all organizations of an owner
on Pro share one period — it is counted from the owner's subscription.
Limits are still separate for each organization.

## How the numbers update

- Every hour the platform rolls up usage for yesterday and today.
- Traffic and requests arrive with a delay of up to 15 minutes, app run
  time — up to a minute.
- A day becomes final 26 hours after it ends: after that its numbers no
  longer change. Overage money is counted only from final days.

So on the last day of a period and the day after, the number on the page
may still grow a little — that is the last data arriving.

## What is counted

### Build minutes

Time from start to finish of every build: from the repository, from the
CLI, from the dashboard and from a deploy hook. A build belongs to the day
it was started.

- Minutes of builds that failed with an error count neither towards the
  limit nor towards overage.
- Cancelled builds, including ones superseded by a newer push, are counted
  for now. This rule is still being settled.

### Builds

How many builds were started in the period. Limited on Free only.

### Files

How many files all deploys of the organization stored in the period:
production, previews and CLI. The webp copies of images that the platform
makes are not counted.

Example: a site of 3,000 files deployed 20 times a month is 60,000 files.
That is over the Free limit and within Pro.

There is also a limit on the size of a single deploy: if it has more than
10,000 files on Free or 100,000 on Pro, it is rejected as a whole.

### Outbound traffic

Bytes that the organization's sites and apps sent to visitors. 1 GB is
1,073,741,824 bytes. WebSocket traffic is not counted yet.

### Requests to sites

All HTTP requests through the platform: pages, images, scripts, styles,
requests to server apps, including ones from bots. Opening a page with 30
images and scripts is 31 requests.

### App memory and CPU

Counted only while the app is awake, per minute and by actual use rather
than by the allocated limit.

- **Memory** — how much memory the app actually used, times the minutes it
  ran. The total is in GB·minutes.
- **CPU** — the share of a core in use, times the minutes it ran. The total
  is in minutes.

Example: an app uses 300 MB and runs 4 hours a day. Over a month that is
about 0.29 GB × 240 minutes × 30 days ≈ 2,100 GB·min: over the Free limit,
within Pro.

An app with no requests goes to sleep and stops using memory and CPU.
Memory and CPU are counted from 27 September 2026.

### Not included

- **Databases** — billed separately, see [Databases](../database/create).
- **Data API and domains** — not limited.
- **Build storage** — free.

## Limits

| Metric | Free | Pro | Above the limit on Pro |
|---|---|---|---|
| Builds per period | 100 | unlimited | — |
| Build minutes | 300 | 1,000 | 1 ₽ per minute |
| Files per deploy | 10,000 | 100,000 | the deploy is rejected |
| Files per period | 50,000 | 500,000 | 1.5 ₽ per 1,000 |
| Outbound traffic | 15 GB | 100 GB | 8 ₽ per GB |
| Requests to sites | 300 k | 3 M | 130 ₽ per million |
| App memory | 1,500 GB·min | 12,000 GB·min | 0.05 ₽ per GB·min |
| App CPU | 360 min | 3,000 min | 0.13 ₽ per minute |

Each organization has its own limits. If you are on Pro and have three
organizations, each of them gets 1,000 build minutes.

## What happens when a limit runs out

### Pro

Sites and apps keep working, and traffic is never cut off. The rest depends
on whether [overage billing](./overage) is on:

- **off** (the default) — once build minutes or files for the period run
  out, new builds do not start until the next period, and a deploy that
  would go over the files limit is rejected. Traffic, requests, memory and
  CPU are not limited;
- **on** — everything keeps working, and usage above the limit is paid at
  the prices from the table, up to the cap you set.

### Free

There is no paid overage. When a limit runs out:

- **builds and build minutes** — new builds do not start until the next
  period;
- **files** — a deploy that would go over the limit is rejected;
- **traffic and requests** — sites keep responding; if the limit is
  exceeded many times over, we will contact you;
- **memory and CPU** — apps go to sleep until the next period.

## What to do if usage grows

1. Open the "By project" table on the Usage page: it shows which project
   uses up the limit.
2. If the growth is expected and you are on Free, move to Pro. On Pro you can turn on
   [overage billing](./overage) so that builds do not stop at the limit.
3. If the usage is unexpected, the cause is usually one of these:
   - **many builds** — preview branches built on every push; limit which
     branches are built in the project settings;
   - **many files** — the build puts sources, `node_modules` or thousands
     of pages into its output; check the build output folder;
   - **traffic** — the build output folder has heavy images or video;
   - **requests** — bots and monitoring that poll the site every minute;
   - **app memory** — the app never sleeps because external monitoring or
     a cron job keeps waking it up.
4. Still unclear — write to support and include a link to the project.
