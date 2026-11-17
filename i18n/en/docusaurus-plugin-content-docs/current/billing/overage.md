---
sidebar_position: 4
title: Extra usage
description: 'How to keep working above the plan limits on Pro: how to turn it on and set a budget, how and when we charge the balance, and what happens when the budget runs out or the balance is empty.'
---

# Extra usage

:::info[When it takes effect]
Extra usage launches December 16, 2026. Overage can incur charges once
the feature is enabled and the limits have taken effect for your organization.
For monthly and annual Pro start dates, see [Usage and limits](./usage).
:::

On Pro you don't have to stop at a limit: you can keep working, paid from
the balance, at the prices listed in [Usage and limits](./usage). Free has
no extra usage: the limit is hard, and the only way past it is upgrading
to Pro.

## In short

- Turned on manually, separately for each organization. While it's off,
  Pro limits are hard.
- You set a **budget** — how much can be spent above the limits per
  billing period. From 1 ₽, 1,000 ₽ by default.
- Overage accrues **hourly** and reduces the available balance.
- You get an email at 80 % and 100 % of the budget.
- When the budget runs out or the balance is empty, work above the limits
  pauses. There is never any debt.

## How to turn it on

**Dashboard → organization → Billing → Extra usage → Set up budget.**
Turn on the switch and set the amount.

What you need:

- paid Pro — there is no extra usage during the trial;
- money on the organization's balance or auto top-up turned on.

The budget is not tied to the balance: it can be larger than what's on the
balance. You can turn extra usage off or change the budget at any time.

## How we charge

- Every hour we calculate the cost of usage above the limits. Accrued
  charges reduce the available balance. The advance payment for the calendar
  month is applied on the first day of the next month under the
  [Public Offer](https://layero.ru/offer-v4-2#section-4).
- Each metric is counted separately: (used − limit) × price. Speed runs
  are charged in packs of 10 for 10 ₽.
- Data sometimes arrives late, for example traffic for the previous day.
  Usage from an earlier period may accrue against the budget of the current
  period. The price is based on the date the usage occurred.
- You can see accrued charges and final settlement in Billing.

Example: Pro, budget 1,000 ₽. By the middle of the period sites have
served 112.5 GB against a 100 GB limit. That's 12.5 GB × 8 ₽ = 100 ₽ above
the limit. The available balance falls by 100 ₽ and 900 ₽ of the
budget is left.

## If the balance runs short

- If auto top-up is on, the balance is topped up by its rules.
- If there's nothing to top up from, work above the limits pauses, the
  same as when the budget runs out.
- Whatever we couldn't charge is forgiven: there is no debt.

## When the budget runs out

The budget is a hard boundary: we never charge beyond it. Once it's used
up, the same restrictions apply as at 100 % of a limit without extra usage:

- new builds are rejected, running ones finish;
- sleeping apps don't wake up, running ones keep running;
- for one day sites respond heavily throttled, then visitors see a "site
  temporarily unavailable" page;
- the Data API answers 429, new files can't be uploaded to storage, new
  speed runs don't start.

Details are in the table [What happens when a limit runs
out](./usage#what-happens-when-a-limit-runs-out).

**Restrictions are lifted right away** once you raise the budget with
"Change budget" or top up the balance. With a new period the budget starts
from zero.

## Several organizations

Each organization has its own limits, budget and balance.

## Questions

**I don't want to pay above the plan. Do I need to do anything?**
No. Extra usage is off by default.

**Can I see how much has already been spent?**
Yes. The Billing page shows how much of the budget is used, and the Usage
page shows each metric.

**What if a charge looks wrong?**
Write to support and name the organization. We'll go through the
calculation hour by hour.
