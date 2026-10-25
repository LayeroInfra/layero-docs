---
sidebar_position: 4
title: User Sign-In
description: Sign-up and sign-in for an application on Data API, the authenticated role, auth.uid() in policies, and exchanging a panel session for a database session.
---

# User Sign-In

:::info[Beta]

Data API is in beta and isn't open to everyone yet. How to get access and
what to expect from these pages is covered in [What Data API Is](./index.md).

:::

User sign-in is compatible with GoTrue, so `supabase-js` works:

```js
await db.auth.signUp({ email, password });
await db.auth.signInWithPassword({ email, password });
const { data: { user } } = await db.auth.getUser();
```

Surface: `/auth/v1/{token,signup,recover,verify,resend,authorize,callback}`,
`GET /auth/v1/user`, `PUT /auth/v1/user`, `POST /auth/v1/logout`. Magic-link
sign-in, PKCE, and external providers are available — enabled in the panel
for the database.

## Role of a signed-in user

A signed-in user runs under the database's signed-in role, an anonymous one
under its anonymous role. Each database has its own role names —
`<organization>_<database>_auth` and `_anon`, returned by `layero.role('auth')`
and `layero.role('anon')`. There are no roles named `authenticated` and `anon`
as on Supabase. The signed-in role **inherits** from the anonymous one: signing in
only adds access.

Policies have access to `auth.uid()` and `auth.role()` — the same names as
Supabase, so the conditions of migrated policies work without editing:

```sql
CREATE POLICY entries_own ON public.entries
    FOR SELECT TO PUBLIC
    USING (owner_id = auth.uid());
```

🚨 A `TO authenticated` or `TO anon` policy from a Supabase migration fails
here with `role "authenticated" does not exist`. The error names this
database's actual role. Replace the role with `TO PUBLIC` and a condition on
`auth.uid()`, as in the example above, or substitute the name through
`layero.role()` — see [Pitfalls](./pitfalls.md).

## Signing in from the Layero panel: no second password

If you're building the application yourself and its users are your own team
in Layero, you don't need to set up a separate password. The panel can
exchange its own session for a database session:

```
POST /organizations/<organization>/databases/<id>/api/app-session
```

The response is a pair of tokens signed with **this** database's secret, plus
the gateway address:

```json
{
  "url": "https://data.layero.ru/moya-baza",
  "access_token": "eyJ…",
  "refresh_token": "…",
  "expires_in": 3600,
  "user": { "id": "…", "email": "…" }
}
```

The token is placed in `authorization: Bearer …` alongside the public key —
after that it's like any regular sign-in: the signed-in role,
`auth.uid()`, policies.

This doesn't extend permissions: access is still decided by grants and RLS,
and the organization owner does not get "sees everything." The user is
created in or looked up in `auth.users` the same way as when signing in
through an external provider. A repeated exchange finds the same person
rather than creating a second one.

## The signing secret is per database

Each database's tokens are signed with its own secret. The signature is
checked by the database being addressed, so swapping the database name in
the address isn't enough by itself: one application's token won't pass for
another.
