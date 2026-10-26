---
sidebar_position: 3
title: Functions and RPC
description: Calling database functions over HTTP. The api schema is the only public storefront; argument names are a public contract.
---

# Functions and RPC

:::info[Beta]

Data API is in beta and isn't open to everyone yet. How to get access and
what to expect from these pages is covered in [What Data API Is](./index.md).

:::

```
POST     https://data.layero.ru/<database>/rest/v1/rpc/<function>     PostgREST form
GET      https://data.layero.ru/<database>/rest/v1/rpc/<function>     STABLE/IMMUTABLE only
POST     https://data.layero.ru/<database>/rpc/<function>             our own form
```

A function is a way to give a site visitor **one specific action** without
exposing a single table. Accepting a submission, a counter, crediting a
bonus: the call is available from the outside, and what it does with the
data is decided by the code inside the database.

```sql
CREATE FUNCTION api.submit(site_token text, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.entries (site_token, payload) VALUES (site_token, payload);
    RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION api.submit(text, jsonb) TO anon;
```

```js
await db.rpc("submit", { site_token: "abc", payload: { name: "Anya" } });
```

## Where functions are looked up and what comes back

Functions are looked up in the `api` and `public` schemas — as in Supabase,
`supabase.rpc("name")` calls a `public` function without a single Layero-specific
line. A new `public` function gets call rights by itself (default privileges), so
your migration needs no `GRANT`. Trigger functions are never methods.

Only a function granted to the Data API roles explicitly can be called over the
API. A function callable only through `PUBLIC` (the Postgres default) is closed,
and the refusal names the `GRANT` to issue: internal application mechanics don't
become callable from the internet just by existing.

The two addresses answer differently:

| Address | Response body |
|---|---|
| `/<db>/rest/v1/rpc/<function>` (supabase-js) | the result as is: `"hi"`, `{"ok": true}`, `[…]` — as in PostgREST |
| `/<db>/rpc/<function>` (`@layero/data`) | `{"data": <result>}` |

## Argument names are a public contract

The gateway maps JSON keys to **same-named** function arguments. That means
an argument name is visible from the outside: it ends up in every client's
code, and in the case of a form on someone else's site, in their snippets
too.

Two things follow from this:

1. **Renaming an argument breaks clients** — exactly like renaming a field
   in JSON. Plan argument names as part of the API, not as a local detail.
2. **Inside the function, the argument name conflicts with a column name.**
   PL/pgSQL will substitute the argument where you meant the column, and the
   query will fail with `column reference "token" is ambiguous` — including
   inside `ON CONFLICT (token, …)`, where the local variable also gets
   substituted.

The fix isn't renaming the argument (it's public), it's qualifying names
inside the function. The PL/pgSQL block label is the function name **without the
schema**: `submit.token`, not `api.submit.token`. With the schema the function is
created but fails on its first call with `missing FROM-clause entry for table "submit"`:

```sql
CREATE FUNCTION api.submit(token text, payload jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
#variable_conflict use_column          -- the column takes priority over the variable
BEGIN
    INSERT INTO public.counters AS c (token, minute, hits)
    VALUES (submit.token, date_trunc('minute', now()), 1)  -- argument, by the function name, no schema
    ON CONFLICT (token, minute) DO UPDATE SET hits = c.hits + 1;
    RETURN jsonb_build_object('ok', true);
END $$;
```

## A mutating function and GET

A function with `VOLATILE` (the default) is not available over GET and
answers `volatile_by_get`. This is decided by the volatility marker in the
catalog. GET requests get cached and repeated — by the browser, a proxy,
link prefetching — and a "create order" over GET would eventually create two
orders.

Mark a read-only function as `STABLE`, and GET will work.

## `SECURITY DEFINER` and privileges

`SECURITY DEFINER` runs the function body as the database owner — this is
how a public function can write to a closed table without exposing it. The
one rule: **validate the input inside**, because any site visitor will be
able to call it.

The right to call a function is granted separately: a newly created function
in the `api` schema is not accessible to anyone, even if the schema is open
— the platform revokes `EXECUTE` from `PUBLIC` on every new function.
