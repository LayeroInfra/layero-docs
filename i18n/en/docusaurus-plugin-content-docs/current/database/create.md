---
sidebar_position: 2
title: Creating a database
description: Creating a Layero database from the dashboard and the CLI — a shared database from the Pro plan or a dedicated one with its own configuration, the PostgreSQL version, payment, how long it takes and what to do if it fails.
---

# Creating a database

**A shared database is created in the dashboard or with a CLI command, a
dedicated one only in the dashboard.** A shared database is ready in under a
minute, a dedicated one in 7–13 minutes.

The dashboard is in Russian, so labels below are given as they appear on
screen, with a translation in brackets.

## From the dashboard

1. Open [app.layero.ru](https://app.layero.ru) and pick an organization.
2. In the left menu — «Базы данных» (Databases), in the «Сервисы»
   (Services) group.
3. Click «Создать базу» (Create database). The «Новая база данных» (New
   database) dialog opens.
4. **Name** — anything, up to 60 characters. It's only visible in the
   dashboard and can be changed at any time.
5. **Database type** — PostgreSQL. ClickHouse and Valkey are marked «Скоро»
   (Coming soon).
6. **Configuration** — [shared or dedicated](#which-database-to-choose).
7. **PostgreSQL version** — nothing to choose for a shared database; for a
   dedicated one, any of the versions offered, the newest by default.
8. Click «Создать базу» (Create database) if the database is shared, or
   «Создать за N ₽/мес» (Create for N ₽/mo) if it's dedicated.

If the dialog was opened from a project page (project → «База данных»
(Database) → «Создать базу»), the new database is connected to that project
right away.

### How long to wait

**A shared database** is ready in under a minute. The dashboard tells you
which address is allowed to connect from outside: «Разрешили ваш адрес … —
для приложений на Layero делать ничего не нужно» (Your address is allowed …
nothing needs to be done for apps on Layero).

**A dedicated database** takes 7–13 minutes. The card in the list shows the
preparation step and updates by itself. You can close the dialog:
preparation goes on.

:::note[No email notification]

We don't send a notification when it's ready — not by email, not in
Telegram. Keep the tab open or check back later: the card shows the state.

:::

### Password

The creation dialog doesn't show the password. The connection string with
the password is in the card menu → «Подключить» (Connect): there you can
reveal the password with a button or reset it. More —
[Connecting to a database](./connect.md).

## Which database to choose

### Shared database

The «Shared CPU» tile on the «Стандартная» (Standard) tab. The database
lives on a shared Layero server: shared processor, 0.5 GB of space, nothing
to choose. Click and go.

- Included in the **Pro** plan, nothing is charged for it separately.
- **One per organization.** Once the organization has one, the tile isn't in
  the wizard.
- On the Free plan, the tile opens the Pro checkout.

### Dedicated database

A separate server just for you. The configuration is set on one of two tabs
to the right of the «Конфигурация» (Configuration) heading:

- «Стандартная» (Standard) — ready-made configurations: tiles with cores,
  memory, disk and the monthly price;
- «Произвольная» (Custom) — three sliders: cores, memory and disk. The
  limits and step are shown under each, and the price is calculated at
  once.

A dedicated database is available **on any plan**, no Pro subscription
needed. It is paid separately, by the hour from the organization's balance.
Prices and how a custom configuration is calculated are on
[Pricing](./pricing.md#dedicated-database).

### Payment when ordering

The amount is shown at the bottom of the dialog before you click the button:
the price per month and per hour. It is taken from the organization's
balance every hour while the database runs, and starts counting only once
the database is ready.

You can order a database if the balance holds at least its monthly price.
This is not a prepayment: the money stays on the balance and goes out hour
by hour. If it falls short, the dashboard opens a top-up with the missing
amount filled in and brings you back to the order.

By clicking «Создать» (Create), you accept the
[offer](https://layero.ru/offer) and the
[database terms](https://layero.ru/databases-terms). Details —
[Pricing](./pricing.md#how-payment-works).

## From the CLI

```bash
npx layero@latest db create moya-baza
```

The command waits for the database to be ready and prints the connection
string **once** — save it right away. If you lose it, you can view the
password in the dashboard: card menu → «Подключить» (Connect) → «Показать
пароль» (Show password).

If you have several organizations, the CLI uses your personal one. Name a
team organization explicitly:

```bash
npx layero@latest db create moya-baza --org moya-komanda
```

Only a **shared** database can be created from the CLI. A dedicated one is
ordered in the dashboard: it has a price, and there's nowhere in the
terminal to confirm the amount. All commands — [Databases from the
CLI](./cli.md).

## Extensions

Extensions are turned on in a ready database, in the «Расширения»
(Extensions) section — see [Working in the dashboard](./panel.md#extensions).

## What's next

- **Connect it to a project.** The connection string arrives in the build
  by itself, in the `LAYERO_DATABASE_URL` variable — no need to enter it by
  hand. In the dashboard: the «Подключить проект» (Connect project) button
  on the database card. From the CLI: `layero db connect moya-baza` in the
  project folder.
- **Connect directly** — [connection string, encryption and access by
  address](./connect.md).
- **Open the database over HTTP** without a server of your own —
  [Data API](../data-api/index.md).

## If it didn't work

| What you see | What it means |
|---|---|
| No «Shared CPU» tile | The organization already has a shared database. Create the next one as dedicated |
| «база с Shared CPU у организации уже есть» (the organization already has a Shared CPU database) | The CLI's answer to a second shared database — the same thing |
| The «Shared CPU» tile opens the Pro checkout | A shared database is only part of Pro. A dedicated one can be ordered on Free too |
| «предыдущий инстанс ещё готовится» (the previous one is still being prepared) | Only one dedicated database is prepared at a time. Wait until the first one is ready |
| A «не поднялся» (didn't come up) card with a reason | Creation failed and nothing was charged for it. In the card menu — «Заказать ещё раз» (Order again) |
| Preparation takes longer than 20 minutes | Message us. After 90 minutes the order is cancelled by itself |

The dashboard explains the reason for a failure in plain words. If it's
unclear what to do, copy the whole text and send it to us in the chat.
