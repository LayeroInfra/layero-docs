---
sidebar_position: 6
title: Databases from the CLI
description: The layero db commands — listing databases, creating one, connecting and disconnecting a project, running SQL from the terminal and in CI. What can't be done from the terminal and why.
---

# Databases from the CLI

**The `layero db` commands create databases, connect them to projects and run SQL right from the terminal** — for you in the middle of work and for an agent in CI. Everything they do is visible in the dashboard too: a database created from the terminal shows up in the
list right away.

Sign in once — the CLI opens a browser:

```bash
npx layero@latest login
```

## Commands

| Command | What it does |
|---|---|
| `layero db list` | The organization's databases: name, slug, state, placement, PostgreSQL version, used space and price |
| `layero db create <name>` | Create a shared database from your plan. The connection string is printed **once** |
| `layero db connect <database>` | Connect a project to a database: the connection string arrives in the project's variables |
| `layero db disconnect <database>` | Disconnect a project from a database: the variable goes away with the next build |
| `layero db sql <database> "<SQL>"` | Run a query or a script, including from a file |
| `layero db delete <database>` | Delete a database with its data and backups |

Every command has an `--org <slug>` flag. You can refer to a database by name, slug (its short Latin name) or id — whichever is convenient.

## Which organization

If you have one organization, the CLI uses it. If you have several, it uses
your **personal** one. A team organization has to be specified explicitly:

```bash
npx layero@latest db list --org moya-komanda
```

The CLI won't pick a team organization at random: its databases belong to the team, and dedicated ones are paid from its balance. To list your
organizations — `layero orgs list`.

## Listing databases

```bash
npx layero@latest db list
```

```
CRM  crm  active  Shared  PG18  API  проектов: 2  0.01 ГБ из 0.50 ГБ
Аналитика  analitika  active  выделенный  PG17  без API  проектов: 1  0.09 ГБ из 40.00 ГБ
    4 400 ₽/мес
```

The CLI prints its output in Russian (`проектов: N` means "projects: N",
`ГБ из` means "GB of"). Each line shows:

- **placement** — `Shared` for a shared database from your plan,
  `выделенный` ("dedicated") for a dedicated database;
- **API** or **без API** ("no API") — whether the database has
  [Data API](../data-api/index.md) enabled;
- **used space out of the quota** — for a shared database the quota is set
  by the plan, for a dedicated one by its disk.

A dedicated database has a second line under the main one: the monthly
price. If the balance ran short, it also shows what is happening to the
database:

| Line | What it means |
|---|---|
| `4 400 ₽/мес` | "4 400 ₽ a month": all is well |
| `оплата не прошла, работает по 12 декабря` | "payment failed, works until 12 December": the balance ran short, the database still works for now — top up the balance |
| `доступ закрыт за неоплату, удалим 15 декабря` | "access closed for non-payment, we'll delete it on 15 December": the database is stopped and will be deleted with its data on that date |

