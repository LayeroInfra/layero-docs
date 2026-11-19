---
sidebar_position: 2
title: Tables and REST
description: Reading and writing tables over HTTP, PostgREST filters, granting a role access, and RLS policies.
---

# Tables and REST

**A database's tables are available at `https://data.layero.ru/<database>/rest/v1/<table>`** — with GET, HEAD, POST, PATCH and DELETE.

The request shape is PostgREST, so filters, sorting, embedded resources, and
`Prefer` headers work exactly as in the Supabase documentation.

```bash
# first five records, newest first
curl "https://data.layero.ru/moya-baza/rest/v1/entries?select=id,body,created_at&order=created_at.desc&limit=5" \
     -H "apikey: pk_live_…"

# a single record by condition
curl "https://data.layero.ru/moya-baza/rest/v1/entries?id=eq.42&select=*" \
     -H "apikey: pk_live_…"
```

A response has at most 1000 rows. If `limit` isn't set, the gateway applies 1000, and a larger `limit` is silently cut to 1000: for example, `.range(0, 4999)` in supabase-js returns 1000 rows without an error. Need more — request in parts.

## Access: an RLS policy, as in Supabase

A new table in `public` is available to the `anon`, `authenticated` and
`service_role` roles right away — default privileges, as in Supabase. RLS
decides which rows are visible, so enable it right away:

```sql
CREATE TABLE public.entries (id bigint generated always as identity primary key,
                             owner_id uuid default auth.uid(), body text,
                             created_at timestamptz default now());
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

🚨 **Roles are `anon`, `authenticated`, `service_role`, as in Supabase.** Grant rights to them rather than looking up "your" role in the server's role list by pattern: the list is shared by every database on the server, and the rights end up in the wrong place. To close a table to the public key, use
`REVOKE … FROM anon`, as in Supabase.

Don't check what's been granted by eye: the panel will run the query **under
the key's role** — as `anon`, as the signed-in user, or as the secret key —
and roll back the transaction.

## Refusals you'll see

A refusal comes in the response body like this: `error` — our refusal code,
`message` — the explanation, `code` — the Postgres error code if there is one,
otherwise the same code of ours, `hint` — what to do, often with ready SQL.
Supabase-js shows `code`, but it's easier to tell refusals apart by `error`.

| `error` | Response | What it means |
|---|---|---|
| `unknown_table` | 404 | there is no such table — check the name and schema |
| `permission_denied` | 401 for a guest, 403 for a signed-in user, `code` 42501 | the table exists but is closed to this key. The `hint` says how to open it: in the dashboard or with `layero data grant` |
| `no_table_grant` | 401 or 403, `code` 42501 | the role lacks the needed privilege, for example to write. A ready `GRANT` is in `hint` |
| `no_schema_access` | 401 or 403, `code` 42501 | the schema itself is closed to the role |
| — | 200, an empty array | the rights are there, but the RLS policy doesn't let any rows through |

The most common point of confusion is the last row: **an empty response is
not an error, it's a working policy.**

## Writing

```js
// insert and return the inserted row: without .select() supabase-js doesn't return it
await db.from("entries").insert({ body: "Hello" }).select();
```

`Prefer: return=representation` returns the row — and falls under the
**read** policy, not just the insert one. If the read policy doesn't let the author through, the request with a return gets an RLS refusal and the row isn't saved, although the same insert without a return would pass. Details and the fix — [Migration Pitfalls](./pitfalls.md).
