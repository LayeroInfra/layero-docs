---
sidebar_position: 8
title: What's Missing
description: What's not supported in Data API and where the boundaries are.
---

# What's Missing

:::warning[Section in testing]

Data API is not yet open to everyone — a closed pilot is underway. How to
get access and what to expect from these pages is written up in
["What Data API Is"](./index.md).

:::

Something unsupported responds with a refusal naming the capability, not a
silent stub. A silent mismatch costs more than an absence — "it works, but
not like that" surfaces at the visitor's end, not the developer's.

## Capabilities that don't exist

| What's missing | What to do instead |
|---|---|
| **Realtime** — change subscriptions | poll on an interval |
| **Edge Functions** — running your code on our side | logic lives in database functions; for outbound calls see [Outbound calls](./outbound.md) |
| `/auth/v1/admin/*` | manage users with your own functions in the `api` schema |
| email change, SMS, MFA, enterprise SSO | — |
| RS256/JWKS | tokens are signed with HS256 using the database's secret |
| image transforms, resumable upload, S3 protocol | prepare the file on your side; upload and serving work |

⚠️ "No Edge Functions" does **not** mean "no outbound calls." Telegram
notifications, webhooks, and calls to third-party APIs work — see
[Outbound calls](./outbound.md). What's missing is specifically running your
own code on our side.

## Boundaries worth knowing about upfront

| What | Value |
|---|---|
| Concurrent connections per database | 4 per gateway process, two processes — so 8; beyond that, a `db_too_busy` refusal |
| File in storage | up to 50 MB |
| Daily request limit | set per database; unlimited if not set |
| Databases per organization | 10 (write to us if you need more) |
| Accepted origins per database | 50 |

The dedicated `db_too_busy` code means "you are overloaded," not "the
platform is overloaded": neighboring databases keep working fine.

## Client

Our own package is `@layero/data`. It's thin: calling database functions and
outbound calls through the gateway, with no wrapper over tables.

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