What's behind each state is explained on the
[Pricing](./pricing.md#if-the-balance-runs-short) page.

## Creating a database

```bash
npx layero@latest db create crm
```

The command waits for the database to be ready (usually about 20 seconds)
and prints the connection string:

```
✓ база «crm» готова в организации valya

  postgresql://<role>:<password>@db.layero.ru:5432/<database>?sslmode=verify-full

  Пароль показывается один раз — сохраните строку подключения.
  Ключи Data API для фронтенда: layero data env
```

The output says that the database "crm" is ready in the organization
`valya`, that the password is shown once so you should save the connection
string, and that the Data API keys for the frontend are available via
`layero data env`.

:::warning[The connection string is printed once]

The CLI won't print it a second time. If you've lost the string, you can
view or change the password in the dashboard: database card menu →
«Подключить» (Connect) → «Показать пароль» (Show password) or «Сбросить пароль» (Reset password). Changing the password
disconnects everything connected with the old one, so it's safer to save
the output right away.

:::

If the database isn't ready within a minute and a half, the command stops
waiting and prints `база ещё готовится — строка подключения ниже заработает,
как только она поднимется` ("the database is still being prepared — the
connection string below will work as soon as it's up"). It prints the
string anyway.

### What can't be created from the terminal

Only a **shared database from your plan** can be created from the CLI. The
command refuses the `--dedicated`, `--cpu`, and `--ram` flags and points you
to the wizard in the dashboard:

```
выделенный инстанс из терминала не заказывается
```

("a dedicated instance can't be ordered from the terminal").

A dedicated database can't be ordered from the CLI: it is paid from the balance, and you need to see the price before ordering. The dashboard shows the configurations and the price — order it there, see
[Creating a database](./create.md#from-the-dashboard).

The `--gb` flag no longer works either. A shared database's size is set by
the plan, a dedicated one's by the configuration's disk, and you can't pick
it as a number at creation time.

## Connecting a project

Run it from a project directory linked to Layero (`layero link` or the
first `layero deploy`):

```bash
npx layero@latest db connect crm
```

From another directory, specify the project explicitly:

```bash
npx layero@latest db connect crm --project moy-sajt
```

Connecting has two effects:

1. **The connection string arrives in the project's variables** — in
   `LAYERO_DATABASE_URL`, and for a second database of the same project, in
   `LAYERO_DATABASE_URL_<SLUG>`. The application sees it starting with the
   next build.
2. **The project's domains become allowed for this database's Data API.**
   If a site calls the database from the browser and gets a CORS refusal,
   first check whether the project is connected.

The project gets its own role in the database. What it can do is covered in
[What an application can do](./connect.md#what-an-application-can-do).

## Disconnecting a project

```bash
npx layero@latest db disconnect crm
```

The project's role is deleted immediately, the variable leaves the
environment with the next build, and the project's domains are no longer
allowed for the Data API. Tables and data stay in the database, and other projects keep working. From another folder, name the project the same way, with `--project`.

## Deleting a database

```bash
npx layero@latest db delete crm
```

In a terminal the command asks for confirmation. In CI and for an agent,
confirm with the `--yes` flag; without it the command refuses with the
`confirmation_required` code.

⚠️ Deletion can't be undone: data, roles and backups disappear at once. If
you need a backup, [download it](./backups.md#download-a-backup) first.

## Running SQL

The query goes right after the database name:

```bash
npx layero@latest db sql crm "select count(*) from orders"
```

A script from a file goes with `--file`. You can also pipe a script in — the command reads standard input by itself. That's handy for running migrations in CI:

```bash
npx layero@latest db sql crm --file migrations/0001.sql
cat migrations/*.sql | npx layero@latest db sql crm
```

A script of several statements runs as **a single transaction**: if one
fails, all of them are rolled back. The response comes for each statement,
so a ten-statement migration doesn't look like "nothing ran":

```bash
npx layero@latest db sql crm "
  create table if not exists tags (id bigint generated always as identity primary key, name text not null);
  insert into tags (name) values ('new'), ('important');
  select * from tags;
"
```

The query runs as the database owner — with the same permissions as the SQL
editor in the dashboard. The limits are shared too:

| What | Value |
|---|---|
| Time per query | 30 seconds, after which Postgres cancels it itself |
| Rows in the response | the first 500; the rest are cut off and marked "truncated" |
| Length of a single value | 4,096 characters, then an ellipsis |
| Statements per script | up to 200 |
| Query length | up to 20,000 characters |

For data exports, long migrations, and anything that hits these limits,
connect directly with `psql` or a driver using the
[connection string](./connect.md).

## In CI and for agents

Browser sign-in isn't possible in CI — create a token and pass it in the
`LAYERO_TOKEN` variable:

```bash
npx layero@latest token create ci
```

```bash
LAYERO_TOKEN=<token> npx layero@latest db sql crm "select 1" --json
```

With the `--json` flag, and also when output isn't going to a terminal, the
CLI prints JSON-lines events, one per line:

| Command | Event | What's in it |
|---|---|---|
| `db list` | `databases` | `org` and a `databases` array — the same fields as in the dashboard |
| `db create` | `database_created` | `org`, `name`, `connection_string` — the only time the string comes with the password |
| `db connect` | `database_connected` | `org`, `database`, `project` |
| `db disconnect` | `database_disconnected` | `org`, `database`, `project` |
| `db delete` | `database_deleted` | `org`, `database` |
| `db sql` | `query_result` | `columns`, `rows`, `row_count`, `truncated`, `statements` |

Refusals come as an `error` event with a code and a ready-made next step in
`next_action`. Codes you may see with `layero db`:

| Code | When |
|---|---|
| `org_unknown` | the CLI couldn't pick the organization itself — pass `--org` |
| `database_unknown` | the organization has no database with that name, slug, or id |
| `project_unknown` | it's unclear which project to connect — run from the project directory or pass `--project` |
| `sql_missing` | `db sql` was called without a query |
| `bad_format` | `db sql` got the query in two ways at once (as text and with `--file`) or couldn't read the file |
| `confirmation_required` | `db delete` outside a terminal without `--yes` |
| `gb_not_supported` | `db create --gb`: the size isn't chosen this way |
| `dedicated_needs_panel` | `db create --dedicated`, `--cpu`, or `--ram`: a dedicated database is ordered in the dashboard |

The full list of events and codes is in
[JSON events schema](../cli/json-events.md).

## Data API from the terminal

Data API keys, allowed sites, and access levels are configured with the
`layero data` commands:

```bash
npx layero@latest data enable --db crm        # enable Data API
npx layero@latest data env                    # address and public key for the frontend
npx layero@latest data methods --db crm       # tables and functions with access levels
npx layero@latest data grant entries --get visitor --db crm
npx layero@latest data keys issue --kind secret --db crm
```

How access levels and keys work is covered in the
[Data API](../data-api/index.md) section.
