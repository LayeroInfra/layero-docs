---
sidebar_position: 1
title: Free and Pro plans
description: How Free and Pro differ on Layero — project and build limits, custom domains, analytics, team seats, and pricing.
---

# Free and Pro plans

Layero has two public plans: **Free** (no charge) and **Pro** — 990 ₽ a month
or 9 480 ₽ a year in one payment. The plan applies to an **organization**: Pro
is taken out for a specific organization and paid from its balance. An account
has no plan of its own.

Pro can be tried free for 14 days — once, with a card linked.

## What's included

| Capability | Free | Pro |
|---|---|---|
| Price | 0 ₽ | **990 ₽/mo** or 9 480 ₽/yr |
| Projects | up to **5** | unlimited |
| Builds | 100 a month | 1,000 a month |
| Serving on a platform address (`*.layero.app`) | ✅ | ✅ |
| Runtime apps (SSR, Streamlit, Gradio) | ✅ | ✅ |
| **Search-engine indexing** | — | ✅ |
| Custom domains | — | ✅ |
| Web analytics | — | ✅ |
| Observability & logs | — | ✅ |
| Page Speed — page load speed | 3 runs a month | 500 runs a month, schedules |
| Boosted runtime tier | — | ✅ |
| Remove the Layero badge ([how](../getting-started/concepts.md#the-made-with-layero-label)) | — | ✅ |
| Team organizations | — | ✅ |
| Team seats included | — | 1 |

Limits on traffic, requests, apps, the Data API and speed runs, and the
prices above the limit on Pro, are in [Usage and limits](./usage.md).

:::danger[Indexing is off by default — for everyone]
Every new project is created with `indexing_enabled = false`, and the platform
serves its site with an `X-Robots-Tag: noindex, nofollow` header. While the flag
is off the site **cannot appear** in Yandex or Google, whatever your
`robots.txt` says.

Turning it on is a paid feature: **Project settings → Site indexing**, which
requires Pro or the beta. Turning it off is always allowed on any plan —
downgrading must not lock a site inside the index.

To check what you have:

```bash
curl -sI https://<your-project-address> | grep -i x-robots-tag
# no header         → the site is indexable
# noindex, nofollow → it is not
```
:::

:::note[Runtime is available on Free too]
SSR and runtime apps (Next.js in server mode, Streamlit, Gradio, Flask)
work on **both** plans. Pro differs by a boosted runtime tier, not by the
ability to run dynamic apps.
:::

## Team seats

Pro includes **one seat for a colleague**: the organization's owner does not
take a seat. Extra seats cost **490 ₽/mo** each. Seats are only needed for
collaboration in [organizations](../team/organizations).

## How to pay

Pro is paid from the **organization's balance**. The balance is topped up
through ЮKassa (YooKassa): card, SBP, T-Pay, SberPay, ЮMoney or Alfa Pay. To
take out Pro, open the organization's **«Оплата и тариф»** (Billing & plan)
page → **«Перейти на Pro»** (Upgrade to Pro).

On the renewal day the amount is taken from the balance. If it falls short and
a card is set up for auto top-up, the card tops the balance up by the missing
amount. With neither money nor a card, a grace period starts — see
[Expiry & renewal of Pro](./lifecycle.md#grace-period).

## Changing plans

- **Free → Pro.** Activates right after payment; all Pro capabilities
  become available immediately.
- **Pro → Free.** The **«Отменить подписку»** (Cancel subscription) button
  keeps Pro until the end of the paid period, then the organization moves to
  Free. You can also end Pro at once — the cost of the unused days then goes
  back to the balance. What happens
  to projects over the limit and to custom domains is covered in
  [Expiry & renewal of Pro](./lifecycle).

Nothing is deleted when you move to Free — projects over the Free limit are
temporarily suspended, not erased, and are restored when you return to Pro.
Details in the [next article](./lifecycle).
