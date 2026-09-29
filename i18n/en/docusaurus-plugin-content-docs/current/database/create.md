---
sidebar_position: 2
title: Creating a database
description: Creating a Layero database from the dashboard and from the CLI — a shared database from the Pro plan or a dedicated one with its own configuration, PostgreSQL version, payment, how long to wait, and what to do on failure.
---

# Creating a database

:::info[Beta]

The section isn't open to all organizations yet. How to get access and what
to expect from the beta — on the ["Databases"](./index.md) page.

:::

## From the dashboard

1. Open [app.layero.ru](https://app.layero.ru) and pick an organization.
2. In the left menu — **Databases**, in the "Services" group. No such
   item — the organization doesn't have access yet, see
   ["Databases"](./index.md).
3. Click **Create database**. The "New database" dialog opens.
4. **Name** — anything, up to 60 characters. It's only visible in the
   dashboard and can be changed at any time.
5. **Database type** — PostgreSQL. ClickHouse and Valkey are marked
   "Coming soon".
6. **Configuration** — [shared or dedicated](#which-database-to-choose).
7. **PostgreSQL version** — there's nothing to choose for a shared
   database; for a dedicated one — any of the offered versions, the newest
   by default.
8. Click **Create database** if the database is shared, or
   **Order for N ₽/mo** if it's dedicated.

If the dialog was opened from a project page (**Project → Database →
Create database**), the new database is connected to that project right
away.

### How long to wait

**A shared database** is ready in under a minute. The dashboard tells you
which address is allowed to connect from outside: "Allowed your address … —
nothing needs to be done for applications on Layero".

**A dedicated database** takes **7–13 minutes** to come up. The card in the
list shows the provisioning step and updates itself, no need to press F5.
You can close the dialog: provisioning continues.

:::note[No email notification]

We don't send a notification when it's ready — not by email, not by
Telegram. Keep the tab open or check back later: the card shows the
status.

:::

### Password

The creation dialog doesn't show the password. The connection string with
the password is in the card menu → **Connect**: there you can reveal the
password with a button or reset it. More — ["Connecting to a
database"](./connect.md).

## Which database to choose

### Shared database

The **Shared CPU** tile on the "Standard" tab. The database lives on a
shared Layero server: shared processor, 0.5 GB of space, nothing to choose.
Click and go.

- Included in the **Pro** plan, nothing is charged for it separately.
- **One per organization.** Once the organization has one, the tile isn't
  in the wizard.
- On the Free plan, the tile opens the Pro checkout.

### Dedicated database

A separate server just for you. The configuration is set on one of two
tabs to the right of the "Configuration" heading:

- **Standard** — preset configurations: tiles with cores, memory, disk,
  and the monthly price;
- **Custom** — three sliders: cores, memory, and disk. The limits and step
  are shown under each one, and the price is calculated instantly.

A dedicated database is available **on any plan**, no Pro subscription
needed. It's billed separately, once a month. Prices and how a custom
configuration is calculated — on the
["Pricing"](./pricing.md#dedicated-database) page.

### Payment when ordering

The amount is shown in the dialog footer before you click the button:
"N ₽ per month" and an approximate daily price. The "?" sign next to it
explains when we charge:

- **by card** — the amount is held immediately and charged when the
  database is ready. If the database fails to come up, we release the hold;
- **by another method** (SBP, T-Pay, SberPay, ЮMoney, Alfa Pay) — the
  amount is charged immediately on ordering. If the database fails to come
  up, we refund it in full.

The **organization owner** pays — with the payment method linked to their
account. If there's no payment method, the button reads "Link a card": the
dashboard takes you to link one and brings you back to the order with your
choices saved.

By clicking "Order for N ₽/mo", you accept the
[offer](https://layero.ru/offer) and the [database
terms](https://layero.ru/databases-terms), and agree to monthly automatic
charges. Details — ["Pricing"](./pricing.md#how-payment-works).

## From the CLI

```bash
npx layero@latest db create moya-baza
```

The command waits for the database to be ready and prints the connection
string **once** — save it right away. If you lose it, you can view the
password in the dashboard: card menu → **Connect** → "Show password".

If you have several organizations, the CLI uses your personal one. Specify
a team organization explicitly:

```bash
npx layero@latest db create moya-baza --org moya-komanda
```

Only a **shared** database can be created from the CLI. A dedicated one is
ordered in the dashboard: it has a price, and there's nowhere in the
terminal to confirm the amount. All commands — ["Databases from the
CLI"](./cli.md).

## Extensions

Extensions are enabled on a ready database, in the **Extensions** section:
`pgcrypto`, `uuid-ossp`, `citext`, `pg_trgm`, `unaccent`, `btree_gin`,
and `pgvector`.
More — ["Working in the dashboard"](./panel.md#extensions).

## What's next

- **Connect it to a project.** The connection string arrives in the build
  automatically, in the `LAYERO_DATABASE_URL` variable — no need to enter it
  by hand. In the dashboard: the "Connect project" button on the database
  card. From the CLI: `layero db connect moya-baza` from the project
  directory.
- **Connect directly** — [connection string, TLS, and access by
  address](./connect.md).
- **Expose the database over HTTP** without your own server — [Data
  API](../data-api/index.md).

## If it didn't work

| What you see | What it means |
|---|---|
| No "Databases" item in the menu | The organization doesn't have access yet. Message us in the dashboard chat |
| "The section isn't open for your organization yet" | Same thing |
| No Shared CPU tile | The organization already has a shared database. Create the next one as dedicated |
| "the organization already has a Shared CPU database" | The CLI's response to a second shared database — same thing |
| The Shared CPU tile opens the Pro checkout | A shared database is only included in Pro. A dedicated one can be ordered on Free too |
| "A paid instance is paid for by the account owner…" | Any administrator can order, but the organization owner pays. Ask them to link a payment method |
| "the previous instance is still being prepared" | Only one order runs at a time. Wait until the first database is ready |
| A "didn't come up" card with a reason | Creation failed; the money wasn't charged or was refunded. In the card menu — "Order again" |
| Provisioning takes longer than 20 minutes | Message us. After 90 minutes the order is canceled automatically and the money is refunded |

The dashboard explains the failure reason in plain words. If it's unclear
what to do, copy the full failure text and send it to us in the chat.
