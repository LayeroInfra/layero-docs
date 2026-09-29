---
sidebar_position: 5
title: Backups
description: Layero database backups — schedule and retention for a shared database, a paid option for a dedicated one, one-click restore, and downloading a PostgreSQL dump.
---

# Backups

:::info[Beta]

The section isn't open to all organizations yet. How to get access and what
to expect from the beta is covered on the [Databases](./index.md) page.

:::

Backups live on the database page, in the **Backups** section. The header
shows whether they're enabled; below it is a summary: schedule, retention,
cost, and the list of finished backups.

## Shared database

| What | How it works |
|---|---|
| Enabled | yes, from the moment the database is created |
| How often | once a day, by default at 03:00 Moscow time. The hour can be changed |
| How long they're kept | 1 to 7 days, your choice |
| Where they're stored | in separate storage, not on the database server |
| Storage space | they don't count toward the database quota |
| Price | included in the plan |

Settings are changed with the **Change settings** button: the backup time
(Moscow time) and the retention period in days.

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

The arrow button next to a finished backup. The file is an ordinary
PostgreSQL dump: you can restore it anywhere, including outside Layero. For
a shared database it's a dump in `pg_dump -Fc` format, restored with
`pg_restore`:

```bash
pg_restore --no-owner --no-privileges -d postgresql://localhost/restored backup.dump
```

This is also the way to move off Layero or to keep your own copy just in
case.

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
come to that: keep backups enabled and download a fresh one from time to
time.
