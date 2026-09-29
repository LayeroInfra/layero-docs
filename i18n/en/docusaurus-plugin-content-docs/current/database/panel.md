---
sidebar_position: 3
title: Working in the dashboard
description: What's on a Layero database page — overview, monitoring, tables, SQL editor, functions, roles, RLS policies, extensions, settings, connected projects, renaming, and deletion.
---

# Working in the dashboard

:::info[Beta]

The section isn't open to all organizations yet. How to get access and what
to expect from the beta is covered on the [Databases](./index.md) page.

:::

You work with a database on its page in the [dashboard](https://app.layero.ru):
**Databases** in the left menu → the database card.
The left menu switches to the database menu, and a switcher appears above
it — handy for jumping between the organization's databases without going
back to the list.

Database menu sections:

| Group | Sections |
|---|---|
| — | **Overview**, **Monitoring**, **Settings** |
| Database | **Tables**, **SQL editor**, **Functions**, **Roles**, **Policies**, **Extensions**, **Backups** |
| Services | **API**, **Authentication**, **Files** — this is the [Data API](../data-api/index.md) |

## Database list

The **Databases** page shows all of the organization's databases as cards.
On a card:

- **name** and price: "included in plan" for a shared database, "N ₽/mo"
  for a dedicated one;
- **power**: "Shared CPU" for a shared database, or cores and memory for a
  dedicated one;
- **space**: how much of the quota is used, as a bar;
- **projects** the database is given to, and a "Connect project" button.

The "⋮" menu on the card: open the database, get the connection string,
rename, delete.

The database's state is shown right on the card:

| What's on the card | What's happening |
|---|---|
| "Preparing the database" / "Bringing up the instance" and steps | the database is being created. The list updates itself, no F5 needed |
| "didn't come up" and a reason | creation failed; the money wasn't charged or has already been refunded. In the menu — "Order again" and "Remove from list" |
| "Restarting" | the configuration is changing, usually about half a minute |
| "Moving" and steps | the database is moving to a dedicated instance |
| "payment failed" | renewal didn't go through; the database works until the stated date. "Pay" button |
| "access closed" | the database is stopped for non-payment, and the deletion date is stated. "Pay" button |
| "deleted for non-payment" | the database is gone. If a backup was taken before deletion, it can be downloaded in the settings |

What's behind the payment rows — on the
["Pricing"](./pricing.md#if-payment-fails) page.

## Overview

The database at a glance:

- **type** — the PostgreSQL version;
- **configuration** — "Shared CPU · 0.5 GB" or cores, memory, and disk;
- **space** — used out of the quota. The figure turns yellow from 75% and
  red from 90%;
- **backups** — when the last one was taken.

Below that — space and write charts for the day, the status of the services
(API, authentication, files), and the **Connected projects** block.

### Connected projects

Here you see which projects the database is given to and under which name
the variable arrives. You can connect a project either from the database
list or from the project page: **Project → Database → Connect to database**.

What a connected project gets:

- the `LAYERO_DATABASE_URL` variable with the connection string. If the
  project is connected to a second database — `LAYERO_DATABASE_URL_<SLUG>`;
- its own role in the database with owner rights: it creates and alters
  tables.

The variable appears in the application starting from the next deploy. The
platform doesn't touch your own `DATABASE_URL` variable. More on the project
role's rights — ["What an application can
do"](./connect.md#what-an-application-can-do).

Disconnecting a project deletes its role. The tables and data remain.

## Monitoring

Charts for an hour, a day, or a week, refreshed every 30 seconds:

| Chart | What it shows |
|---|---|
| **Space** | how much is used. The dashed line is the quota: when space runs out, writes stop, but reads keep working |
| **Connections** | how many are open right now. The dashed line is the limit; from 80% the chart turns yellow |
| **Writes per second** | commits |
| **Row changes** | inserts, updates, and deletes |
| **Rolled-back transactions** | rollbacks: a spike usually means an error in the application |
| **Temporary files** | queries that didn't have enough memory for sorting |
| **Reads from memory** | the share of reads served from cache. Below 80% is a reason to look at the queries or the configuration |
| **Deadlocks** | transactions deadlocking each other |

Under the charts — the **Database space** block: used, quota, and the five
largest tables.

## Tables

The database's contents by schema: on the left, a list of tables with
search; on the right, the selected table. Table tabs:

- **Structure** — columns, types, nullability, default values, keys;
- **Data** — the rows themselves, loaded as you scroll.

The **Diagram** toggle shows the same tables as a picture — cards and the
relationships between them. The view is saved in the page address: you can
send the link to a colleague.

The section is read-only: rows can't be edited here. Create and alter
tables in the SQL editor, with your application's migrations, or through
the [Data API](../data-api/index.md).

## SQL editor

Queries run right in the dashboard.

**Bookmarks and history.** There are two tabs on the left. Bookmarks hold
three ready-made queries ("Tables and sizes", "Long-running queries",
"Active queries") and your saved ones. A saved query is visible to everyone
in the organization. History is the last 30 queries, and it's stored only in
this browser.

**Run as.** At the top you choose the role the query runs as:

| Role | What happens |
|---|---|
| **Owner** | the query runs for real, with the database owner's rights |
| **Anonymous**, **Authenticated**, **Server** | a trial run through the eyes of a Data API visitor: the query runs and is rolled back, and the button reads "Check" |

A trial run is handy for checking access policies before a site visitor
sees them.

**Protection against accidents.** Before a query that drops tables or
changes their structure, and before an `UPDATE` or `DELETE` without `WHERE`,
the editor asks for confirmation. Such a query can only be undone by
restoring from a [backup](./backups.md).

**Limits.** Multiple statements run as a single transaction. Postgres
cancels a query that runs longer than 30 seconds on its own, and the
response contains the first 500 rows. All of this is on the
["Limits"](./limits.md#sql-editor-and-layero-db-sql) page.

## Functions

Code inside the database that is called by name from SQL or through the
Data API. The list shows the function's arguments, the result type, and
whether it runs with the owner's rights.

- **Add function** — a new function is created in the `api` schema, in the
  `plpgsql` or `sql` language. The "Run with the database owner's rights"
  checkbox makes it `SECURITY DEFINER`.
- **Test call** — run it with arguments and see the result. Changes are
  rolled back.
- **Version history** — every change is saved, and a previous version can
  be brought back with the "Restore this version" button.

## Roles

Who connects to the database and with what rights. A project's role shows
the project's label, the owner's role shows "owner", and a temporary role
shows the date until which it lives.

**Add role**:

1. Set a name.
2. Optionally, a date in the "Valid until" field. Without a date, the role
   doesn't expire. Handy when an analyst or a contractor needs access for a
   week.
3. Write out the permissions as "command — schema — table" rows. The
   default is `SELECT` on everything. An asterisk in the table field also
   applies to tables that will appear later.
4. **Save the password** — it's shown once.

The role menu has "Reset password" and "Delete role". The owner role can't
be deleted.

## Policies

RLS policies decide which table rows a query returns. Every table has an
RLS toggle and a "Create policy" button.

In the new policy dialog, you choose the table, the command, the roles the
policy applies to, and the type — "Permissive" or "Restrictive". The `USING`
and `WITH CHECK` conditions can be written by hand or taken from a
template: "All rows", "Own rows only", "Authenticated only". At the bottom
of the dialog you see the SQL that will be run.

⚠️ RLS enabled without a single policy closes the table to all roles
except the owner. The dashboard shows such tables separately.

The project role acts on behalf of the owner, and RLS doesn't apply to it.
If your application relies on policies, connect with a separate role — see
["What an application can do"](./connect.md#what-an-application-can-do).

## Extensions

A list of extensions with toggles: you don't have to enable them through
SQL. You can see the version, the schema the extension was installed into,
and what it provides. Turning one off runs `DROP EXTENSION`.

The toggle enables `pgcrypto`, `uuid-ossp`, `citext`, `pg_trgm`,
`unaccent`, `btree_gin`, and `pgvector`. A locked toggle explains why:
the extension can only be enabled through support, or another extension
is needed first. The list comes from the server: if an extension isn't in
it, it isn't on the server either.

## Backups

Backups, the schedule, restore, and dump download are on a separate page,
["Backups"](./backups.md).

## Settings

**Database name.** Only visible in the dashboard. The slug in the
connection string doesn't change when you rename the database, so
applications won't notice anything.

**Allowed addresses.** Who can connect to the database from outside — from
a laptop, from CI, from someone else's hosting. Your projects' applications
on Layero can always connect; there's no need to add them to the list.

- After creation, a shared database lets in from outside only the address
  it was created from: the dashboard tells you so in a pop-up message. A
  dedicated database is open to everyone after creation (`0.0.0.0/0`), see
  ["Who to let in"](./connect.md#who-to-let-in).
- **Add** → an address or a subnet. There are quick options: "My address"
  and "Entire internet" (`0.0.0.0/0`). For the latter, the dashboard asks
  for confirmation.
- A rule can have a note on what it's for and an expiry in the "Valid
  until" field.
- Changes take effect within a minute.

**Blocked addresses.** After a series of wrong passwords, an address is
blocked automatically so that brute-forcing doesn't reach the database.
This section appears only when someone is blocked. The block lifts by
itself, and you can unblock your own address with a button if the password
has already been fixed.

**Delete database** — at the very bottom, see [below](#deleting-a-database).

## Changing the configuration

For a dedicated database, the cores, memory, and disk are changed in the
"⋮" menu on the overview → **Change configuration**. The tabs are the same
as at creation: "Standard" and "Custom".

- Changing the cores or memory restarts the database, usually for half a
  minute. The dialog says so before you confirm: "restart about 30 s" or
  "no downtime".
- The disk can only grow; it can't be reduced.
- For a shared database, the same dialog moves it to a dedicated instance.
  You can move it back to its previous place within a day.

How the money is recalculated on a change — on the
["Pricing"](./pricing.md#changing-the-configuration) page.

## Deleting a database

The "⋮" menu on the card or on the overview → **Delete database**, or
**Settings → Delete database**. The dashboard asks you to type the database
name to confirm.

⚠️ Deletion is irreversible: the data, roles, and all backups disappear
immediately. If you need a backup, download it first in the
["Backups"](./backups.md#download-a-backup) section.

For a dedicated database, the deletion dialog on the database page shows
how much we'll refund for the unused days. How the refund is calculated —
on the ["Pricing"](./pricing.md#deletion-and-refunds) page.
