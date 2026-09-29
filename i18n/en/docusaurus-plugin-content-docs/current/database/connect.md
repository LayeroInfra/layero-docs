---
sidebar_position: 4
title: Connecting to a database
description: Layero database connection string, network access modes, and server certificate verification (verify-full) for psql, asyncpg, node-pg, Prisma, and Drizzle.
---

# Connecting to a database

:::info[Beta]

The section isn't open to all organizations yet. How to get access and what
to expect from the beta — on the ["Databases"](./index.md) page.

:::

The connection string is in the dashboard: database card menu → **Connect**.
It looks like this:

```
postgresql://<role>:<password>@db.layero.ru:5432/<database>?sslmode=verify-full
```

`db.layero.ru` is the single entry point for all Layero databases. The
address of the server your particular database lives on isn't exposed: it
can change, but the connection string doesn't.

For applications on Layero, the connection string arrives automatically in
the `LAYERO_DATABASE_URL` variable (with `require` mode, see below), starting
with the next deploy after you connect the database to the project. You only
need to enter it by hand where the application lives outside Layero.

A second database for the same project gets a suffix based on its slug —
`LAYERO_DATABASE_URL_<SLUG>` — so the two strings don't compete for one name.

:::note[Why not `DATABASE_URL`]
That's the variable name used by half of all hosts and libraries, and if
we set it ourselves, it would silently override the one the person had set.
Connections created before this rule keep their old name — the project card
shows which name your application gets.
:::

## What an application can do

Each connected project has its own database user. It acts on behalf of the
database owner and can do the same things as the SQL editor in the
dashboard:

* **create and alter tables.** Migrations that the application runs itself
  on startup go through the same `LAYERO_DATABASE_URL` string — no separate
  string is needed for migrations;
* **work with tables created in the editor, and vice versa.** Anything the
  application creates belongs to the database owner: such tables are visible
  in the editor and can be changed or dropped there.

Disconnecting a project only revokes its user. Other projects and the
editor keep working, and the tables stay in the database.

⚠️ This level of access has two quirks, same as a database owner in other
services:

* **Row-level security (RLS) policies don't apply to the project's user.**
  If your application relies on them, create a separate role with the
  needed permissions on the **Roles** page and connect with it instead.
* **The application can change the database owner's password.** After that,
  the SQL editor stops connecting until you reset the password in the
  dashboard.

## Encryption is mandatory

The server rejects connections without TLS — from psql and from any driver
alike. The only question is whether the client verifies whose certificate
it was presented. More on that below.

## `require` encrypts the channel, but doesn't verify the peer

* **`require`** — traffic is encrypted, but the client doesn't verify whose
  certificate it was presented. It protects against reading on an
  intermediate node, but not against server impersonation.
* **`verify-full`** — the client verifies both the certificate's signature
  and that the name matches. It also protects against impersonation.

By default we issue **`verify-full`** — the strictest mode.

The mode is the same for shared and dedicated databases: both connect
through the shared entry point `db.layero.ru`, and encryption terminates at
our certificate.

⚠️ `verify-full` has a cost worth knowing about upfront: the mode requires
the client to have the root certificate in the place where the library
looks for it. libpq looks for it at `~/.postgresql/root.crt` and doesn't
check the system store, and `sslrootcert=system` isn't understood by every
driver — asyncpg, for example, doesn't understand it. Without the step from
the next section, some clients won't connect with this string, and it will
look like "the database is down".

The recipe takes two commands. If there's nowhere to put the root
certificate (someone else's container, a managed runner), switch the mode
to `require` in the dashboard: database card menu → **Connect**, the
"Verify server identity" toggle. The channel stays encrypted, but the
server's identity won't be verified.

For applications on Layero, the platform sets `require` itself: we
can't put a root certificate into an image that you build.

## How to enable `verify-full`

The `db.layero.ru` certificate is issued by Let's Encrypt, with the root
**ISRG Root X1**.

### 1. Put the root certificate where the client looks for it

```bash
mkdir -p ~/.postgresql
curl -fsSL https://letsencrypt.org/certs/isrgrootx1.pem -o ~/.postgresql/root.crt
```

Verify that the file really is the root certificate:

```bash
openssl x509 -in ~/.postgresql/root.crt -noout -subject
# subject=C = US, O = Internet Security Research Group, CN = ISRG Root X1
```

### 2. Check the connection string

If you haven't switched the mode in the dashboard, `sslmode=verify-full` is
already in the string:

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

From outside — from a laptop, from CI, from someone else's hosting — only
addresses on the database's list can connect: database page →
**Settings → Allowed addresses**. Your projects' applications on Layero can
always connect; there's no need to add them to the list.

What the database comes with:

| Database | List after creation |
|---|---|
| **Shared** | one address — the one the database was created from. The dashboard tells you so in a pop-up message |
| **Dedicated** | a `0.0.0.0/0` row marked "Open to everyone at creation": anyone who knows the password can connect |

⚠️ If the dedicated database doesn't need to be open to the whole internet,
delete the `0.0.0.0/0` row right after creation and add your own addresses.

How to add an address:

1. **Settings → Allowed addresses → Add**.
2. Enter an address or a subnet. There are quick options: "My address"
   and "Entire internet" (`0.0.0.0/0`); for the latter, the dashboard asks
   for confirmation.
3. Optionally, note what the address is for and until what date it's
   valid. An expiry is handy when a contractor needs access for a week, not
   forever.

Changes take effect within a minute. IPv6 addresses aren't supported
yet — IPv4 only.

:::tip[If your address changed]
Home and office addresses often change. If connections stopped going
through after switching providers or moving, first check that your
current address is still on the list.
:::

### Automatic blocking

After 10 wrong passwords in 5 minutes, an address is blocked for 30
minutes; repeat blocks last longer, up to 16 hours. This keeps password
brute-forcing from reaching the database. Blocked addresses are shown in
the database's **Settings**: you can unblock your own with a button once
the password has been fixed.

## If the connection fails

| What the client says | What it means |
|---|---|
| `login rejected` | your address isn't on the allowed list or is blocked — check the database's **Settings** |
| `SASL authentication failed` | the address is allowed, but the password didn't match |
| `no such user` | a typo in the role name |
| certificate verification error | the string has `verify-full`, but the client doesn't have the root certificate — see step 1 |
| connection hangs and drops | too many connections from one address, or the database's limit is exhausted — see ["Limits"](./limits.md#connections) |
