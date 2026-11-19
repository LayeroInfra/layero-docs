---
sidebar_position: 1
title: Databases
description: Managed PostgreSQL in Layero — a shared database in the Pro plan and a dedicated database with its own configuration. How they differ, what the section can do and where to start.
---

# Databases

**Layero databases are plain PostgreSQL next to your projects:** in the same
organization, on servers in Moscow. You create a database in the dashboard (a shared one also with one CLI command), and give it to a project with a button — the
connection string arrives in the build by itself.

:::info[Beta]

Databases are in beta. Everything described in this section works, but the
interface and some features are still changing. If a page differs from the dashboard, write to [support](../support.md).

The section is open to every organization: the «Базы данных» (Databases)
item is in the [dashboard](https://app.layero.ru) menu, in the «Сервисы»
(Services) group.

:::

## Shared and dedicated

| | Shared database | Dedicated database |
|---|---|---|
| Where it lives | on a shared Layero server | on a separate server just for you |
| Compute | shared CPU, «Shared CPU» in the dashboard | you choose cores, memory and disk |
| Space | 0.5 GB | 8 to 2 000 GB, the disk can grow |
| Plan | Pro only | any, no subscription needed |
| Price | included in Pro | from 1 350 ₽ a month, hourly from the balance |
| If Pro ends | access is closed after the grace period, the database is deleted 3 days later | doesn't depend on the subscription |
| How many | one per organization | as many as you need |
| How long to wait | under a minute | 7–13 minutes |
| PostgreSQL version | 18 | one of those offered, the newest by default |
| Backups | free: once a day, kept up to 7 days | paid option: 1 to 14 copies |
| Create from the CLI | yes | dashboard only |

**A shared database** is for getting started: click and go. It's enough
for a prototype, a small site or an internal service.

**A dedicated database** is for when you need guaranteed resources, more
space or another PostgreSQL version. You can create one right away or move
a shared database onto it when it grows.

Prices and payment are on [Pricing](./pricing.md), all the limits are on
[Limits](./limits.md).

## What the section can do

- **Projects connect by themselves.** Give a database to a project — the
  connection string arrives in the `LAYERO_DATABASE_URL` variable, and the
  project gets its own role in the database.
- **Tables and relations** — the database's contents by schema, rows and a
  relationship diagram right in the dashboard.
- **SQL editor** with bookmarks, history and a trial run of a query as a
  Data API role.
- **Roles and RLS policies** — who connects and which rows they see. Access
  can be granted for a limited time.
- **Functions** with a trial call and version history.
- **Triggers** — functions the database calls by itself on writes to a table.
- **Extensions** with a switch — the list is on
  [Working in the dashboard](./panel.md#extensions).
- **Monitoring** — space, connections and load over an hour, a day or a
  week.
- **Backups** on a schedule, restore with a button, a dump to download.
- **Access by address** — from outside, only addresses on your list can
  connect to the database.
- **[Data API](../data-api/index.md)** — the database over HTTP for the
  frontend, with no server of your own. Available on Pro, in beta.

## Where to start

1. [Create a database](./create.md) — in the dashboard or with
   `layero db create`.
2. [Connect it to a project](./create.md#whats-next) or
   [connect to it yourself](./connect.md) with the connection string.
3. Look through [Working in the dashboard](./panel.md) to know where things
   are.

## Pages in this section

- [Creating a database](./create.md) — the dashboard wizard and the CLI.
- [Working in the dashboard](./panel.md) — every part of the database page.
- [Connecting to a database](./connect.md) — the connection string,
  encryption, access by address.
- [Backups](./backups.md) — schedule, restore, dump.
- [Databases from the CLI](./cli.md) — `layero db` in the terminal and in CI.
- [Pricing](./pricing.md) — prices, payment from the balance, deletion.
- [Limits](./limits.md) — space, connections, query time.
