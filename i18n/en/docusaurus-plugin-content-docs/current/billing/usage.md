---
sidebar_position: 3
title: Usage and limits
description: What the Usage page counts, how the billing period works, the Free and Pro limits, what happens when a limit runs out, and what to do if usage grows.
---

# Usage and limits

:::caution[Pilot]
Usage restrictions are being introduced only for the `valya` organization.
For other organizations, the new usage limits are displayed without
enforcement; existing plan restrictions remain in place. Overage billing is
unavailable, and no overage charges are made.
:::

The **Usage** page in the dashboard shows how much of each resource the
organization has used in the current billing period and how much is left
before the plan limit. Planned billing for usage above the limit on Pro is
covered in [Overage billing](./overage).

## In short

- Limits are counted **per organization**: each organization has its own.
- On Pro the period is counted from the subscription payment date; on
  Free — from the day the organization was created.
- Charts update hourly. Restriction decisions use fresher facts, although
  traffic and request counts arrive with a delay.
- Extra usage and overage charges are not available yet, including on Pro.

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
- Traffic and requests arrive with a delay of up to 20 minutes, app run
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

- Minutes of failed builds count towards the limit if the build already used
  resources. Overage billing rules will be published separately.
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

### App run minutes

Counted by the minute while an app is awake. An app with no requests goes
to sleep and stops using run minutes. Each minute is multiplied by the
configuration factor relative to 0.25 vCPU and 256 MB: ×1 for the base
configuration, ×4 for 1 vCPU and 1 GB. Actual memory and CPU use remain
visible in charts but are not separate usage limits.

### Not included

- **Databases** — billed separately, see [Databases](../database/create).
- **Data API and domains** — not limited.
- **Build storage** — free.

## Limits

| Metric | Free | Pro | Planned rule above the Pro limit |
|---|---|---|---|
| Builds per period | 100 | unlimited | — |
| Build minutes | 300 | 1,000 | 1 ₽ per minute |
| Files per deploy | 10,000 | 100,000 | the deploy is rejected |
| Files per period | 50,000 | 500,000 | 1.5 ₽ per 1,000 |
| Outbound traffic | 15 GB | 100 GB | 8 ₽ per GB |
| Requests to sites | 300 k | 3 M | 130 ₽ per million |
| App run minutes (× configuration factor) | 6,000 min | 48,000 min | 0.02 ₽ per minute |

Each organization has its own limits. If you are on Pro and have three
organizations, each of them gets 1,000 build minutes.

## What happens when a limit runs out

In the `valya` pilot, the owner receives one email and a warning on the
Projects page at **90%**. The warning names the metric and estimates when
the limit will be reached. If there is too little data, no time is invented.

At **100%**, the action depends on the metric:

| Metric | Action |
|---|---|
| Build minutes | New builds and builds already in progress stop; published sites remain available. |
| Files per period | A deploy cannot start saving files if it would exceed the quota. |
| Outbound traffic or requests | Access to the organization's projects is suspended. |
| App run minutes | New starts and wakeups are denied; an already running app keeps responding. |

Restrictions lift in a new period or after upgrading to a plan with enough
quota. The app run minute start restriction requires a complete, verified
measurement period before it can be enabled.

What "rejected" means: the deploy stays in the list with a "refused" status
and a reason, the repository webhook gets the same refusal, and the CLI and
dashboard show it as text. Nothing already published disappears.

Extra usage with a monetary cap will follow a separate billing review.
It is unavailable for now.

## What to do if usage grows

1. Open the "By project" table on the Usage page: it shows which project
   uses up the limit.
2. If the growth is expected and you are on Free, move to Pro. Extra usage
   is not yet available on Pro.
3. If the usage is unexpected, the cause is usually one of these:
   - **many builds** — preview branches built on every push; limit which
     branches are built in the project settings;
   - **many files** — the build puts sources, `node_modules` or thousands
     of pages into its output; check the build output folder;
   - **traffic** — the build output folder has heavy images or video;
   - **requests** — bots and monitoring that poll the site every minute;
   - **app run minutes** — the app never sleeps because external monitoring or
     a cron job keeps waking it up.
4. Still unclear — write to support and include a link to the project.
