---
sidebar_position: 5
title: Backups
description: Layero database backups — schedule and retention for a shared database, a paid option for a dedicated one, one-click restore, and downloading a PostgreSQL dump.
---

# Backups

:::info[Beta]

Databases are in beta: everything described here works, but the interface
and some features are still changing. More on the [Databases](./index.md)
page.

:::

Backups live on the database page, in the **Backups** section. The header
shows whether they're enabled; below it is a summary: schedule, retention,
cost, and the list of finished backups.

**A shared database has backups on from the moment it's created** — once a
day, kept for 7 days. You can turn them off, but then there's nothing to
restore deleted data from. For a dedicated database, backups are a paid
option and off by default.

## Shared database

| What | How it works |
|---|---|
| By default | on |
| How often | once a day, by default at 03:00 Moscow time. The hour can be changed |
| How long they're kept | 1 to 7 days, your choice |
| Where they're stored | in separate storage, not on the database server |
| Storage space | they don't count toward the database quota |
| Price | included in the plan |

The backup hour and the retention period change with **Change settings**. If
backups were turned off, bring them back with **Backups → Enable**.

## Dedicated database

Backups of a dedicated database are a **paid option**, off by default.

1. **Backups → Enable**.
2. Choose how many backups to keep: 1 to 14. A backup is taken once a day
   at night; the oldest one is pushed out by the new one.
3. The dialog shows the calculation: database, backups, and the monthly
   total. The extra amount for the remaining days of the current period is
   charged right away, and the dialog names it before you confirm.

The price of backups depends on the disk and the number of backups — see
the examples on the [Pricing](./pricing.md#dedicated-database-backups) page.
From the next period it's included in the monthly charge together with the
database.

You can turn backups off at any time. Backups already taken aren't deleted,
but the money for the remaining days of the current period isn't refunded.

## Make a backup manually

The **Make a backup** button in the header takes an extra, off-schedule
backup — for example, before a risky migration. The backup appears in the
list with the status "being taken…", and once it's ready, with its size and
buttons.

## Restore

A finished backup has a **Restore** button.

⚠️ The restore goes **into the same database, over the current data**, to the
moment of the backup. Everything that appeared after the backup will be
lost. You can't restore a database to an arbitrary point in time.

- A **shared database** is restored without stopping. While the restore is
  running, the application may see data in an intermediate state.
- A **dedicated database** is stopped for the duration of the restore:
  usually a few minutes, and the application can't connect during that
  time. The platform brings back role permissions and Data API access by
  itself.

When it's all done, the dashboard says: "Data restored to the moment of the
backup".

If you need to pull a single table out of a backup rather than roll back
the whole database, [download the backup](#download-a-backup) and restore
it locally.

## Download a backup

Download a backup with the arrow button in the row of a finished backup.

For a shared database the file is an ordinary PostgreSQL dump in
`pg_dump -Fc` format. You can restore it on any PostgreSQL server,
including outside Layero, with `pg_restore`:

```bash
pg_restore --no-owner --no-privileges -d postgresql://localhost/restored backup.dump
```

This is also how you move off Layero or keep a copy of your own just in
case.

For a dedicated database the file is a snapshot of the whole disk. Its size
equals the size of the database disk, not of the data: a database with an
8 GB disk and 60 MB of data gives an 8 GB file. To get a file the size of
your data, [take your own dump](#your-own-dump).

### Your own dump

You can take a dump with your own tools for both shared and dedicated
databases — plain `pg_dump` with the connection string from the dashboard.
Check three things first.

1. **`pg_dump` 18 or newer.** Layero databases run PostgreSQL 18, and a
   `pg_dump` older than the server refuses to dump:
   `aborting because of server version mismatch`. Check the version with
   `pg_dump --version`.
2. **Your address is on the allowed list.** Otherwise the server answers
   `no authentication method is found`. How to add an address — see
   ["Who to let in"](./connect.md#who-to-let-in).
3. **The client has a root certificate.** The connection string from the
   dashboard requires `sslmode=verify-full`, and without a root certificate
   `pg_dump` fails with `root certificate file "…/root.crt" does not exist`.
   Either put the certificate in place following
   ["How to enable verify-full"](./connect.md#how-to-enable-verify-full),
   or append `&sslrootcert=system` to the string so that `pg_dump` uses the
   system root certificates. The official `postgres` Docker image has no
   system certificates, so there follow the instructions instead.

Then dump to an SQL file as usual:

```bash
pg_dump "postgresql://<role>:<password>@db.layero.ru:5432/<database>?sslmode=verify-full&sslrootcert=system" -f backup.sql
```

Restore such a file with `psql -f backup.sql`.

A dedicated database also supports archive formats, for example `-Fc` for
`pg_restore`. On a shared database the server answers archive formats
(`-Fc`, `-Fd`, `-Ft`) and the `-C` flag with
`permission denied for table pg_db_role_setting`. This system catalog holds
role settings of every database on the server, so it is closed to other
customers. If you need an archive format for a shared database, download a
backup from the dashboard.

## Backup types in the list

A shared database's list can contain backups of two types:

| Type | What it is |
|---|---|
| **Storage backup** | uploaded off the server and survives even the loss of the server. It can be restored and downloaded |
| **Rollback point** | an instant snapshot on the server itself: protects you from a mistake, but not from losing the server |

## What happens to backups when a database is deleted

Deleting a database also erases all its backups — immediately and
irreversibly. If you might need a backup, download it **before** deleting.

If a database is deleted for non-payment, we try to save a backup before
deleting it, but we don't guarantee it — see
[If payment fails](./pricing.md#if-payment-fails). It's safer not to let it
come to that: turn backups on and download a fresh one from time to time.
