---
sidebar_position: 7
title: Pricing
description: How much Layero databases cost — a shared database in the Pro plan, prices for a dedicated database and a custom configuration, hourly charges from the balance, changing the configuration, deletion, and what happens if the balance runs short.
---

# Pricing

**A shared database is part of Pro, and a dedicated one is paid by the hour from the organization's balance.** In more detail:

- **A shared database is included in the Pro plan**; nothing extra is charged
  for it.
- **A dedicated database costs from 1 350 ₽ per month** and is paid for
  separately from the subscription, on any plan.
- Money is taken **from the organization's balance by the hour** while the database runs. A calendar month never costs more than the monthly price.
- The price is fixed when you order and doesn't change until you change the
  configuration.
- When you delete a database, the charges simply stop.

Legally all of this is set out in the [database
terms](https://layero.ru/databases-terms) — an annex to the offer; version 2.0
has been in force since 15 November 2026. This page retells them and gives
examples.

## Shared database

| What | How |
|---|---|
| Plan | Pro — monthly or annual. There's no shared database on Free |
| Price | included in Pro |
| How many | one per organization |
| Space | 0.5 GB, can't be extended |
| Backups | included in the plan: once a day, kept for up to 7 days. On by default |

When space runs low, there are two ways out: clean up the database or move it
to a dedicated server — see [below](#moving-from-a-shared-database-to-a-dedicated-one).

### If Pro isn't renewed

If the subscription couldn't be renewed, Pro and the shared database keep working for the whole grace period: 7 days for a monthly subscription, 30 for a yearly one. Details — [Balance and renewal](../billing/lifecycle.md#grace-period).

After the grace period, access to the shared database is closed, and 3 days after closing the database is deleted with its data. Until it's deleted, pay for Pro and access comes back. If you need the data, [download a backup](./backups.md#download-a-backup) before the grace period ends, or move the database to a dedicated one — that doesn't depend on the subscription.

## Dedicated database

A separate server with the cores, memory, and disk you choose. It doesn't
need a Pro subscription: a dedicated database can be ordered on Free too.

### Ready-made configurations

| Cores | Memory | Disk | Price per month |
|---|---|---|---|
| 1 | 1 GB | 8 GB | 1 350 ₽ |
| 1 | 2 GB | 20 GB | 2 200 ₽ |
| 2 | 2 GB | 30 GB | 3 100 ₽ |
| 2 | 4 GB | 40 GB | 4 400 ₽ |
| 4 | 8 GB | 80 GB | 8 950 ₽ |
| 4 | 12 GB | 120 GB | 12 350 ₽ |
| 6 | 12 GB | 180 GB | 15 300 ₽ |
| 8 | 16 GB | 220 GB | 19 800 ₽ |

Prices as of 18 November 2026. They follow the provider's price list and may
change for new orders; a database you have already ordered keeps its price.
The wizard shows the exact amount before you click the button, and that's the
amount fixed in the order.

### Custom configuration

On the «Произвольная» (Custom) tab, cores, memory, and disk are set with
sliders:

| Resource | From | To | Step | Price guide |
|---|---|---|---|---|
| Cores | 1 | 32 | 1 | 550 ₽ per core |
| Memory | 2 GB | 128 GB | 1 GB | 550 ₽ per 1 GB |
| Disk | 10 GB | 2 000 GB | 5 GB | 30.8 ₽ per 1 GB |

The monthly total is rounded up to a multiple of 50 ₽. For example:

- 1 core, 2 GB memory, 10 GB disk — 550 + 1 100 + 308 = 1 958 → **2 000 ₽**;
- 2 cores, 4 GB, 100 GB — 1 100 + 2 200 + 3 080 = 6 380 → **6 400 ₽**.

If the same set is cheaper as a ready-made configuration, the platform orders
that one and charges the lower price. That's why 2 cores, 4 GB, and 40 GB cost
4 400 ₽, as in the table above, not 4 550 ₽ by the sliders.

### Dedicated database backups

Backups are a paid option, off by default. The price depends on the disk and
the number of backups kept. Examples for one backup:

| Database disk | One backup per month |
|---|---|
| 8 GB | 100 ₽ |
| 40 GB | 300 ₽ |
| 80 GB | 600 ₽ |
| 220 GB | 1 500 ₽ |

The enable dialog shows the exact amount before you confirm. The cost of
backups is taken from the balance together with the database charge. How to turn
them on — on the [Backups](./backups.md#dedicated-database) page.

## How payment works

**Who pays.** The organization: the database's cost is taken from its
balance. You top the balance up on the organization's **«Оплата и тариф»**
(Billing & plan) page — by card, SBP, T-Pay, SberPay, ЮMoney, or Alfa Pay.

**Ordering.** You can order a database if the balance holds at least its
monthly price. This is a condition of the order, not a prepayment: the money
stays on the balance and is taken by the hour. If it falls short and auto
top-up is on, the balance is topped up to the required amount before the
order.

**Charging.** The order dialog shows the price per month and per hour. The cost is counted by the hour while the database runs and never exceeds the
monthly price for a calendar month. Spending is shown on the «Оплата и тариф»
page.

**Receipts** under Federal Law 54-FZ arrive by email: for a balance top-up —
right away, for charges — as one receipt for the month. No VAT.

## If the balance runs short

| When | What happens |
|---|---|
| Less than a day's worth of money is left | you get an email |
| The first day without money | charges continue, the database works. If auto top-up is on, we try to top up the balance |
| One more day later | access closes: connections and queries stop, the Data API doesn't respond, the data is intact, nothing more is charged |
| 3 days after access closes | the database is deleted together with its data |

Until the database is deleted, top up the balance and access comes back. We
email you when access closes and when the database is deleted.

⚠️ Before deleting, we try to take a backup, but we don't guarantee that it
will succeed and be kept. If the data matters, don't let it get that far: keep
a reserve on the balance or turn on auto top-up, and keep backups on.

## Changing the configuration

The «⋮» menu on the database overview → «Изменить конфигурацию» (Change configuration).

- The new hourly price applies from the moment of the change. There are no
  extra charges or recalculations for past hours.
- You can move to a **more expensive** one if the balance holds the
  difference between the monthly prices.
- The **disk** only grows; it can't be shrunk.
- Changing cores or memory may briefly restart the database — the dialog
  warns you before you confirm. Growing the disk happens without
  interruption.

### Moving from a shared database to a dedicated one

A shared database has a «Перевести на выделенный» (Move to dedicated) button on its «Настройки» (Settings) page: the database moves to a separate server along with the data. Payment works as for a new dedicated
database: the balance must hold the monthly price, then it's charged by the
hour. Within a day the database can be moved back.

## Deletion

You can delete a dedicated database at any time. Charges stop from the hour
of deletion; what was charged before that stays in the month's spending.
There is no prepayment, so there's nothing to refund.

Money on the balance stays with the organization: you can spend it on other
services or withdraw it — [contact support](../support.md).

If you're a consumer, you have the right to refuse the service at any time and
get the money back for services not rendered under Article 32 of the Russian
Consumer Rights Protection Law.

## Reliability

We make reasonable efforts to keep databases running continuously, but we
don't promise operation without interruptions. If a dedicated database is
unavailable through our fault for more than 24 hours in a row, you have the
right to ask for a price reduction for that time — write to support. Details —
section 10 of the [database terms](https://layero.ru/databases-terms).

## Questions

**Do I need Pro for a dedicated database?** No. A dedicated database is paid
for separately and is available on any plan.

**What happens to the shared database if I don't renew Pro?** After the grace period, access to it is closed, and 3 days later the database is deleted with its data — see [If Pro isn't renewed](#if-pro-isnt-renewed).

**Can I have two shared databases?** No, there's one shared database per
organization. Make the second and further ones dedicated.

**Do databases count toward the plan limits?** The databases themselves
don't. Only Data API calls and file storage count toward the limits, see
[Usage & limits](../billing/usage.md).
