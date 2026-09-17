---
sidebar_position: 4
title: User Sign-In
description: Sign-up and sign-in for an application on Data API, the authenticated role, auth.uid() in policies, and exchanging a panel session for a database session.
---

# User Sign-In

:::warning[Section in testing]

Data API is not yet open to everyone — a closed pilot is underway. How to
get access and what to expect from these pages is written up in
["What Data API Is"](./index.md).

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

A signed-in user runs under the `authenticated` role, an anonymous one under
`anon`. The signed-in role **inherits** from the anonymous one: signing in
only adds access.

Policies have access to `auth.uid()` and `auth.role()` — the same names as
Supabase, so migrated policies work without editing:

```sql
CREATE POLICY entries_own ON public.entries
    FOR SELECT TO PUBLIC
    USING (owner_id = auth.uid());
```

🚨 A policy of `TO authenticated USING (true)` migrated from Supabase means
"anyone who is signed in." Check that this is really what you meant: before
we had a dedicated signed-in role, such a policy exposed the table to
anyone holding a public key.

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
after that it's like any regular sign-in: the `authenticated` role,
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
