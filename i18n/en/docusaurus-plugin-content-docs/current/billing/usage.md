---
sidebar_position: 3
title: Usage and limits
description: What the Usage page counts, the Free and Pro limits and when they take effect, how the billing period works, and what happens when a limit runs out.
---

# Usage and limits

:::info[When the limits take effect]
- **Free** — from December 1, 2026.
- **Pro** — from the first subscription renewal on or after December 16,
  2026. For example, if Pro renews on the 5th, the limits take effect on
  January 5.

Until then, the Usage page shows your usage for reference only: you can go
over the limits, and nothing is capped or charged. The card at the top of
the page shows the exact date for your organization.
:::

The **Usage** page in the dashboard shows how much of each resource the
organization has used in the current billing period and how much the plan
includes. How to keep working above the limits on Pro is covered in
[Extra usage](./overage).

## In short

- Limits are counted **per organization**: each organization has its own.
- On Pro the period runs from one subscription renewal to the next; on
  Free it is the calendar month.
- At 80 % of a limit you get an email; at 100 % nothing new starts, and
  whatever is already running keeps running.
- On Free the limit is hard. On Pro you can keep going above the limit,
  paid from the balance, if you turn on [extra usage](./overage).

## Where to look

**Dashboard → organization → Usage.** For each metric you can see:

- how much has been used since the start of the period and how much the
  plan includes;
- the price above the limit (on Pro);
- day-by-day usage — click a row to open its chart;
- which projects use the most;
- when the period ends and the counters reset.

## Limits

| Metric | Free | Pro | Above the limit, Pro only |
|---|---|---|---|
| Builds | 100 | 1,000 | 1 ₽ per build |
| Apps | 50 GB·h | 400 GB·h | 2 ₽ per GB·h |
| Traffic | 15 GB | 100 GB | 8 ₽ per GB |
| Site requests | 300 k | 5 M | 100 ₽ per 1 M |
| Data API calls | 1 M, in beta | 10 M | 20 ₽ per 1 M |
| File storage | 1 GB, in beta | 10 GB, 100 GB at most in total | 10 ₽ per GB |
| Speed runs | 3 | 500 | 10 ₽ per pack of 10 runs |

Limits are per organization per billing period. If you have Pro and three
organizations, each gets 1,000 builds.

## Billing period

The period is the window in which usage accumulates. It is the same for
all metrics of an organization. When a new period starts, the counters
reset and any restrictions are lifted.

| Plan | Period | When a new one starts |
|---|---|---|
| Pro, monthly | from one renewal to the next | on the renewal day, at 00:00 UTC |
| Pro, yearly | monthly slices from the payment date | every month on the same day |
| Free | calendar month | on the 1st, at 00:00 Moscow time |

Example for monthly Pro: the subscription renews on the 5th — the periods
run from November 5 to December 4, from December 5 to January 4, and so on.

## What is counted

### Builds

Builds that finished successfully or failed because of the project's code
or settings. Canceled builds, builds that failed through our fault and
retries started by the platform itself don't count. Build length doesn't
matter.

### Apps

Counted in **GB·h**: the time the app is awake × the memory of its
configuration. CPU is not counted separately. Usage is metered by the
minute.

| Configuration | Per hour awake |
|---|---|
| 0.25 vCPU · 256 MB | 0.25 GB·h |
| 1 vCPU · 1 GB (Pro only) | 1 GB·h |

An app goes to sleep after 15 minutes without requests, and sleep time is
not counted. A Pro reference point: 400 GB·h is 400 hours of an app with
1 GB or 1,600 hours with 256 MB.

Example: an app with 1 GB is awake 4 hours a day. Over a month that's
4 × 30 = 120 GB·h — above the Free limit, within Pro. The same app with
256 MB uses 30 GB·h.

### Traffic

Everything the organization's sites and apps served, including Data API
responses and file downloads from storage. 1 GB is 1,073,741,824 bytes.

### Site requests

Every HTTP request to the organization's sites: pages, images, scripts,
styles, requests to server apps, including from bots. A page with 30
images and scripts is 31 requests.

### Data API calls

How many times sites and apps called the organization's databases through
the [Data API](../data-api/index.md), counted across all databases. Calls
that failed through our fault (5xx) and limit refusals (429) don't count.

### File storage

How much space files in Data API storage take up **on average over the
month**. We measure the space every hour: 5 GB kept for half a month is
2.5 GB. The count is shared across all of the organization's databases.

### Speed runs

Full [Page Speed](../performance/index.md) runs, manual and scheduled. A
rerun after a failure on our side doesn't count. Above the limit on Pro,
runs are sold in packs of 10: the first run above 500 opens a pack for
10 ₽, valid until the end of the period.

### What is not included

- **Databases** are billed separately, see
  [Databases](../database/create). Only Data API calls and file storage
  count toward the limits.
- **Domains** are unlimited.
- **Build minutes** are shown for reference, with no limit or price.

## Limits you can't buy more of

| Limit | Free | Pro | At the limit |
|---|---|---|---|
| Build retention | last 3 deploys per environment | 10 | older ones are deleted; rollback works within this number |
| Files in one deploy | 10,000 | 100,000 | the deploy is rejected as a whole |
| Size of one file in storage | 50 MB | 50 MB | the upload is rejected |

## What happens when a limit runs out

The general rule: **nothing new starts, and what's running is left alone.**

| When | Free | Pro, extra usage off | Pro, extra usage on |
|---|---|---|---|
| **80 % of a limit** | email and a banner on the Usage page, an offer to upgrade to Pro | email and a banner, an offer to turn on extra usage | email and a banner |
| **100 % of a limit** | restrictions from the table below | restrictions from the table below | everything keeps working; usage above the limit is charged to the balance every hour |
| **Extra usage budget used up** | — | — | restrictions from the table below |
| **No money on the balance** | — | — | restrictions from the table below |

Restrictions by metric:

| Metric | What happens |
|---|---|
| Builds | a new build is rejected with a reason; a running one finishes |
| Apps | a running app keeps running; a sleeping app doesn't wake up — visitors see an "app paused" page |
| Traffic, site requests | for one day sites respond heavily throttled, then visitors see a "site temporarily unavailable" page |
| Data API calls | 429 until the new period; direct database connections keep working |
| File storage | new uploads are rejected, existing files are served |
| Speed runs | new runs are rejected, schedules are paused |

**Restrictions are lifted right away** — after upgrading to Pro, turning
on extra usage, raising the budget or topping up the balance, without
waiting for a new period. With a new period they are lifted on their own.

A refusal is shown as text: the deploy stays in the list with the
"refused" status and a reason, and the CLI and dashboard show it. Nothing
already published disappears.

## What to do if usage grows

1. Open the metric's row on the Usage page and switch to "By project": it
   shows which project is using up the limit.
2. If the growth is expected and you are on Free, upgrade to Pro. On Pro,
   turn on [extra usage](./overage) so work doesn't stop at the limit.
3. If the growth is unexpected, check the usual causes:
   - **Many builds.** Every push to a preview branch starts a build: keep
     only the branches you need in the project settings.
   - **Traffic.** The build output contains heavy images or videos.
   - **Requests.** Bots and monitoring poll the site every minute.
   - **Apps.** The app never sleeps: an external monitor or cron keeps
     waking it up.
4. Still unclear — write to support and include a link to the project.
