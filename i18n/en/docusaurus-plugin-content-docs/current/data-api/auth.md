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

## Roles — as in Supabase

Every database has the roles `anon`, `authenticated` and `service_role`, so
policies and grants from Supabase migrations work as written:

```sql
CREATE POLICY entries_own ON public.entries
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid());
GRANT SELECT ON public.entries TO authenticated;
```

A signed-in user runs as `authenticated`, a guest as `anon`, the secret key as
`service_role`. Policies can use `auth.uid()`, `auth.role()` and `auth.jwt()` —
the same names as in Supabase.

How we differ:

- **No table privileges by default.** A new table is closed until you
  `GRANT` it (or set an access level in the dashboard). Without a grant the
  request answers `401`/`403` with code `42501` and a hint on how to open it.
- **A signed-in user also gets what is open to guests:** a `TO anon` policy
  applies to signed-in users too.
- **`service_role` does not bypass RLS.** The secret key sees rows only
  through `TO service_role` policies; add `USING (true)` for the server to see
  everything.

## Email confirmation

As in Supabase, newly enabled sign-in confirms email: `signUp` returns no
session until the person follows the link in the email. Without confirmation
anyone can register someone else's address. Switch it off in «Авторизация» →
«Подтверждать почту». Databases where sign-in was enabled before 26.10.2026
keep their previous setting — check it in the same place.

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
