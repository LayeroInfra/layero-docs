---
sidebar_position: 2
title: Tables and REST
description: Reading and writing tables over HTTP, PostgREST filters, granting a role access, and RLS policies.
---

# Tables and REST

:::info[Beta]

Data API is in beta and available on the Pro plan. What to expect from
these pages is covered in [What Data API Is](./index.md).

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

## Access: an RLS policy, as in Supabase

A new table in `public` is available to the `anon`, `authenticated` and
`service_role` roles right away — default privileges, as in Supabase. RLS
decides which rows are visible, so enable it right away:

```sql
CREATE TABLE public.entries (id bigint generated always as identity primary key,
                             owner_id uuid default auth.uid(), body text);
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY entries_read_own ON public.entries
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid());
```

🚨 **A table without RLS gives every row to anyone with the public key.** The
platform warns about one: a red "all rows visible" mark in the dashboard and a
line in `npx layero@latest data methods`. Tables created without RLS before
26.10.2026 are closed — open them after enabling RLS:
`npx layero@latest data grant <table> --get visitor`.

🚨 **Roles are `anon`, `authenticated`, `service_role`, as in Supabase.** Don't
look up "your" role by pattern (`rolname ~ '^u_.*_anon$'`): the role list is
shared across the whole server, the pattern matches other tenants' roles, and
permissions end up in the wrong place. To close a table to the public key, use
`REVOKE … FROM anon`, as in Supabase.

Don't check what's been granted by eye: the panel will run the query **under
the key's role** — as `anon`, as the signed-in user, or as the secret key —
and roll back the transaction.

## Refusals you'll see

| Response | What it means |
|---|---|
| `unknown_table` (404) | there is no such table — check the name and schema |
| `42501` (401 for a guest, 403 for a signed-in user) | the table exists but isn't open to this key: no grant. The `hint` says how to open it (dashboard or `layero data grant`) |
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
