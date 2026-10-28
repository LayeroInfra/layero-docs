---
sidebar_position: 5
title: Accepting Requests from Another Domain
description: How to let a client's site send data to your database without handing it access to the database.
---

# Accepting Requests from Another Domain

:::info[Beta]

Data API is in beta and available on the Pro plan. What to expect from
these pages is covered in [What Data API Is](./index.md).

:::

The browser won't let a page reach `data.layero.ru` unless its domain is allowed
by the database. Allowed domains come from two lists, and for widgets on other
people's sites there is a third mode — "any site".

## 1. Domains of connected projects are allowed automatically

A project connected to the database may call it from the browser
automatically: its apex (`<project>.layero.app`), its own domains and branch
previews. Nothing to configure.

## 2. Accepted origins — for third-party sites

If a form has to live on a site that is **not** connected to the database (a
client's site, a landing page on another platform), add its domain to the
accepted origins:

```bash
npx layero@latest data origins add https://zarya.example --db <database> --note "client landing"
npx layero@latest data origins list --db <database>     # both lists at once
npx layero@latest data origins remove https://zarya.example --db <database>
```

The same in the panel: "Data API" → "Access" → "Sites allowed to call the Data
API". A database has up to 50 accepted origins.

🚨 **This is not the same as connecting a project to the database.** Connecting
gives the project a role with table privileges and a connection string for
server code. An accepted origin grants neither: it lifts exactly one
restriction — the browser one.

What an allowed domain can do is still decided by the key, grants and RLS. For
taking in submissions this is usually one public function and no open tables —
see [Functions and RPC](./rpc.md).

## 3. Any site — for embeddable widgets

A widget installed on hundreds of other people's sites (a feedback form, a
chat, reviews) won't fit into 50 origins. For it the database has an "any site"
mode, as in Supabase: the gateway accepts requests with the public key from any
page.

```bash
npx layero@latest data origins add '*' --db <database>     # turn on
npx layero@latest data origins remove '*' --db <database>  # turn off
```

In the panel it is the "Any site" switch in the same list.

⚠️ When you turn it on, only privileges and policies protect the data. Any page
on the internet can read and write whatever is open to guests and spend the
database's daily request limit. For a widget, open one intake function to
guests (`SECURITY DEFINER`, input checked inside) and no tables. "Any site" does
not open post-sign-in redirect addresses: they are still checked against the
list.

If opening that much is not acceptable, there is a way without "any site": on
the other page a script draws a button, and the form lives in an `iframe` on
your connected project's domain and gets the page data via `postMessage`.

## Format

`https://domain` or `https://domain:port` — exactly as the browser sends it — or
`*` for any site. Paths and patterns like `https://*.example` are not accepted:
a path never arrives in `Origin`. `localhost` and `127.0.0.1` on any port are
allowed by default — for requests and as a post-sign-in redirect, as in
Supabase. You can turn that off under "Access".

List changes apply within seconds: a refusal based on a stale cache is
re-checked against a fresh list rather than served from the cache.
