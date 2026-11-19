---
sidebar_position: 8
title: Limits
description: Layero database limits — how many databases, storage and what happens when it runs out, connections and the pool, query time, the SQL editor and layero db sql, backups, address-based access.
---

# Limits

**All the database limits on one page.** Data API limits are on a separate one: [What's missing](../data-api/limits.md).

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

- look at the five largest tables: «Мониторинг» → «Место базы» (Monitoring → Database storage);
- delete what you don't need and run `VACUUM` — deleted rows don't free up
  space right away;
- move a shared database to a dedicated one or increase a dedicated
  database's disk — see
  [Changing the configuration](./pricing.md#changing-the-configuration).

## Compute

A **shared database** shares the server's CPU and memory with other shared
databases. There's no guaranteed share, so a shared database is good for prototypes and small sites, but not for heavy analytics.

A **dedicated database** gets all the cores and memory of its
configuration.

## Connections

All connections — from apps, from your computer, from the Data API — go
through the shared entry point `db.layero.ru:5432`. Limits apply to the
database as a whole.

| | Shared database | Dedicated database |
|---|---|---|
| Open connections | 100 | depends on the configuration, from 200 |
| Concurrent transactions | 4 | depends on the configuration, from 20 |

A connection holds a server connection only for the length of a
transaction, which is why there are many connections and few concurrent
transactions. A query outside a transaction is a transaction too, for as
long as the query runs. On a shared database the Data API shares the same four concurrent transactions with your apps.

| What | How much |
|---|---|
| Waiting for a free connection | 15 seconds, then a refusal |
| A transaction with no queries | closed after 60 seconds |
| A connection with no queries | closed after 10 minutes; the driver's pool reconnects by itself |
| Encryption | mandatory, connections without TLS are rejected |

How many connections are open right now is shown on the «Мониторинг» →
«Подключения» (Monitoring → Connections) chart.

### What the client sees at the limit

| Error text | What happened |
|---|---|
| `client connections exceeded (max_db_client_connections)` | all the database's connections are open. Make the driver's pool smaller or close extra connections |
| `query_wait_timeout` | all transactions were busy for more than 15 seconds. Look for long transactions and queries |
| `idle transaction timeout` | a transaction sat with no queries for more than 60 seconds |
| `client_idle_timeout` | a connection sat with no queries for 10 minutes |
| `canceling statement due to statement timeout` | a query ran longer than 30 seconds, see [Query time](#query-time) |

### Connection pool

Each transaction may go to a different server connection. For ordinary queries and ORMs this is invisible, but a few things don't carry over from one transaction to the next:

| Doesn't work across transactions | What to do |
|---|---|
| `SET` outside a transaction | `SET LOCAL` inside a transaction, or a role setting: `ALTER ROLE … SET` |
| `LISTEN` / `NOTIFY` | poll on an interval |
| advisory locks held for the whole connection (`pg_advisory_lock`) | `pg_advisory_xact_lock` — a lock for the duration of the transaction |
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
| Rows in «Таблицы» (Tables) | loaded in chunks as you scroll |

For data exports and anything that hits these limits, connect directly with
`psql` or a driver using the [connection string](./connect.md).

## Backups

| | Shared database | Dedicated database |
|---|---|---|
| By default | on | off |
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


Details — [Who to let in](./connect.md#who-to-let-in).

## Extensions

Which extensions are turned on with a switch is listed on [Working in the dashboard](./panel.md#extensions). The other extensions in the list are locked: they can only be enabled through
support. If an extension isn't in the list at all, it isn't on the server.
TimescaleDB won't be available: its license prohibits offering it as part
of a cloud database.

## PostgreSQL versions

| | Shared database | Dedicated database |
|---|---|---|
| Version | 18 | one of those offered when ordering, the newest by default |
| Upgrading the version | — | not possible yet |
