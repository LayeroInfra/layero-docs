---
sidebar_position: 5
title: Accepting Requests from Another Domain
description: How to let a client's site send data to your database without handing it access to the database.
---

# Accepting Requests from Another Domain

:::warning[Section in testing]

Data API is not yet open to everyone — a closed pilot is underway. How to
get access and what to expect from these pages is written up in
["What Data API Is"](./index.md).

:::

The browser won't let a page reach `data.layero.ru` unless its domain is
allowed by the database: we never set `Access-Control-Allow-Origin` to `*` —
with key-based authentication that isn't a simplification, it's removing the
protection.

Allowed domains are made up of two lists.

## 1. Domains of connected projects are allowed automatically

A project connected to a database automatically gets the right to call it
from the browser: both the apex (`<project>.layero.app`) and its own custom
domains. Nothing needs to be configured.

## 2. Accepted origins — for third-party sites

If you need to put a form on a site that is **not connected** to the database
(a client's site, a landing page on someone else's platform), add its domain
to accepted origins:

```bash
curl -X POST "https://api.layero.ru/organizations/<organization>/databases/<id>/api/origins" \
     -H "authorization: Bearer <token>" -H "content-type: application/json" \
     -d '{"origin": "https://zarya.example", "note": "client landing page"}'
```

```bash
# view both lists at once
curl "https://api.layero.ru/organizations/<organization>/databases/<id>/api/origins" \
     -H "authorization: Bearer <token>"
```

🚨 **This is not the same as connecting a project to the database.**
Connecting a project grants its roles rights on the database's tables and
puts a connection string into its environment variables — that is, it hands
over the whole database. An accepted origin grants neither grants nor a
connection string: it lifts exactly one restriction — the browser's.

What a domain on the list can actually access is still decided by the key,
grants, and RLS. For accepting form submissions this is usually one public
function and not a single open table — see [Functions and RPC](./rpc.md).

## Format

`https://domain` or `https://domain:port` — exactly as the browser sends it.
A path and `*` are not accepted: a path never arrives in `Origin` at all, and
an asterisk would mean "any page on the internet, on behalf of your
visitor." `localhost` is always allowed — otherwise development would be
impossible before the first deploy.

A change to the list takes effect within seconds: on a stale-cache refusal
the gateway re-checks against the current list instead of serving from
cache. Hence the ceiling — a few seconds, not the minute of waiting it used
to be.
