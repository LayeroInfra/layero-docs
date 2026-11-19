---
sidebar_position: 7
title: Migration Pitfalls
description: Six spots where people most often trip up when moving a project from Supabase or writing their first Data API application.
---

# Migration Pitfalls

**Six spots where people most often trip up when moving from Supabase or in a first Data API app.** None of them is visible from the code, and each cost someone ten minutes to half an hour.

## 1. Roles in migrations — by the Supabase name, not by pattern

Write `TO anon`, `TO authenticated`, `TO service_role` — these roles exist in
every database. Don't look up "your" role in the server's role list by a name pattern: the list is shared by every database on the server, the pattern matches other roles, and the `GRANT` ends up **in someone else's database**.

```sql
-- Right
GRANT SELECT ON public.entries TO anon;
```

Close access the same way as in Supabase: `REVOKE SELECT ON public.entries FROM anon;`
takes it away from the public key at once. Grant only to these three roles: rights granted to another role aren't removed by `REVOKE … FROM anon`.

## 2. `INSERT … RETURNING` goes through the **read** policy

A `.insert().select()` request in supabase-js asks for the inserted row to be returned. Returning it counts as a read, and the `SELECT` policy checks it.

The classic case: a workspace member is added by an `AFTER INSERT` trigger,
but RLS checks the right to read the returned row before the trigger has
run. The result is `new row violates row-level security policy`, even though
the same insert without a return succeeds. The error sounds like an insert
problem, but the cause is a read.

Fix it with a read policy that also lets the author through:

```sql
CREATE POLICY workspaces_read ON public.workspaces
        FOR SELECT TO authenticated
    USING (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.members m
                  WHERE m.workspace_id = workspaces.id AND m.user_id = auth.uid()));
```

Inside the subquery write the full table name — `workspaces.id`, not `id`: otherwise Postgres takes the `id` column from `members`, and the policy silently breaks.

Or insert without returning a row: `db.from("workspaces").insert(row)`
without `.select()`.

## 3. Functions are looked up in `api` and `public`, with different defaults

The gateway looks for tables in `api`, `public` and `app`, and for functions in
`api` and `public`. A new `public` function is callable over the API right
away, as in Supabase; a new `api` function is closed until `GRANT EXECUTE`.
Put helpers the internet must not call into your own closed schema (`private`,
`app_private`). `Accept-Profile` does not affect the function lookup. Details —
[Functions and RPC](./rpc.md).

## 4. A function argument name is a public contract

JSON keys are matched to same-named function arguments, so an argument name
is visible from the outside and ends up in every client's code. Inside the function, that same name conflicts with a column of the same name: in a `plpgsql` function the query fails with `column reference "token" is ambiguous`, while in a `sql` function the column silently wins and the condition is always true. A local variable doesn't help
— it gets substituted into `ON CONFLICT` too. The fix is covered in the same
place, in [Functions and RPC](./rpc.md).

## 5. An empty response is a working policy

`[]` in the response means "the grant exists, your policy just returns no
rows." That's not an error and not broken access. It helps to tell these
apart:

| Response | Cause |
|---|---|
| `unknown_table` | there is no such table — check the name and schema |
| `permission_denied` | the table exists but is closed to this key |
| `no_table_grant` | the table exists, the role lacks the needed privilege; a ready-made `GRANT` is in `hint` |
| `[]` | the privilege exists, the policy just doesn't let any rows through |

Check in the panel that the policy is holding back the right person: the
query runs **under the key's role**, and the transaction is rolled back.

## 6. Inside the gateway `current_user` is not `authenticated`

A signed-in user's request runs under a separate role of your database, which is a
member of the `authenticated` group (a guest's — of `anon`, the secret key's —
of `service_role`). `TO authenticated` policies and `GRANT … TO authenticated`
work as in Supabase, but comparing the name does not: `current_user =
'authenticated'` is false, and a check in a trigger silently lets everyone
through.

Check the caller by the token:

```sql
IF auth.role() = 'authenticated' THEN …          -- signed in
IF auth.role() = 'anon' THEN …                    -- guest
IF pg_has_role('authenticated', 'MEMBER') THEN …  -- group membership
```

