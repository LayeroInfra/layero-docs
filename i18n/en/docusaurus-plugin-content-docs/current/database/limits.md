---
sidebar_position: 8
title: Limits
description: Layero database limits — how many databases, storage and what happens when it runs out, connections and the pool, query time, the SQL editor and layero db sql, backups, address-based access.
---

# Limits

:::info[Beta]

The section isn't open to all organizations yet. How to get access and what
to expect from the beta is covered on the [Databases](./index.md) page.

:::

All the numbers on one page. Data API limits are on a separate one:
[What's Missing](../data-api/limits.md).

## How many databases

| Database | How many you can have |
|---|---|
| Shared | one per organization, Pro only |
| Dedicated | unlimited. One is provisioned at a time: you can place the next order once the previous database is up |

## Storage

| | Shared database | Dedicated database |
|---|---|---|
| How much | 0.5 GB | the configuration's disk: 8 to 2,000 GB |
| Can it be increased | no — only by moving to a dedicated database | yes, the disk grows without interruption |
| Can it be reduced | — | no |

The exact quota is shown on the database card and in the output of
`layero db list`: shared databases created earlier may have more than
0.5 GB.

**When a shared database runs out of space**, writes stop, but reads keep
working. The quota is hard: nothing can be written beyond it, neither data
nor temporary query files. For a dedicated database, the limit is its
disk — watch the storage chart and increase the disk in advance.

**Warnings** appear in the dashboard only; there are no emails:

| Used | What you see |
|---|---|
| from 75% | the storage figure on the overview turns yellow, and the monitoring page shows a warning |
| from 90% | the figure turns red |
| 100% | writes to the database are rejected |

What to do when space is running out:

- look at the five largest tables: **Monitoring → Database storage**;
- delete what you don't need and run `VACUUM` — deleted rows don't free up
  space right away;
- move a shared database to a dedicated one or increase a dedicated
  database's disk — see
  [Changing the configuration](./pricing.md#changing-the-configuration).

## Compute

A **shared database** shares the server's CPU and memory with other shared
databases. There's no guaranteed share, so a shared database is good for
prototypes and small sites, but not for heavy analytics. The platform
terminates a process that needs more than 128 MB of memory, so that a single
query doesn't bring down its neighbors.

A **dedicated database** gets all the cores and memory of its
configuration.

## Connections

All connections from outside and from applications go through the shared
entry point `db.layero.ru:5432`.

| What | Limit |
|---|---|
| Concurrent connections per role | 20. The owner of a dedicated database gets more — it depends on the configuration |
| Concurrent connections from one address | 50 |
| New connections from one address | 2 per second on average (120 per minute), up to 60 at once |
| Waiting for a free connection | 15 seconds, then a refusal |
| Encryption | mandatory; connections without TLS are rejected |

The database's connection limit is shown as a dashed line on the
**Monitoring → Connections** chart. From 80%, the chart turns yellow.

Each connected project has its own role, and therefore its own 20
connections. Applications on Layero aren't subject to the per-address
limits.

### Connection pool

The `db.layero.ru` entry point is a pool in transaction mode: each
transaction may go to a different server connection. For ordinary queries
and ORMs this is invisible, but a few session-level things don't carry over
to the next transaction:

| Doesn't work across transactions | What to do |
|---|---|
| `SET` outside a transaction | `SET LOCAL` inside a transaction, or a role setting: `ALTER ROLE … SET` |
| `LISTEN` / `NOTIFY` | poll on an interval |
| session-level advisory locks | `pg_advisory_xact_lock` — a lock for the duration of the transaction |
| temporary tables | create and use them within a single transaction |

## Query time

Database roles have these ceilings by default:

| Setting | Value | What it means |
|---|---|---|
| `statement_timeout` | 30 seconds | a longer query is cancelled |
| `idle_in_transaction_session_timeout` | 60 seconds | a transaction that sits idle for more than a minute is closed |
| `lock_timeout` | 10 seconds | waiting for a lock any longer — a refusal |

You can run a long migration by raising the ceiling inside its transaction:

```sql
begin;
set local statement_timeout = '10min';
-- migration
commit;
```

## SQL editor and `layero db sql`

| What | Value |
|---|---|
| Time per query | 30 seconds |
| Rows in the response | the first 500; the rest are cut off with a note |
| Length of a single value | 4,096 characters |
| Statements per script | up to 200, run as a single transaction |
| Query length | up to 20,000 characters |
| Rows in **Tables** | loaded in chunks as you scroll |

For data exports and anything that hits these limits, connect directly with
`psql` or a driver using the [connection string](./connect.md).

## Backups

| | Shared database | Dedicated database |
|---|---|---|
| How often | once a day, you choose the hour | once a day, at night |
| How long they're kept | 1 to 7 days | 1 to 14 backups |
| Price | included in Pro | paid option |
| Restore | into the same database, to the moment of the backup | into the same database, to the moment of the backup |

Details — [Backups](./backups.md).

## Access and security

| What | Value |
|---|---|
| Who connects from outside | only addresses from the database's list. Applications on Layero — always |
| Addresses | IPv4 only |
| Wrong passwords | 10 in 5 minutes — the address is blocked for 30 minutes; repeat blocks last longer, up to 16 hours |

Details — [Who to let in](./connect.md#who-to-let-in).

## Extensions

The toggle in the **Extensions** section enables `pgcrypto`, `uuid-ossp`,
`citext`, `pg_trgm`, `unaccent`, `btree_gin`, and `pgvector`. The other
extensions in the list are locked: they can only be enabled through
support. If an extension isn't in the list at all, it isn't on the server.
TimescaleDB won't be available: its license prohibits offering it as part
of a cloud database.

## PostgreSQL versions

| | Shared database | Dedicated database |
|---|---|---|
| Version | 18 | 14, 15, 16, 17, or 18 — chosen when ordering |
| Upgrading the version | — | not possible yet |
