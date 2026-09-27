---
sidebar_position: 3
title: Usage and limits
description: What the Usage page counts, the Free and Pro limits, what happens when you go over, and what to do about it.
---

# Usage and limits

:::caution Draft
This is a draft of the pricing grid. Limits and overage prices are **not yet
enforced in production**: the Usage page shows them, but nothing is capped or
charged. The numbers may change before they take effect — we will announce
that in advance.
:::

The **Usage** page in the dashboard shows how much of each resource the
organization has used in the current billing period, and how much is left
before the plan limit.

The billing period is one month from the subscription payment date. On Free
it is a calendar month. Counters reset at the start of each period.

## What is counted

| Metric | How it is counted |
|---|---|
| Build minutes | Time from start to finish of every build: from the repository, from the CLI, from the dashboard. Failed builds count too |
| Files written | How many site files all deploys saved during the period — production, previews and CLI. WebP copies of images made by the platform are not counted |
| Outbound traffic | Bytes your sites served to visitors |
| Requests | All HTTP requests to the organization's sites, including server apps and bots |
| App memory | Per minute: every minute an app is awake × the memory it occupied. Total in GB·minutes |
| CPU | Per minute: every minute an app is awake × the share of a core it used. Total in minutes |

Databases are outside the plan limits — they are billed separately by the
provider. Data API, domains and the number of builds are unlimited.

## Limits

| Metric | Free | Pro | Over the limit |
|---|---|---|---|
| Build minutes | 300 | 1,000 | ₽1 per minute |
| Files per deploy | 10,000 | 100,000 | deploy is rejected |
| Files per period | 50,000 | 500,000 | ₽1.5 per 1,000 |
| Outbound traffic | 15 GB | 100 GB | ₽8 per GB |
| Requests | 300k | 3M | ₽130 per million |
| App memory | 1,500 GB·min | 12,000 GB·min | ₽0.05 per GB·min |
| CPU | 360 min | 3,000 min | ₽0.13 per minute |

## What happens when you go over

**Pro.** Sites and apps keep running. Everything over the limit is priced
per the table and charged together with the next subscription payment. The
projected amount is shown on the Usage page under "Over the limit".

**Free.** There is no paid overage. When a limit is exhausted:
- builds — new builds do not start until the next period;
- files — a deploy that would exceed the limit is rejected;
- traffic and requests — sites keep responding; on repeated large overruns we
  will contact you;
- memory and CPU — apps are put to sleep until the next period.

## What to do

1. Open the "By project" table on the Usage page — it shows which project is
   consuming the limit.
2. If the growth is expected, upgrade to Pro, or stay on Pro and pay for the
   overage per the table above. Nothing needs to be switched on.
3. If the usage is unexpected, the cause is usually one of:
   - **many builds** — preview branches on every push; limit which branches
     are built in the project settings;
   - **many files** — the build output includes sources, `node_modules` or
     thousands of pages; check the output directory;
   - **traffic** — heavy images or video in the build output;
   - **app memory** — the app never sleeps because an external monitor or a
     cron job keeps waking it.
4. Still unclear — write to support and attach a link to the project.
