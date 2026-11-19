---
sidebar_position: 3
title: Working in the dashboard
description: What's on a Layero database page — overview, monitoring, tables, SQL editor, functions, triggers, roles, RLS policies, extensions, settings, connected projects, renaming and deletion.
---

# Working in the dashboard

**You work with a database on its page in the [dashboard](https://app.layero.ru):**
«Базы данных» (Databases) in the left menu → the database card. The left menu
switches to the database menu, and a switcher appears above it — handy for
jumping between the organization's databases without going back to the list.

The dashboard is in Russian, so labels are given as they appear on screen,
with a translation in brackets.

Database menu sections:

| Group | Sections |
|---|---|
| — | «Обзор» (Overview), «Мониторинг» (Monitoring), «Настройки» (Settings) |
| «База» (Database) | «Таблицы» (Tables), «SQL-редактор» (SQL editor), «Функции» (Functions), «Триггеры» (Triggers), «Роли» (Roles), «Политики» (Policies), «Расширения» (Extensions), «Резервные копии» (Backups) |
| «Сервисы» (Services) | «Data API», «Авторизация» (Sign-in), «Файлы» (Files) — this is the [Data API](../data-api/index.md) |

## Database list

The «Базы данных» (Databases) page shows all the organization's databases as
cards. On a card:

- **name** and price: «входит в тариф» (included in the plan) for a shared
  database, «N ₽/мес» (N ₽/mo) for a dedicated one;
- **compute**: «Shared CPU» for a shared database, or cores and memory for a
  dedicated one;
- **space**: how much of the quota is used, as a bar;
- **projects** the database is given to, and a «Подключить проект» (Connect
  project) button.

The «⋮» menu on the card: open the database, get the connection string,
rename, delete.

The database's state is shown right on the card:

| What's on the card | What's happening |
|---|---|
| «Готовим базу» / «Поднимаем инстанс» (Preparing the database) and steps | the database is being created. The list updates by itself |
| «не поднялся» (didn't come up) and a reason | creation failed and nothing was charged for it. In the menu — «Заказать ещё раз» (Order again) and «Убрать из списка» (Remove from list) |
| «Перезапускается» (Restarting) | the configuration is changing, usually about half a minute |
| «Переезжает» (Moving) and steps | a shared database is moving to a dedicated server |
| «платёж не прошёл» (payment failed) | the balance ran short, the database still works for now. Top up the balance |
| «доступ закрыт» (access closed) | the database is stopped for non-payment, the deletion date is shown. Top up the balance and access comes back |
| «удалена за неоплату» (deleted for non-payment) | the database is gone. If a backup was taken before deletion, it can be downloaded in the settings |

What's behind the payment rows — on
[Pricing](./pricing.md#if-the-balance-runs-short).

## Overview

The database at a glance:

- **type** — the PostgreSQL version;
- **configuration** — «Shared CPU · 0,5 ГБ» or cores, memory and disk;
- **space** — used out of the quota. The figure turns yellow from 75 % and
  red from 90 %;
- **backups** — when the last one was taken.

Below are space and write charts for the day, the state of the services
(API, sign-in, files) and the «Подключённые проекты» (Connected projects)
block.

### Connected projects

Here you see which projects the database is given to and under which name
the variable arrives. You can connect a project from the database list or
from the project page: project → «База данных» (Database) → «Подключить к
базе» (Connect to a database).

What a connected project gets:

- the `LAYERO_DATABASE_URL` variable with the connection string. If the
  project is connected to a second database — `LAYERO_DATABASE_URL_<SLUG>`;
- its own role in the database with owner rights: it creates and alters
  tables.

The variable reaches the app with the next build. The platform doesn't
touch your own `DATABASE_URL` variable. More on the project role's rights —
[What an application can do](./connect.md#what-an-application-can-do).

Disconnecting a project deletes its role. Tables and data stay.

## Monitoring

Charts for an hour, a day or a week, refreshed every 30 seconds:

| Chart | What it shows |
|---|---|
| «Место» (Space) | how much is used. The dashed line is the quota: when space runs out, writes stop and reads keep working |
| «Подключения» (Connections) | how many are open right now. The dashed line is the limit; from 80 % the chart turns yellow |
| «Запись в секунду» (Writes per second) | commits |
| «Изменения строк» (Row changes) | inserts, updates and deletes |
| «Отменённые транзакции» (Rolled-back transactions) | rollbacks: a spike usually means an error in the app |
| «Временные файлы» (Temporary files) | queries that didn't have enough memory to sort |
| «Чтения из памяти» (Reads from memory) | the share of reads served from cache. Below 80 % is a reason to look at the queries or the configuration |
| «Взаимные блокировки» (Deadlocks) | transactions that waited for each other until the database cancelled one of them |

Under the charts is the «Место базы» (Database space) block: used, quota and
the five largest tables.

## Tables

The database's contents by schema: on the left a list of tables with
search, on the right the selected table. Table tabs:

- «Структура» (Structure) — columns, types, nullability, defaults, keys;
- «Данные» (Data) — the rows themselves, loaded as you scroll.

The «Диаграмма» (Diagram) switch shows the same tables as a picture — cards
and the relations between them. The view is saved in the page address: you
can send the link to a colleague.

The section is read-only: rows can't be edited here. Create and alter
tables in the SQL editor, with your app's migrations or through the
[Data API](../data-api/index.md).

## SQL editor

Queries run right in the dashboard.

**Bookmarks and history.** There are two tabs on the left. Bookmarks hold
three ready-made queries — «Таблицы и размеры» (Tables and sizes), «Долгие
запросы» (Long queries), «Активные запросы» (Active queries) — and your
saved ones. A saved query is visible to everyone in the organization.
History is the last 30 queries, kept only in this browser.

**Run as.** At the top you choose the role the query runs as:

| Role | What happens |
|---|---|
| «Владелец» (Owner) | the query runs for real, with the database owner's rights |
| «Аноним», «Авторизованный», «Сервер» (Anonymous, Authenticated, Server) | a trial run as a Data API visitor would see it: the query runs and is rolled back, and the button reads «Проверить» (Check) |

A trial run is handy for checking access policies before a site visitor
meets them.

**Protection against accidents.** Before a query that drops tables or
changes their structure, and before an `UPDATE` or `DELETE` without
`WHERE`, the editor asks again. Such a query can only be undone by restoring
from a [backup](./backups.md).

**Limits.** Several statements run as one transaction. Postgres cancels a
query longer than 30 seconds by itself, and the response has the first 500
rows. All of this is on [Limits](./limits.md#sql-editor-and-layero-db-sql).

## Functions

Code inside the database that is called by name from SQL or through the
Data API. The list shows the function's arguments, the result type and
whether it runs with the owner's rights.

- «Добавить функцию» (Add function) — a new function is created in the
  `api` schema, in `plpgsql` or `sql`. With the «Выполнять с правами
  владельца базы» (Run with the database owner's rights) box ticked, the
  function runs with the owner's rights whoever calls it
  (`SECURITY DEFINER`).
- «Пробный вызов» (Trial call) — run it with arguments and see the result.
  Changes are rolled back.
- «История версий» (Version history) — every change is saved, and an
  earlier version comes back with «Восстановить эту версию» (Restore this
  version).

## Triggers

Functions the database calls by itself when rows are added, changed or
deleted in a table. For example, to set the time of a change or to log it.

The «Создать триггер» (Create trigger) button: pick the table, the events,
the moment — before the write or after it — and the function. The function
must return `trigger`. A trigger can be turned off without deleting it.

## Roles

Who connects to the database and with what rights. A project's role shows
the project's label, the owner's role shows «владелец» (owner), and a
temporary role shows the date until which it lives.

«Добавить роль» (Add role):

1. Set a name.
2. Optionally, a date in the «Действует до» (Valid until) field. Without a
   date the role doesn't expire. Handy when an analyst or a contractor needs
   access for a week.
3. Write out the rights as "command — schema — table" rows. The default is
   `SELECT` on everything. An asterisk in the table field also covers tables
   that appear later.
4. **Save the password** — it's shown once.

The role menu has «Сбросить пароль» (Reset password) and «Удалить роль»
(Delete role). The owner role can't be deleted.

## Policies

RLS policies decide which rows of a table a query returns. Every table has
an RLS switch and a «Создать политику» (Create policy) button.

In the new policy dialog you choose the table, the command, the roles the
policy applies to and the type — «Разрешающая» (Permissive) or
«Ограничивающая» (Restrictive). The `USING` and `WITH CHECK` conditions can
be written by hand or taken from a template: «Все строки» (All rows),
«Только свои» (Own rows only), «Только авторизованные» (Authenticated only).
The bottom of the dialog shows the SQL that will run.

⚠️ RLS turned on without a single policy closes the table to every role
except the owner. The dashboard lists such tables separately.

The project role acts on behalf of the owner, and RLS doesn't apply to it.
If your app relies on policies, connect with a separate role — see
[What an application can do](./connect.md#what-an-application-can-do).

## Extensions

A list of extensions with switches: you don't have to turn them on through
SQL. You can see the version, the schema the extension went into and what it
gives you. Turning one off runs `DROP EXTENSION`.

A switch turns on `pgcrypto`, `uuid-ossp`, `citext`, `pg_trgm`,
`unaccent`, `btree_gin` and `pgvector`. A locked switch explains why: the
extension can only be turned on through support, or another extension is
needed first. The list comes from the server: if an extension isn't in it,
it isn't on the server either.

## Backups

Backups, the schedule, restore and dump download are on a separate page,
[Backups](./backups.md).

## Settings

**Database name.** Only visible in the dashboard. The slug in the
connection string doesn't change when you rename the database, so apps
won't notice anything.

**Allowed addresses.** Who can connect to the database from outside — from
a laptop, from CI, from another hosting. Your projects' apps on Layero
always connect; there's no need to add them to the list.

- After creation, a shared database lets in from outside only the address
  it was created from: the dashboard says so in a pop-up message. A
  dedicated database is open to everyone after creation (`0.0.0.0/0`), see
  [Who to let in](./connect.md#who-to-let-in).
- «Добавить» (Add) → an address or a subnet. There are quick options: «Мой
  адрес» (My address) and «Весь интернет» (Entire internet, `0.0.0.0/0`).
  For the latter the dashboard asks again.
- A rule can have a note on what it's for and an expiry in the «Действует
  до» (Valid until) field.
- Changes take effect within a minute.

«Удалить базу» (Delete database) — at the very bottom, see
[below](#deleting-a-database).

## Changing the configuration

For a dedicated database, cores, memory and disk are changed in the «⋮»
menu on the overview → «Изменить конфигурацию» (Change configuration). The
tabs are the same as at creation: «Стандартная» (Standard) and
«Произвольная» (Custom).

- Changing cores or memory restarts the database, usually for half a
  minute. The dialog says so before you confirm: «перезапуск около 30 с»
  (restart of about 30 s) or «без перерыва» (no downtime).
- The disk only grows; it can't be made smaller.
- A shared database is moved to a dedicated server with the «Перевести на
  выделенный» (Move to dedicated) button in «Настройки» (Settings). You can
  move it back within a day.

How the money changes on a switch — on
[Pricing](./pricing.md#changing-the-configuration).

## Deleting a database

The «⋮» menu on the card or on the overview → «Удалить базу» (Delete
database), or «Настройки» → «Удалить базу» (Settings → Delete database). The
dashboard asks you to type the database name to confirm.

⚠️ Deletion can't be undone: the data, roles and all backups disappear at
once. If you need a backup, download it first in
[Backups](./backups.md#download-a-backup).

For a dedicated database, charges stop from the hour of deletion; there is
no prepayment, so there is nothing to refund — see
[Pricing](./pricing.md#deletion).
