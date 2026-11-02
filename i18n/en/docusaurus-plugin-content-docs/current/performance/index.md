---
sidebar_position: 0
title: Page Speed
description: Page Speed in Layero measures page load speed in a real browser. What we measure, under which conditions, how to read the report and the "got worse" verdict, schedules, Telegram notifications, CLI and plan.
---

# Page Speed

**Page Speed measures how fast a page of your site loads and shows what slows
it down.** The page is opened in a real browser on the published version of
the site. The report has the main load metrics, a frame-by-frame video, a
request waterfall and recommendations on what to fix.

The section is in the [dashboard](https://app.layero.ru/pagespeed) menu, in
the "Services" group.

:::info[Plan]

Page Speed is available on both plans. **Free** gives 3 runs a month,
**Pro** gives 500 runs a month and scheduled runs. The limit is shared by the
organization and resets on the 1st.

:::

## What we measure

One run is two passes of the page in Chrome plus a separate Lighthouse check.
During the passes we record a video of the load, every network request and
the main thread's work. Each metric is the median of the passes.

| Metric | What it means | Good |
|---|---|---|
| **LCP** | when the main block of the first screen appeared | up to 2.5 s |
| **TBT** | how long the page didn't respond to taps | up to 200 ms |
| **CLS** | how much the layout jumps while loading | up to 0.1 |
| **FCP** | when anything appeared on screen | up to 1.8 s |
| **SI** | how fast the visible part of the screen fills in | up to 3.4 s on a phone |

The thresholds are Google's. Each metric and the score formula are explained
in [How we measure speed](./methodology.md).

## Under which conditions

The device sets the conditions of the whole run: the video and Lighthouse run
under the same ones. That's why phone and desktop runs aren't compared.

| | Phone | Desktop |
|---|---|---|
| Internet | 37 / 8 Mbit/s | 90 / 90 Mbit/s |
| Latency | 50 ms | 20 ms |
| CPU | 2× slower | no slowdown |

The conditions are printed in every report. PageSpeed Insights uses a slower
profile, so its score is usually lower.

## How to run a measurement

1. Open **Page Speed** and click **Measure speed**.
2. Pick a project and a branch. You can change the address: a path
   (`/pricing?sort=price`) or a domain connected to the project.
3. Pick a device and click **Measure**.

The report is ready in about two minutes; the progress is shown right in the
run list. If the same page on the same deploy and device was measured in the
last 10 minutes, the dashboard shows that run. To measure again, click the re-run button in the report.

## What's in the report

- **Main metrics**, each with a green, yellow and red scale.
- **What to fix first** — the three Lighthouse suggestions that save the most
  time.
- **Metrics** — every metric of the passes: min, median, mean, max.
- **Load video** — screen frames over time, marked with the first paint, the
  main block and visual readiness. The timeline can be scrubbed.
- **Waterfall** — every request on a timeline, with the main thread's long
  tasks. You can see which file holds up the rest.
- **Resources** — page weight by file type and the heaviest files.
- **Recommendations** — Lighthouse checks (performance, accessibility, best
  practices, SEO) and Coach checks (performance, best practices, privacy).
  Lighthouse suggestions show the expected savings; Coach suggestions list the
  files they're about.

The report can be copied for an AI assistant with **Copy for AI**, and the
full request log can be downloaded as HAR.

## How to read the verdict

A run is compared with the previous scheduled run that has the same page,
device and branch but a different deploy. One-off runs don't move
the baseline, so a "just in case" check won't spoil the comparison.

| Verdict | When |
|---|---|
| **Got worse** | the score dropped by 10 points or more **or** the main block (LCP) appeared 1.5 times later and at least 500 ms later |
| **Got better** | the score rose by 10 points or more |
| **No change** | the difference is smaller, within measurement noise |
| **Nothing to compare** | there's no previous run, or it was made under different conditions |

The 10-point threshold comes from repeated runs of the same pages. On one
deploy the score of a simple page varied by 9 points, of a heavy one by up to
19. A difference under 10 points is mostly noise, not a change.

:::note[Run under load]

If our server was busy during a run, the numbers may be worse than the real
ones. Such a run is flagged and left out of the comparison. Re-running such a run doesn't use the monthly limit.

:::

You can also compare any runs manually: select them in the run list and click
**Compare**. The earliest one becomes the baseline.

## Schedules and Telegram

On the Pro plan a page can be measured on a schedule: every 3 or 6 hours, daily or weekly.
Daily and weekly runs happen at night, when the server is free and the numbers
are more accurate. Runs of one schedule are grouped in the list under its name.

To get results in Telegram, turn on **Send the result to Telegram** when you
set up a schedule. After each run you get a message: a snapshot of the page,
the score and what changed, deploys since the previous run and what to fix
first, with links to the report and the comparison.

## From the terminal and from an AI agent

```bash
npx layero@latest perf check --device mobile --path /pricing --wait
```

The command measures the project's main branch and waits up to 4 minutes for
the result. Without `--wait` it only starts the run, and
`npx layero@latest perf show` prints the result. The verdict is the same as in
the dashboard.

AI agents start a run with the `check_performance` MCP tool.

## Limits

- Only your project's addresses can be measured: the branch address, the
  project address and domains connected to it.
- A run covers one page load without signing in. Clicks, navigation and
  forms after the load aren't included.
