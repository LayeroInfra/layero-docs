---
sidebar_position: 7
title: Migration Pitfalls
description: Five spots where people most often trip up when moving a project from Supabase or writing their first Data API application.
---

# Migration Pitfalls

:::warning[Section in testing]

Data API is not yet open to everyone — a closed pilot is underway. How to
get access and what to expect from these pages is written up in
["What Data API Is"](./index.md).

:::

Collected from incident write-ups. Each item cost someone anywhere from ten
minutes to half an hour, and none of them are visible from the code.

## 1. Get the role only through `layero.role()`

The role name contains the database identifier, so you can't write it into a
migration literally. Looking it up by pattern feels natural:

```sql
-- 🚨 DON'T DO THIS
SELECT rolname FROM pg_roles WHERE rolname ~ '^u_.*_anon$' LIMIT 1;
```

The role list is shared across the entire database server. The pattern will
match roles belonging to other tenants, and the `GRANT` will end up **in
someone else's database**: once, table privileges for one product ended up
on another organization's role, and it was only noticed because the
product's own queries kept answering "table not exposed."

```sql
-- This is correct
GRANT SELECT ON public.entries TO layero.role('anon');
```

The function `layero.role('anon'|'auth'|'svc')` exists in every database
with the API enabled. You can check what's been granted like this:

```sql
SELECT layero.role('anon'), has_table_privilege(layero.role('anon'), 'public.entries', 'SELECT');
```

## 2. `INSERT … RETURNING` goes through the **read** policy

`supabase-js` does `.insert().select()` by default, i.e. it asks for the
inserted row to be returned. Returning it counts as a read, and it goes
through the `SELECT` policy.

The classic case: a workspace member is added by an `AFTER INSERT` trigger,
but RLS checks the right to read the returned row before the trigger has
run. The result is `new row violates row-level security policy`, even though
the same insert without a return succeeds. The error sounds like an insert
problem, but the cause is a read.

Fix it with a read policy that also lets the author through:

```sql
CREATE POLICY workspaces_read ON public.workspaces
    FOR SELECT TO PUBLIC
    USING (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.members m
         WHERE m.workspace_id = id AND m.user_id = auth.uid()));
```

Or insert without returning a row: `db.from("workspaces").insert(row)`
without `.select()`.

## 3. Functions only live in the `api` schema

The gateway looks for tables in `api`, `public`, and `app`, but for
functions — only in `api`. `Accept-Profile` doesn't affect this. Details —
[Functions and RPC](./rpc.md).

## 4. A function argument name is a public contract

JSON keys are matched to same-named function arguments, so an argument name
is visible from the outside and ends up in every client's code. Inside the
function, that same name conflicts with a column of the same name
(`column reference "token" is ambiguous`), and a local variable doesn't help
— it gets substituted into `ON CONFLICT` too. The fix is covered in the same
place, in [Functions and RPC](./rpc.md).

## 5. An empty response is a working policy

`[]` in the response means "the grant exists, your policy just returns no
rows." That's not an error and not broken access. It helps to tell these
apart:

| Response | Cause |
|---|---|
| `unknown_table` | the table isn't in your role's catalog — almost always the grant went to the wrong role |
| `no_table_grant` | the table exists, there's no privilege; a ready-made `GRANT` is in `hint` |
| `[]` | the privilege exists, the policy just doesn't let any rows through |

Check in the panel that the policy is holding back the right person: the
query runs **under the key's role**, and the transaction is rolled back.
