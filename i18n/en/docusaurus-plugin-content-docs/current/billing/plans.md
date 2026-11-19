---
sidebar_position: 1
title: Free and Pro plans
description: How Free and Pro differ — projects, builds, custom domains, search indexing, apps with a server, the shared database, seats for colleagues. Prices, the trial and switching between plans.
---

# Free and Pro plans

**Layero has two plans: Free, which costs nothing, and Pro — 990 ₽ a month
or 9 480 ₽ a year.** A plan belongs to an organization, not to a person:
each organization has its own plan and its own balance, and Pro is paid
from that balance.

You can try Pro free for 14 days. The trial is given once and needs a card:
we check it with a 1 ₽ charge and refund it right away.

## What's included

| | Free | Pro |
|---|---|---|
| Price | 0 ₽ | 990 ₽ a month or 9 480 ₽ a year |
| Projects | up to 5 | unlimited |
| Builds per month | 100 | 1 000 |
| `<project>.layero.app` address | ✅ | ✅ |
| Apps with a server | up to 0.25 CPU and 256 MB | up to 1 CPU and 1 GB |
| Search engine indexing | — | ✅ |
| Custom domains | — | ✅ |
| Web analytics | — | ✅ |
| Project monitoring | — | ✅ |
| Page Speed | 3 runs a month | 500 runs a month and a schedule |
| No "Made with Layero" label ([what it is](../getting-started/concepts.md#the-made-with-layero-label)) | — | ✅ |
| Shared database | — | one, 0.5 GB |
| Data API, beta | — | ✅ |
| Team organizations | — | ✅ |
| Seats for colleagues | — | 1 |

Limits on traffic, site requests, app time, the Data API and speed runs, and
prices beyond the limits, are on [Usage and limits](./usage.md). A dedicated
database can be ordered on any plan and is paid separately — see
[Database pricing](../database/pricing.md).

## Search engine indexing

A new project is closed to search engines. The platform serves its site with
the `X-Robots-Tag: noindex, nofollow` header, and the site won't get into
Yandex or Google, whatever your `robots.txt` says.

Indexing can be turned on in Pro: project → «Настройки» (Settings) →
«Индексация сайта» (Site indexing). It can be turned off on any plan.

To check the result:

```bash
curl -sI https://<project-address> | grep -i x-robots-tag
# no header           → the site is indexed
# noindex, nofollow   → it isn't
```

## Seats for colleagues

Pro includes one seat for a colleague: the organization owner doesn't take
a seat. Each extra seat is 490 ₽ a month. Seats are only needed to work
together in an [organization](../team/organizations.md).

## How to pay

Pro is paid from the organization's balance. The balance is topped up on the
organization's «Оплата и тариф» (Billing and plan) page — by card, СБП
(the Russian Faster Payments System), T-Pay, SberPay, ЮMoney or Alfa Pay.
The «Перейти на Pro» (Upgrade to Pro) button is there too.

On the renewal day the amount is taken from the balance. If there isn't
enough and auto top-up is on, the balance is topped up from the card. How
renewal works and what happens if payment fails — on
[Balance and renewal](./lifecycle.md).

## Switching plans

- **Free → Pro.** Pro starts working as soon as it's paid.
- **Pro → Free.** The «Отменить подписку» (Cancel subscription) button keeps
  Pro until the end of the paid period, then the organization moves to Free.
  You can also stop Pro at once with the «Прекратить сейчас» (Stop now) button after cancelling: the cost of the unused days goes back to the balance.

Projects and domains aren't deleted when you move to Free: what Free doesn't include is suspended and comes back when you pay for Pro again. The shared database is closed and deleted 3 days later — see
[What happens after moving to Free](./lifecycle.md#what-happens-after-moving-to-free).
