---
sidebar_position: 2
title: Tables and REST
description: Reading and writing tables over HTTP, PostgREST filters, granting a role access, and RLS policies.
---

# Tables and REST

:::warning[Section in testing]

Data API is not yet open to everyone — a closed pilot is underway. How to
get access and what to expect from these pages is written up in
["What Data API Is"](./index.md).

:::

```
GET|HEAD|POST|PATCH|DELETE  https://data.layero.ru/<database>/rest/v1/<table>
```

The request shape is PostgREST, so filters, sorting, embedded resources, and
`Prefer` headers work exactly as in the Supabase documentation.

```bash
# first five records, newest first
curl "https://data.layero.ru/moya-baza/rest/v1/entries?select=id,name,created_at&order=created_at.desc&limit=5" \
     -H "apikey: pk_live_…"

# a single record by condition
curl "https://data.layero.ru/moya-baza/rest/v1/entries?id=eq.42&select=*" \
     -H "apikey: pk_live_…"
```

If `limit` isn't set, the gateway applies its own — 1000 rows. An unbounded
request would eat into the connection pool shared by every database on the
platform.

## Access: a grant plus a policy

A fresh database exposes zero tables over the API. For a table to become
visible, the role needs a grant, and the table needs an RLS policy:

```sql
GRANT SELECT ON public.entries TO layero.role('anon');
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY entries_read_own ON public.entries
    FOR SELECT TO PUBLIC
    USING (owner_id = auth.uid());
```

🚨 **Get the role name from `layero.role()`, not from `pg_roles`.** The name
contains the database identifier, you can't write it in literally, and the
temptation to look it up by pattern (`rolname ~ '^u_.*_anon$'`) feels
natural. It's wrong: the role list is shared across the whole server, the
pattern matches other tenants' roles, and permissions end up in the wrong
place. The function `layero.role('anon'|'auth'|'svc')` exists in every
database with the API enabled and returns **your** role.

Don't check what's been granted by eye: the panel will run the query **under
the key's role** — as `anon`, as the signed-in user, or as the secret key —
and roll back the transaction.

## Refusals you'll see

| Response | What it means |
|---|---|
| `unknown_table` | the table isn't in the catalog of **the role the request is running under** — that role's name is stated in the refusal text. Almost always this is a grant that went to the wrong role |
| `no_table_grant` | the table exists, but the role lacks the needed privilege; a ready-made `GRANT` is in `hint` |
| `permission_denied` / `42501` | a refusal from the database itself |
| an empty array | the grant exists, but the RLS policy doesn't let any rows through |

The difference between the last two is the most common point of confusion:
**an empty response is not an error, it's a working policy.**

## Writing

```js
// insert + return what was inserted (this is what supabase-js does by default)
await db.from("entries").insert({ name: "Anya" }).select();
```

`Prefer: return=representation` returns the row — and falls under the
**read** policy, not just the insert one. If the read policy doesn't let the
author through, the insert succeeds but the request answers with an RLS
refusal; details and the fix — [Migration Pitfalls](./pitfalls.md).
