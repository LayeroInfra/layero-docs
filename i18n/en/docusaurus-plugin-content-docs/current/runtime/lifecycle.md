---
sidebar_position: 2
title: Running and idling
description: How an app with a server freezes, goes to sleep and wakes up on the first request, what that means for your code, what resources the plan gives and which time is paid for.
---

# Running and idling

**An app with a server runs only while it's being called.** Without requests
it freezes, then goes to sleep, and the next request wakes it up. The request
isn't lost: it waits on the platform and gets a real answer, not an error.

## States

| State | When it starts | What a visitor sees |
|---|---|---|
| Running | requests are coming in | the app's normal speed |
| Frozen | after about 20 seconds without requests | the app unfreezes in a fraction of a second |
| Asleep | after 15 minutes without requests, or earlier when the server is short of memory | the app is restored from a snapshot — slower than unfreezing, faster than starting from scratch |
| Removed from the server | after 48 hours without visitors, on any plan | the app starts from scratch: the slowest case, the time depends on the stack |

While at least one connection is open, such as a WebSocket, the app doesn't freeze.

## What this means for your code

- **Background tasks stop together with the app.** While the app is frozen or asleep, timers, schedulers (`node-cron`, APScheduler) and long-polling bots stop until the next request. A bot or worker that needs a constantly running
  process doesn't fit this model.
- **Up to 60 seconds for a response.** If the app hasn't answered by then, the platform drops the connection. Split long work into parts and keep the progress in the database.
- **The disk is temporary.** Everything the app writes to disk is gone after a restart — see [Files and state](./stateless.md).

## Next.js with server rendering

A Next.js site with server rendering doesn't keep its own process: its pages
are rendered on the platform's shared servers. That's why only page rendering
time is paid for — see [Usage and limits](../billing/usage.md#apps).

## Resources

| Plan | Memory | CPU |
|---|---|---|
| Free | 256 MB | 0.25 CPU |
| Pro | up to 1 GB | up to 1 CPU |

You can lower the resources and the time before sleep with the `memory_mb`,
`cpu_quota` and `idle_timeout_s` keys in [`layero.json`](../build/layero-json.md),
but not raise them above the plan.

If the app crashes for lack of memory, the app log shows it:
`npx layero@latest logs --runtime`. Heavy apps usually do fine with 1 GB on
Pro.

## What it costs

App time is counted in GB·h: the time the app isn't asleep times the memory
of its configuration. Frozen time counts, sleep time doesn't. Limits and prices are on
[Usage and limits](../billing/usage.md#apps).
