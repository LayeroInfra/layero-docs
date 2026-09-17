---
sidebar_position: 2
title: Connecting to a database
description: Layero database connection string, network access modes, and server certificate verification (verify-full) for psql, asyncpg, node-pg, Prisma, and Drizzle.
---

# Connecting to a database

:::warning[Section in testing]

Databases and the Data API are not yet open to everyone: the section is
in a closed pilot on a handful of accounts. If your dashboard menu has no
**Databases** item, you don't have access yet, and you won't be able to
create a database either from the dashboard or from the CLI.

**To join the pilot**, message us in the "💬" chat in the bottom-right
corner of the [dashboard](https://app.layero.ru) — we'll enable it manually.
There's no other way to get access right now.

Everything described on these pages already works — but names, buttons,
and API responses are still changing. The page may lag behind the product
by a few days; if you notice a discrepancy, let us know in the same chat,
it helps.

:::

The connection string lives in the dashboard, on the database page, and
looks like this:

```
postgresql://<role>:<password>@db.layero.ru:5432/<database>?sslmode=verify-full
```

`db.layero.ru` is the single entry point for all Layero databases. The
address of the server your database actually lives on isn't exposed: it
can change, but the connection string doesn't.

For applications deployed on Layero, this string arrives automatically in
the `LAYERO_DATABASE_URL` variable as soon as you connect the database to
the project. You only need to enter it by hand where the application
lives outside of Layero.

A second database in the same project gets a suffix based on its slug —
`LAYERO_DATABASE_URL_<SLUG>` — so the two strings don't compete for one
name.

:::note Why not `DATABASE_URL`
That's the variable name used by half of all hosts and libraries, and if
we set it ourselves, it would silently override whatever the person had
already set. Connections made before this rule keep their old name — the
project card shows which name your application actually gets.
:::

## What an application can do

Each connected project has its own database user. It acts on behalf of
the database owner and can do the same things as the SQL editor in the
dashboard:

* **create and alter tables.** Migrations that the application runs
  itself on startup go through the same `LAYERO_DATABASE_URL` string — no
  separate string is needed for migrations;
* **work with tables created in the editor, and vice versa.** Anything
  created by the application belongs to the database owner: such tables
  are visible in the editor and can be changed or dropped there.

Disconnecting a project only revokes its user. Other projects and the
editor keep working, and the tables stay in the database.

⚠️ This level of access has two quirks, same as a database owner in other
services:

* **Row-level security (RLS) policies don't apply to the project's
  user.** If your application relies on them, create a separate role
  with the needed permissions on the "Roles" page and connect with it
  instead.
* **The application can change the database owner's password.** After
  that, the SQL editor will stop connecting until you reset the password
  in the dashboard.

## Encryption is mandatory

Encryption isn't a recommendation: the server rejects connections without
TLS. This applies to psql and to any driver alike. The only real question
is whether the client verifies whose certificate it was presented — more
on that below.

## `require` encrypts the channel, but doesn't verify the peer

The difference isn't obvious.

* **`require`** — traffic is encrypted, but the client doesn't verify
  whose certificate it was presented. It protects against reading on an
  intermediate node, but not against server impersonation.
* **`verify-full`** — the client verifies both the certificate's
  signature and that the name matches. It also protects against
  impersonation.

By default we issue **`verify-full`** — the strictest mode.

⚠️ **Except for a brought-your-own database.** For someone else's server
we know neither who signed it nor whether you have its root certificate —
there's nothing to verify and nothing to recommend. The dashboard says so
directly in the connection dialog, and the toggle there is disabled.

Until 2026-09-06, the same was true for dedicated instances too: their
connection string pointed straight at the provider's cluster with a
self-signed certificate. Now it points at the shared entry point
`db.layero.ru`, encryption terminates at our certificate — and
`verify-full` works on any placement except a brought-your-own database.

⚠️ And it has a cost worth knowing about upfront. `verify-full` requires
the client to have the root certificate in the place the library looks
for it. libpq looks for it at `~/.postgresql/root.crt` and doesn't check
the system store, and `sslrootcert=system` isn't understood by every
driver — asyncpg, for one, doesn't understand it. That means without the
step below, the connection will fail for some clients, and it will look
like "the database is down."

The recipe is in the next section, and it takes just one command. If
there's nowhere to put the root certificate (someone else's container, a
managed runner), switch the mode to `require` in the dashboard: the
channel stays encrypted, but there's no verification of the server's
identity.

For applications deployed on Layero, the platform sets `require` for you
automatically: we can't put a root certificate into an image that you
build yourself.

## How to enable `verify-full`

The `db.layero.ru` certificate is issued by Let's Encrypt, with the root
**ISRG Root X1**.

### 1. Put the root certificate where the client looks for it

```bash
mkdir -p ~/.postgresql
curl -fsSL https://letsencrypt.org/certs/isrgrootx1.pem -o ~/.postgresql/root.crt
```

Verify that the file is really the root certificate:

```bash
openssl x509 -in ~/.postgresql/root.crt -noout -subject
# subject=C = US, O = Internet Security Research Group, CN = ISRG Root X1
```

### 2. Change the connection string

```
postgresql://<role>:<password>@db.layero.ru:5432/<database>?sslmode=verify-full
```

### Drivers

| Client | What's needed |
|---|---|
| `psql`, libpq | step 1 above, then `sslmode=verify-full` works |
| `asyncpg` | step 1 is required: it doesn't understand `sslrootcert=system` |
| `node-pg` | picks up system root certificates on its own, step 1 not needed |
| `Prisma` | `sslmode=verify-full` in `DATABASE_URL`, root certificate from step 1 |
| `Drizzle` | depends on the underlying driver — check its row in this table |

### In a container with no home directory

Put the root certificate in the image and point to the path explicitly:

```
postgresql://<role>:<password>@db.layero.ru:5432/<database>?sslmode=verify-full&sslrootcert=/etc/ssl/certs/isrgrootx1.pem
```

## Who to let in

On the database page, in the "Network" tab, there are three modes:

| Mode | Who can connect |
|---|---|
| **Layero resources only** | applications connected to this database, and platform services |
| **Address list** | the above, plus addresses you've listed |
| **Open to everyone** | anyone, if they know the password |

New databases are created in "Layero resources only" mode: the
application works right away, and access from outside — from a laptop,
from CI, from someone else's hosting — is something you open yourself,
deliberately.

A rule in the address list can have an expiry: handy when a contractor
needs access for a week, not forever.

:::tip Don't know your address
Home and office addresses usually change. If a connection that used to
work stops working after switching providers or moving, first check
whether your current address is still in the list.
:::

## If the connection fails

| What the client says | What it means |
|---|---|
| `login rejected` | your address doesn't match any rule — check the "Network" tab |
| `SASL authentication failed` | the address is allowed, but the password is wrong |
| `no such user` | typo in the role name |
| certificate verification error | you enabled `verify-full` but didn't add the root certificate — see step 1 |
| connection hangs and drops | too many connections from one address; close the extra ones |
