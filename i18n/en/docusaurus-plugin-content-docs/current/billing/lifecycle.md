---
sidebar_position: 2
title: Balance and renewal
description: How to top up an organization's balance and set up auto top-up, how Pro renews, the grace period, what is suspended after moving to Free and how it all comes back. Deleting your account and money on the balance.
---

# Balance and renewal

**Pro renews from the organization's balance, and projects and domains aren't deleted when Pro ends.** The organization moves to Free, whatever Free doesn't include is suspended, and after payment it all comes back by itself. The exception is the shared database: its data is deleted, see below.

## Balance

Each organization has its own balance. It pays for the Pro subscription,
[dedicated databases](../database/pricing.md) and
[work beyond the limits](./overage.md).

Top it up on the organization's «Оплата и тариф» (Billing and plan) page
with the «Пополнить» (Top up) button. Payment methods: card, СБП (Faster
Payments System), T-Pay, SberPay, ЮMoney and Alfa Pay.

**Auto top-up** saves you from watching the balance. The «Автопополнение»
(Auto top-up) block → «Настроить автопополнение» (Set up auto top-up) →
«Пополнять автоматически» (Top up automatically). Before a charge we top up
the balance from the linked card by the amount that's missing. In «Своё правило» (Custom rule) mode you set two amounts: a threshold and a top-up size. When the balance drops below the threshold, we top it up by the chosen amount.

Auto top-up is set up by the organization owner. When it's off, we don't
charge the card, but the subscription still renews from the balance when
there's enough money on it.

## How Pro renews

Pro renews on the day the paid period ends. Three days before, an email
tells you how much will be charged and from where.

| Balance | Auto top-up | What happens |
|---|---|---|
| enough | doesn't matter | the amount is taken from the balance |
| not enough | on | we top up the balance from the card, Pro renews |
| not enough | off | the [grace period](#grace-period) starts |

We charge cards only in the daytime — from 10:00 to 23:00 Moscow time. If a payment fails, we try
again after 1, 3 and 5 days.

## Grace period

If Pro couldn't be renewed, it keeps working in full: 7 days for a monthly
subscription and 30 days for a yearly one. The same happens when a trial
ends and the subscription couldn't be paid.

Top up the balance during this time and Pro renews from the original date,
as if there had been no break. If you don't, the organization moves to Free.

There is no grace period if you cancelled the subscription yourself with
«Отменить подписку» (Cancel subscription). Pro runs to the end of the paid
period, and then the organization moves to Free. To stop Pro at once, use the «Прекратить сейчас» (Stop now) button that appears after cancelling: the cost of the unused days goes back to the balance.

## What happens after moving to Free

Builds, settings, environment variables and history stay where they are.
Only what isn't part of [Free](./plans.md) is suspended:

- **Projects beyond five.** The five oldest projects keep working, the rest
  are suspended.
- **Custom domains.** All of them are suspended. The project still opens at
  `<project>.layero.app` if it is among the five that keep working.
- **Indexing** is turned off on every project.
- **The "Made with Layero" label** comes back on sites where it was removed.
- **A team organization** becomes read-only.
- **The shared database** is closed: neither apps nor anyone from outside can connect to it. 3 days after closing, the database is deleted with its data. If you need the data, [download a backup](../database/backups.md#download-a-backup) before the grace period ends.

Dedicated databases are paid separately and don't depend on the subscription.

A suspended project is visible in the dashboard, but its site doesn't open:
visitors see a «Сайт временно недоступен» (Site temporarily unavailable)
page. Such a project doesn't accept new builds.

A suspended domain keeps both its DNS records and its link to the project:
nothing has to be set up again.

There is no deadline after which suspended things are deleted: projects and
domains wait for Pro to come back as long as it takes. A project is deleted
only if you delete it yourself.

## When Pro is paid again

Everything suspended turns back on by itself: projects, domains, the team
organization. Indexing and the hidden label come back on the projects where
they were on before the move to Free. Nothing needs to be set up again.

:::tip[How to avoid breaks]
Keep the renewal amount on the balance or turn on auto top-up. Then Pro
renews by itself and nothing has to be suspended.
:::

## Delete your account

Dashboard → «Настройки профиля» (Profile settings) → «Удаление аккаунта»
(Account deletion) → «Удалить аккаунт» (Delete account)
([open](https://app.layero.ru/settings/accounts#delete-account)).
To confirm, enter your email address.

What happens:

- **At once and for good**, your projects (sites, domain links, environment
  variables) and databases are deleted.
- **No new charges:** the card is unlinked. The subscription runs to the end
  of the paid period. We refund the unused days on request — write to
  support@layero.ru.
- **Money on the balance** of your personal organization is lost together with the account: the dashboard
  asks you to tick a box saying you give it up. To get it back, write to
  support first, and only then delete the account.
- **After 30 days** the account and the data about you are deleted.
- **Payment records** (amount, date, receipt number) stay: the law requires
  us to keep them. They are no longer linked to you.
- **Consent to personal data processing** is withdrawn by the same action.

If you created a team organization and it has other members, you can't
delete your account: your colleagues' projects and databases would go with
it. The dashboard shows such organizations. First hand over or delete each
one:

- to hand it over to another member, write to support@layero.ru;
- to delete it yourself, delete its projects and databases first, then the
  organization.
