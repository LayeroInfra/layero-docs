---
sidebar_position: 1
title: Databases
description: Managed PostgreSQL on Layero — a shared database included with the Pro plan and a dedicated database with its own configuration. What the section can do, how the placements differ, and how to get access to the beta.
---

# Databases

**Layero databases are plain PostgreSQL right next to your projects:**
in the same account, on servers in Moscow. You create a database in the
dashboard or with a single CLI command, and give it to a project with a
button — the connection string arrives in the build automatically.

:::info[Beta]

Databases are in beta. Everything described in this section already works, but the interface and some features are still changing, and the page
may lag behind the dashboard by a few days. If you notice a discrepancy,
let us know — it helps.

The section is open to all organizations: the **Databases** item is in the
[dashboard](https://app.layero.ru) menu, in the "Services" group.

:::

## Two placements

| | Shared database | Dedicated database |
|---|---|---|
| Where it lives | a shared Layero server | a separate server just for you |
| Power | shared processor, "Shared CPU" | you choose the cores, memory, and disk |
| Space | 0.5 GB | 8 to 2,000 GB, the disk can be increased |
| Plan | Pro only | any, no subscription needed |
| Price | included in Pro | from 600 ₽ per month |
| Without a Pro subscription | access closes after the grace period, data is deleted | doesn't depend on the subscription |
| How many | one per organization | as many as you need |
| Wait time | under a minute | 7–13 minutes |
| PostgreSQL version | 18 | 14–18, your choice |
| Backups | free: once a day, up to 7 days | paid option: 1–14 backups |
| Create from the CLI | yes | dashboard only |

**A shared database** is for getting started: click and go. It's enough
for a prototype, a small site, or an internal service.

**A dedicated database** is for when you need guaranteed resources, more
space, or a specific PostgreSQL version. You can create one right away or
move your shared database onto it once that one grows.

Details on prices and payment — ["Pricing"](./pricing.md), on all
limits — ["Limits"](./limits.md).

## What the section can do

- **The project connects itself.** Give the database to a project — the
  connection string arrives in the `LAYERO_DATABASE_URL` variable, and the
  project gets its own role in the database.
- **Tables and relationships** — the database's contents by schema, rows,
  and a relationship diagram right in the dashboard.
- **SQL editor** with bookmarks, history, and trial runs of a query as a
  Data API role.
- **Roles and RLS policies** — who connects and which rows they see.
  Access can be granted for a limited time.
- **Functions** with a test call and version history.
- **Extensions** with a toggle: `pgcrypto`, `uuid-ossp`, `citext`,
  `pg_trgm`, `unaccent`, `btree_gin`, `pgvector`.
- **Monitoring** — space, connections, and load over an hour, a day, or a
  week.
- **Backups** on a schedule, restore with a button, and download as a
  regular PostgreSQL dump.
- **Access by address** — from outside, only addresses on your list can
  connect to the database.
- **[Data API](../data-api/index.md)** — the database over HTTP for your
  frontend, without your own server. Data API isn't open to everyone yet — how to
  get access is described in its section.

## Where to start

1. [Create a database](./create.md) — in the dashboard or with the
   `layero db create` command.
2. [Connect it to a project](./create.md#whats-next) or
   [connect yourself](./connect.md) using the connection string.
3. Take a look at [working in the dashboard](./panel.md) so you know where
   everything is.

## The whole section

- [Creating a database](./create.md) — the dashboard wizard and the CLI.
- [Working in the dashboard](./panel.md) — all sections of the database page.
- [Connecting to a database](./connect.md) — connection string, TLS, access
  by address.
- [Backups](./backups.md) — schedule, restore, dump.
- [Databases from the CLI](./cli.md) — `layero db` in the terminal and in CI.
- [Pricing](./pricing.md) — prices, payment, renewal, refunds.
- [Limits](./limits.md) — space, connections, queries.
