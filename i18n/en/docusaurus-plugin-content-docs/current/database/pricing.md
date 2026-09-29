---
sidebar_position: 7
title: Pricing
description: How much Layero databases cost — a shared database in the Pro plan, prices for a dedicated database and a custom configuration, payment and renewal, changing the configuration, refunds on deletion, and what happens if you don't pay.
---

# Pricing

:::info[Beta]

The section isn't open to all organizations yet. How to get access and what
to expect from the beta is covered on the [Databases](./index.md) page.

:::

In short:

- **A shared database is included in the Pro plan**; nothing is charged for
  it separately.
- **A dedicated database costs from 600 ₽ a month** and is paid for
  separately from the subscription, on any plan.
- Payment is **one month in advance**, then automatically every month.
- The price is fixed when you order and doesn't change until you change the
  configuration.
- When you delete a database, **we refund the unused days**.

Legally, all of this is set out in the [database
terms](https://layero.ru/databases-terms) — an appendix to the offer. This
page retells them and gives examples.

## Shared database

| What | How |
|---|---|
| Plan | Pro — monthly or yearly. There's no shared database on Free |
| Price | included in Pro |
| How many | one per organization |
| Storage | 0.5 GB, can't buy more |
| Backups | once a day, kept for up to 7 days, included in the plan |

When space runs low, there are two ways out: clean up the database or move
it to a dedicated instance — see
[below](#moving-from-a-shared-to-a-dedicated-database).

## Dedicated database

A separate server with the cores, memory, and disk you choose. It doesn't
require a Pro subscription: you can order a dedicated database on Free too.

### Standard configurations

| Cores | Memory | Disk | Price per month |
|---|---|---|---|
| 1 | 1 GB | 8 GB | 600 ₽ |
| 1 | 2 GB | 20 GB | 900 ₽ |
| 2 | 2 GB | 30 GB | 1,300 ₽ |
| 2 | 4 GB | 40 GB | 1,750 ₽ |
| 4 | 8 GB | 80 GB | 3,500 ₽ |
| 4 | 12 GB | 120 GB | 4,700 ₽ |
| 6 | 12 GB | 180 GB | 6,050 ₽ |
| 8 | 16 GB | 220 GB | 7,750 ₽ |

Prices as of 29 September 2026. The wizard shows the exact amount before
you click the button, and that's the amount fixed in the order.

### Custom configuration

On the "Custom" tab, cores, memory, and disk are set with sliders:

| Resource | From | To | Step | Approximate price |
|---|---|---|---|---|
| Cores | 1 | 32 | 1 | 275 ₽ per core |
| Memory | 2 GB | 128 GB | 1 GB | 220 ₽ per 1 GB |
| Disk | 10 GB | 2,000 GB | 5 GB | 13.2 ₽ per 1 GB |

The monthly total is rounded up to a multiple of 50 ₽. For example:

- 1 core, 2 GB of memory, 10 GB of disk — 275 + 440 + 132 = 847 → **850 ₽**;
- 2 cores, 4 GB, 100 GB — 550 + 880 + 1,320 = 2,750 → **2,750 ₽**.

If the same set is cheaper as a standard configuration, the platform orders
that one itself and charges the lower price. That's why 2 cores, 4 GB, and
40 GB cost 1,750 ₽, as in the table above, not 2,000 ₽ from the sliders.

### Dedicated database backups

Backups are a paid option, off by default. The price depends on the disk and
the number of backups kept. Examples for one backup:

| Database disk | One backup per month |
|---|---|
| 8 GB | 100 ₽ |
| 40 GB | 300 ₽ |
| 80 GB | 600 ₽ |
| 220 GB | 1,500 ₽ |

The enable dialog shows the exact amount before you confirm. The extra
amount for the remaining days of the current period is charged right away;
after that, backups are included in the monthly charge together with the
database. How to enable them is described on the
[Backups](./backups.md#dedicated-database) page.

## How payment works

**Who pays.** The organization owner pays — with the payment method linked
to their account: card, SBP, T-Pay, SberPay, ЮMoney, or Alfa Pay. Any
organization administrator can order a database, but the charge goes to the
owner. You can't pay without an email address: receipts are sent there.

**When we charge the first time:**

| Method | What happens |
|---|---|
| Card | the monthly amount is held when you order and charged when the database is ready. If the database doesn't come up, we release the hold |
| SBP, T-Pay, SberPay, ЮMoney, Alfa Pay | the amount is charged when you order. If the database doesn't come up, we refund it in full by the same method |

If the database hasn't come up within 90 minutes, the order is cancelled
automatically and the money is returned.

**The period** is one month. Paid on 12 October —
the database is paid until 12 November. We charge for the next month in
advance, on 9 November, and the period extends to 12 December. If the month
has no such day, the period ends on the last day of the month.

There's no daily rate: the price per day in the wizard is only a guide; we
charge once a month, in full.

**Receipts** under 54-FZ are sent to the owner's email for every charge and
refund. No VAT.

## Renewal

| When | What happens |
|---|---|
| 6 days before the end of the period | an email about the upcoming charge |
| 3 days before the end of the period | the first charge attempt |
| If it fails | repeated attempts until the end of the period |

The next charge date is shown on the database card and in the output of
`layero db list`.

You can opt out of renewal at any time: delete the database or unlink the
payment method in the **Billing** section. With the payment method unlinked,
renewal won't go through: access to the database closes at the end of the
period, and 3 days later it is deleted — see below.

## If payment fails

| Stage | What's on the card | What happens to the database |
|---|---|---|
| Until the end of the paid period | "payment failed", "Access works until …" | works as usual |
| The period has ended | "access closed", with the deletion date | connections and queries are stopped, the Data API doesn't respond, the data is intact |
| 3 days after the end of the period | "deleted for non-payment" | the database is gone |

Until the database is deleted, you can pay with the **Pay** button on the
card — access will come back. We email the owner when access is closed and
before the database is deleted.

⚠️ Before deleting a database for non-payment, we try to take a backup, but
we don't guarantee that it will succeed and be kept. If the data matters,
don't let it come to deletion: keep your payment method up to date and
backups enabled.

## Changing the configuration

The "⋮" menu on the database overview → **Change configuration**.

- **More expensive.** The difference for the remaining days of the current
  period is charged right away; from the next period, the new price applies.
  The dialog names the amount before you confirm: "We'll charge X ₽ now for
  N remaining days". If the payment fails, the configuration doesn't change.
- **Cheaper.** The new price applies from the next period; the difference
  for the current one isn't refunded.
- **The disk** only grows; it can't be reduced.
- Changing cores or memory restarts the database, usually for about half a
  minute. Growing the disk happens without interruption.

### Moving from a shared to a dedicated database

The same **Change configuration** dialog on a shared database moves it to a
dedicated server together with its data. The first month is paid the same
way as when [ordering a new database](#how-payment-works): with a card, the
amount is held and charged after the move. Within 24 hours you can move the
database back to where it was.

## Deletion and refunds

You can delete a dedicated database at any time. If there are days left in
the paid period, **we refund their cost**:

> monthly price × number of unused days ÷ number of days in the period

A partial day counts as unused. The refund is never more than what you paid
and takes into account extra payments for configuration changes.

**Example.** A 600 ₽ database, a 30-day period, deleted after 7 days: we
refund 600 × 23 ÷ 30 = 460 ₽.

The amount is shown in the deletion dialog before you confirm: "We'll refund
X ₽ for N unused days". The refund goes out right after deletion, by the
same method you paid with, with a receipt. When the money arrives is up to
the bank; under the terms, no later than 10 calendar days.

Layero has no internal balance: money isn't credited toward future charges
but returned to your card or account.

If you're a consumer, you have the right to cancel the service at any time
and get money back for the unused period under Article 32 of the Law "On
Protection of Consumer Rights".

## Reliability

We make reasonable efforts to keep databases running continuously, but we
don't promise uninterrupted operation. If a dedicated database is
unavailable through our fault for more than 24 hours in a row, you have the
right to demand a price reduction for that time — write to support. Details
are in section 10 of the [database terms](https://layero.ru/databases-terms).

## Questions

**Do I need Pro for a dedicated database?** No. A dedicated database is paid
for separately and is available on any plan.

**Can I have two shared databases?** No, there's one shared database per
organization. Create the second and any further ones as dedicated.

**Do databases count toward the plan limits?** No. Pro limits (builds,
traffic, requests) don't apply to databases, see
[Usage and limits](../billing/usage.md).

**Can I pay for a year at once?** No, a dedicated database is paid for
monthly.
