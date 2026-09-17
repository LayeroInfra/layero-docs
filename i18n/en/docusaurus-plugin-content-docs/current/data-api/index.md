---
sidebar_position: 1
title: What Data API Is
description: The HTTP layer over your Layero project database — tables, functions, user sign-in, files. Compatible with Supabase clients.
---

# Data API

:::warning[Section in testing]

Databases and Data API are not yet open to everyone: the section is in a
closed pilot on a handful of accounts. If the panel menu has no "Databases"
item, you don't have access yet, and you won't be able to create a database
either from the panel or from the CLI.

**To join the pilot**, write to us in the "💬" chat in the bottom-right corner
of the [panel](https://app.layero.ru) — we'll enable it manually. There is no
other way to get access right now.

Everything described on these pages already works — but names, buttons, and
endpoint responses are still changing. A page may lag behind the product by a
few days; if you notice a discrepancy, write to us in the same chat, it
helps.

:::

**Data API is your database, available over HTTP.** The frontend talks to it
directly: no server to write, nothing to deploy, nothing to pay for an idle
container.

The address is `https://data.layero.ru/<database>`, where `<database>` is the
database slug from the panel. A request looks like this:

```bash
curl "https://data.layero.ru/moya-baza/rest/v1/entries?select=*&limit=5" \
     -H "apikey: pk_live_…"
```

## The contract is Supabase

Paths, headers, the response shape, and error codes mirror PostgREST and
GoTrue. This means **`@supabase/supabase-js` works** — the same client, the
same examples, the same filter documentation:

```js
import { createClient } from "@supabase/supabase-js";

const db = createClient("https://data.layero.ru/moya-baza", "pk_live_…");
const { data, error } = await db.from("entries").select("*").limit(5);
```

Compatibility exists for migration: a project written for Supabase runs
without editing access policies. The runtime underneath is our own, and
whatever we don't have responds with a refusal naming the missing capability,
not a silent stub — see [What's Missing](./limits.md).

## Keys and roles

A database has two keys, and the difference between them is the difference
between roles inside the database itself.

| Key | Role in the database | Where it lives |
|---|---|---|
| `pk_live_…` — public | `anon` | in the frontend bundle, visible to every visitor |
| `sk_live_…` — secret | `service` | only on your server |

The key is passed in the `apikey` header (as with Supabase) or as
`authorization: Bearer …`. A signed-in application user puts their token in
`authorization`, while the key stays in `apikey` — the request then runs
under the `authenticated` role.

🚨 **A key does not grant rights.** It selects a role, and what that role can
access is decided by grants and RLS policies inside the database itself. A
fresh database exposes zero tables over the API: access is granted table by
table, explicitly, together with a policy.

Get the keys onto your machine:

```bash
layero data env            # view
layero data env --write    # write to .env.local
```

## What to use to call it

Nothing in particular — a request is just an ordinary `fetch`. If you want a
client: our own thin `@layero/data` (calling functions) or
`@supabase/supabase-js` (tables, filters, sign-in) — the contract is
compatible with both. Details — [What's Missing](./limits.md).

## Which schemas are visible

| Schema | Tables | Functions |
|---|---|---|
| `api` | yes | **yes, and only here** |
| `public` | yes | no |
| `app` | yes | no |

The gateway looks for tables in three schemas, but functions for `/rpc/` —
**only in `api`**. The rule is asymmetric on purpose, and the
`Accept-Profile` header cannot change it: `api` is the public storefront —
whatever you put there, you put there deliberately. Details —
[Functions and RPC](./rpc.md).

## What's next

- [Tables and REST](./rest.md) — reading, writing, filters, access
- [Functions and RPC](./rpc.md) — a public function as the only entry point
- [User sign-in](./auth.md) — sign-up, sessions, sign-in from the panel
- [Accepting requests from another domain](./origins.md) — a form on a
  client's site
- [Outbound calls](./outbound.md) — Telegram notifications and webhooks
- [Migration pitfalls](./pitfalls.md) — where people trip up most often
- [What's Missing](./limits.md) — what's unsupported and what to do instead
