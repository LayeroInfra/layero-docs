---
sidebar_position: 1
title: Creating a database
description: Creating a Layero database — from the dashboard and from the CLI. Shared database from your plan, a database with its own configuration, extensions, how long to wait, and what to do on failure.
---

# Creating a database

:::warning[Section in testing]

Databases and the Data API are not yet open to everyone: the section is
in a closed pilot on a handful of accounts. If your dashboard menu has no
**Databases** item, you don't have access yet, and you won't be able to
create a database either from the dashboard or from the CLI.

**To join the pilot**, message us in the "💬" chat in the bottom-right
corner of the [dashboard](https://app.layero.ru) — we'll enable it manually.
There's no other way to get access right now.

:::

## From the dashboard

1. Open [app.layero.ru](https://app.layero.ru) and pick an organization.
2. In the left menu — **Databases**. No such item — you don't have access
   yet, see above.
3. Click **Create database**. This opens a dialog, not a separate page:
   it ends where it started, and the list below it already shows the new
   database.
4. Choose the placement — [a shared database or your own
   configuration](#which-database-to-choose).
5. Give it a name. A Latin slug is filled in automatically and can be
   edited: the slug goes into the database's address and never changes
   afterward, even if you rename the database.
6. Optionally check off [extensions](#extensions). Skipping this loses
   nothing — they can be enabled later too.
7. **Create**.

A shared database is ready in about twenty seconds. A database with its
own configuration takes **7–13 minutes** to come up: the card in the list
shows the provisioning step and updates itself, no need to press F5.

:::note[No email notification]

We don't send a notification when it's ready — not by email, not by
Telegram. Keep the tab open or check back later: the card shows the
status.

:::

## From the CLI

```bash
layero db create moya-baza
```

The command waits for the database to be ready and prints the connection
string **once** — it won't be shown again, and the password can only be
reset. Save it right away.

The organization is taken from the current directory if it's linked to a
project (`layero link`). Otherwise, specify it explicitly:

```bash
layero db create moya-baza --org moya-organizaciya
```

The CLI only creates a **shared** database: the command has no flags for
configuration, version, or disk. A database with its own configuration
can currently only be ordered from the dashboard.

To see what you got:

```bash
layero db list
```

## Which database to choose

A **shared database** lives on Layero's shared server, next to your
application. Size and connection limits are set by your plan — there's
nothing to choose, and that's the point: click and go. One such database
is included with the Pro plan, and it's not billed separately.

A **database with its own configuration** is a dedicated server just for
you: you choose the cores, memory, and disk. It's billed separately, the
wizard shows the price before you click "Create," and the same amount
later appears on the database's card. Region — Moscow.

:::note[A second shared database can't be created]

An attempt to create a second shared database gets this response from the
server: "This organization already has a Shared CPU database. Create the
next one as a dedicated instance." This isn't an error or a temporary
limit: the shared server's capacity is finite, and it's sold as one
database per organization.

:::

## Extensions

At creation time you can immediately enable `pgcrypto`, `uuid-ossp`,
`citext`, `pg_trgm`, `unaccent`, and `pgvector`. This step isn't required:
the same list is available in the **Extensions** section of an existing
database, and you can enable them at any time.

The list comes from the server, not hardcoded in the dashboard: if an
extension isn't in the list, it isn't on the server either, and there's
no point asking to have it enabled by command.

## What's next

- **Connect it to a project.** Then the connection string arrives in the
  build automatically, in the `LAYERO_DATABASE_URL` variable — no need to
  enter it by hand. From the CLI: `layero db connect moya-baza` from the
  project directory. You can disconnect it in the dashboard, on the
  database page, "Projects" tab.
- **Connect yourself** — [connection string, TLS modes, and driver
  recipes](./connect.md).
- **Expose the database over HTTP** without your own server — [Data
  API](../data-api/index.md).

## If it didn't work

| What the platform responds | What it means |
|---|---|
| `not found` on create, no section in the menu | The organization isn't in the pilot. Message us in the dashboard chat |
| "This organization already has a Shared CPU database" | The shared database already exists. The next one — with its own configuration |
| The "Create database" button has a **Pro** badge | You need the Pro plan: databases can't be created on the free plan |
| Provisioning takes longer than 20 minutes | Message us: the card is stuck and won't fix itself |

Failures come with a human-readable message — quote it to us in full if
you're not sure what to do.
