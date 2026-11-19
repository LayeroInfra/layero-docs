---
sidebar_position: 8
title: What's Missing
description: What's not supported in Data API and where the boundaries are.
---

# What's Missing

**The Data API has no Realtime, Edge Functions or incoming webhooks, and calls, files and users have plan limits.** A request for something missing gets a refusal naming the capability, not a silent stub. A silent mismatch costs more than an absence — "it works, but
not like that" surfaces at the visitor's end, not the developer's.

## Capabilities that don't exist

| What's missing | What to do instead |
|---|---|
| **Realtime** — change subscriptions | poll on an interval |
| **Edge Functions** — running your code on our side | logic lives in database functions; to reach out — [HTTP from SQL](./outbound.md) (`net.http_post`) |
| **Incoming webhooks** — an address that accepts another service's request | your own server on Layero receives the webhook and calls the function; options are in [HTTP from SQL](./outbound.md#incoming-webhooks--there-are-none) |
| email change, SMS, enterprise SSO | —; a second factor exists: an authenticator app (TOTP), `supabase.auth.mfa.*` |
| RS256/JWKS | tokens are signed with HS256 using the database's secret |
| image transforms, resumable upload, S3 protocol | prepare the file on your side; upload and serving work |

⚠️ "No Edge Functions" does **not** mean "no outbound requests." Telegram
notifications, webhooks and calls to third-party APIs are made by a database
function with `net.http_post` — see [HTTP from SQL](./outbound.md). What's
missing is specifically running your own code on our side.

## Boundaries worth knowing about upfront

| What | Value |
|---|---|
| Concurrent queries per database | shared database — 4 (2 on each of the two entry points), shared between the Data API and your server; dedicated — 20 % of the cluster connection ceiling, at least 4. `layero db list` shows the same number (`data_api_concurrent`). Beyond that — a queue, then a `db_too_busy` refusal |
| Calls per month | Free — 1 M (beta), Pro — 10 M per organization, counted across all databases. In force from 1 December on Free and from 17 December on Pro; on Pro, above that — 20 ₽ per 1 M with [extra usage](../billing/overage.md), otherwise a refusal (429) until the new period |
| Calls per day | Free — 50,000 (beta), Pro — 1,000,000 per database, as protection against spikes; beyond that, a `quota_exceeded` refusal (429) until 00:00 UTC |
| Sign-in users per database | Free — 10,000, Pro — 100,000; beyond that, new sign-ups are closed, existing users keep working |
| File in storage | up to 50 MB on any plan |
| File storage | Free — 1 GB (beta), Pro — 10 GB on average over the month per organization, 100 GB at most in total; on Pro, above that — 10 ₽ per GB |
| Databases per organization | one shared, as many dedicated as you need; see [database limits](../database/limits.md) |
| Accepted origins per database | 50 |

The "beta" mark on Free figures means they apply only to beta participants: for everyone else the Data API doesn't turn on on Free.

Every request counts: tables, functions, files, and HTTP from SQL. Calls
that failed through our fault (5xx) and limit refusals (429) don't count
toward the monthly limit. Sites and direct Postgres connections to the
database are not affected by these limits. Monthly limits and prices are
in [Usage and limits](../billing/usage.md).

The dedicated `db_too_busy` code means "you are overloaded," not "the
platform is overloaded": neighboring databases keep working fine.

## Client

For tables, functions, user sign-in and files, use `@supabase/supabase-js`:
the gateway's contract is compatible with it.

```js
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  import.meta.env.VITE_LAYERO_DATA_URL,   // https://data.layero.ru/<database>
  import.meta.env.VITE_LAYERO_DATA_KEY,   // pk_live_…
);

const { data } = await db.rpc("menu");
```

You can also do without packages — a function call fits in a few lines:

```js
const call = (fn, args) =>
  fetch(`${import.meta.env.VITE_LAYERO_DATA_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "content-type": "application/json",
               apikey: import.meta.env.VITE_LAYERO_DATA_KEY },
    body: JSON.stringify(args),
  }).then((r) => r.json());
```

The `@layero/data` package can only call functions with `rpc`. The `call`
method was removed in version 0.2.0: the address it used no longer exists.
`setToken` puts the token into a function argument but doesn't give the
signed-in user's role. For tables, filters and sign-in, use supabase-js.
