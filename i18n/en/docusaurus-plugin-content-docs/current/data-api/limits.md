---
sidebar_position: 8
title: What's Missing
description: What's not supported in Data API and where the boundaries are.
---

# What's Missing

:::info[Beta]

Data API is in beta and available on the Pro plan. What to expect from
these pages is covered in [What Data API Is](./index.md).

:::

Something unsupported responds with a refusal naming the capability, not a
silent stub. A silent mismatch costs more than an absence — "it works, but
not like that" surfaces at the visitor's end, not the developer's.

## Capabilities that don't exist

| What's missing | What to do instead |
|---|---|
| **Realtime** — change subscriptions | poll on an interval |
| **Edge Functions** — running your code on our side | logic lives in database functions; to reach out — [HTTP from SQL](./outbound.md) (`net.http_post`) |
| **Incoming webhooks** — an address that accepts another service's request | your own server on Layero receives the webhook and calls the function; options are in [HTTP from SQL](./outbound.md#incoming-webhooks--there-are-none) |
| `/auth/v1/admin/*` | manage users with your own functions in the `api` schema |
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
| Requests to one database per day | Free — 50,000, Pro — 1,000,000; beyond that, a `quota_exceeded` refusal (429) until 00:00 UTC |
| Sign-in users per database | Free — 10,000, Pro — 100,000; beyond that, new sign-ups are closed, existing users keep working |
| File in storage | up to 50 MB on any plan |
| File storage per database | Free — 1 GB, Pro — up to 100 GB |
| Databases per organization | one shared, as many dedicated as you need; see [database limits](../database/limits.md) |
| Accepted origins per database | 50 |

Every request counts: tables, functions, files, and HTTP from SQL. Sites
and direct Postgres connections to the database are not affected by the
daily limit.

The dedicated `db_too_busy` code means "you are overloaded," not "the
platform is overloaded": neighboring databases keep working fine.

## Client

Our own package is `@layero/data`. It's thin: calling database functions through the gateway, with no wrapper over tables.

```bash
npm i @layero/data
```

```js
import { createClient } from "@layero/data";

const db = createClient({
  url: import.meta.env.VITE_LAYERO_DATA_URL,   // https://data.layero.ru/<database>
  key: import.meta.env.VITE_LAYERO_DATA_KEY,   // pk_live_…
});

const menu = await db.rpc("menu");
```

⚠️ Version 0.x: the HTTP contract is still changing, pinning a version in
production is mandatory.

For tables, filters, and user sign-in, use `@supabase/supabase-js` — the
contract is compatible, and it can do everything `@layero/data` can't yet.
You can also do without any package — a request fits in a few lines:

```js
const call = (fn, args) =>
  fetch(`${import.meta.env.VITE_LAYERO_DATA_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "content-type": "application/json",
               apikey: import.meta.env.VITE_LAYERO_DATA_KEY },
    body: JSON.stringify(args),
  }).then((r) => r.json());
```
