---
sidebar_position: 1
title: Free and Pro plans
description: How Free and Pro differ on Layero — project and build limits, custom domains, analytics, team seats, and pricing.
---

# Free and Pro plans

Layero has two public plans: **Free** (no charge) and **Pro** (990 ₽/mo).
The plan applies at the account level.

## What's included

| Capability | Free | Pro |
|---|---|---|
| Price | 0 ₽ | **990 ₽/mo** |
| Projects | up to **5** | unlimited |
| Webhook builds | 100/mo | unlimited |
| Serving on a platform address (`*.layero.app`) | ✅ | ✅ |
| Runtime apps (SSR, Streamlit, Gradio) | ✅ | ✅ |
| **Search-engine indexing** | — | ✅ |
| Custom domains | — | ✅ |
| Web analytics | — | ✅ |
| Observability & logs | — | ✅ |
| Performance audit (Lighthouse/SiteSpeed) | — | ✅ |
| Boosted runtime tier | — | ✅ |
| Remove the Layero badge | — | ✅ |
| Team organizations | — | ✅ |
| Team seats included | — | 1 |

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

Pro includes **1 seat**. Extra seats in a team organization cost
**490 ₽/mo** each. Seats are only needed for collaboration in
[organizations](../team/organizations) — one seat is enough for personal
projects.

## How to pay

Payment goes through ЮKassa (YooKassa): card, SBP, T-Pay, SberPay, ЮMoney or Alfa Pay —
you pick the method when you link it. Billed monthly with auto-renewal.
Upgrade in the dashboard: **Account settings → Plan → Upgrade to Pro**.

## Changing plans

- **Free → Pro.** Activates right after payment; all Pro capabilities
  become available immediately.
- **Pro → Free.** You can cancel auto-renewal — the plan stays Pro until
  the end of the paid period, then the account moves to Free. What happens
  to projects over the limit and to custom domains is covered in
  [Expiry & renewal of Pro](./lifecycle).

Nothing is deleted when you move to Free — projects over the Free limit are
temporarily suspended, not erased, and are restored when you return to Pro.
Details in the [next article](./lifecycle).
