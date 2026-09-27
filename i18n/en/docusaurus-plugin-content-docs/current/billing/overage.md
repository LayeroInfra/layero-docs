---
sidebar_position: 4
title: Overage billing
description: How to pay for usage above the limits on Pro — how to turn it on, when and how much we charge, the cap, receipts and what happens if a payment fails.
---

# Overage billing

:::caution[Draft]
The rules below are not in effect yet: nothing is charged or capped above
the plan right now. Before they take effect we will announce it and
publish a new edition of the offer.
:::

On Pro you do not have to stop at a limit: you can pay for usage above it,
at the prices from the table in [Usage and limits](./usage). There is no
overage billing on Free: there a limit is hard.

## In short

- It is turned on manually, separately for each organization. While it is
  off, Pro limits are hard.
- You set a cap — the most we may charge above the plan per period. The
  default is 1,000 ₽.
- We charge once per period, three days after the renewal. If 1,000 ₽
  accumulates before the end of the period (the threshold), we charge it
  right away.
- A total under 50 ₽ is not charged and is not carried over to the next
  period.
- Every charge gets its own receipt, itemized by metric.
- Sites and apps do not stop, neither at the limit nor at the cap.

## How to turn it on

The **organization owner** turns it on — the person who pays
for Pro. The organization's "Billing" section will get an "Overage billing"
switch and a cap field.

You need:

- paid Pro — overage billing is not available during the free trial;
- a saved payment method;
- an email address in the account — receipts are sent there.

By turning on overage billing you agree to automatic charges up to the
cap. You can turn it off at any time.

## When we charge

There are two occasions to charge.

**Once per period — the total.** A period ends the day before the Pro
renewal: the renewal day starts a new one. The next morning all numbers for the period become final, and we send an email
with the total: the amount, the breakdown and the charge date. Two days
later we charge it.

**At the threshold — right away.** As soon as 1,000 ₽ that has not been
charged yet accumulates over final days, we charge it without waiting for
the end of the period. The final charge then takes only the remainder.

Example: Pro was paid on 14 September, the period runs from 14 September
to 13 October.

| Date | Subscription | Overage |
|---|---|---|
| 14 September | 990 ₽ for 14 September – 13 October | the period starts, counters at zero |
| 14 September – 13 October | — | usage accumulates; the Usage page shows the current amount, the forecast and the charge date |
| if 1,000 ₽ accumulates | — | charged right away |
| 14 October | 990 ₽ for 14 October – 12 November | the period is closed, the last day's numbers are still being finalized |
| 15 October, morning | — | an email with the total and the charge date |
| 17 October, morning | — | the remainder is charged, with its own receipt |

Why not together with the renewal: on the renewal day the numbers for the
last day are not final yet. Besides, a yearly subscription is paid once a
year, and a cancelled one has no next payment at all. A separate charge
works the same way in every case:

- **yearly subscription** — the same schedule at the end of each monthly
  slice;
- **auto-renewal cancelled** — the charge comes three days after the end
  of the paid period;
- **plan changed** — the period closes on the date the new plan is paid,
  and the charge comes three days later.

## The cap

The cap is the most we may charge above the plan in one period. The
default is 1,000 ₽; you can change it at any time in the same "Billing"
section.

- We charge nothing above the cap.
- When the cap is reached, new builds do not start until the next period
  or until you raise the cap.
- Sites and apps keep working, and traffic is not cut off. Usage above the
  cap is on us.
- You get emails when 50% and 100% of the cap are used.

## How the amount is calculated

- Each metric separately: (used − limit) × price, rounded down to a kopeck.
- Only over final days.
- Minutes of builds that failed with an error are not billed.
- If the amount is above the cap, each line is reduced proportionally so
  that together they make exactly the cap.

## Examples

Pro with a 1,000 ₽ cap unless stated otherwise.

| Usage in the period | What we charge |
|---|---|
| 412 build minutes over the limit | 412 ₽, three days after the renewal |
| 112.5 GB of traffic with a 100 GB limit | 12.5 GB × 8 ₽ = 100 ₽, three days after the renewal |
| 1,500 minutes over the limit | 1,000 ₽ as soon as it accumulates over final days; after that the cap applies — new builds wait for the next period or a higher cap |
| a 5,000 ₽ cap, 3,400 ₽ accumulated | about 1,000 ₽ three times as it accumulates, about 400 ₽ as the total |
| 30 ₽ | nothing: under 50 ₽ is not charged |

## Receipt and payment method

- **Receipt** — a separate one for every charge, sent to the account
  email. It has a line per metric, for example: "Pro overage: build
  minutes, 412 min × 1 ₽, 14 September to 13 October".
- **Payment method** — the same one that renews Pro.

## If a payment fails

- You immediately get an email with a "Pay" button — you can pay with any
  method.
- We retry once a day for seven days. If it still fails, the debt stays
  until you pay it with the button from the email.
- Until the debt is paid, overage billing is off: Pro works within its
  limits, and above them new builds do not start. Sites and apps keep
  working.
- The subscription renews with its own payment and does not depend on the
  debt.

## You turned overage off or removed the payment method

New overage stops accumulating from that moment. What has already
accumulated is charged on the usual schedule. If there is no saved payment
method anymore, you get an email with a payment link instead of a charge.

## Free trial and grace period

The grace period is up to seven days after a failed Pro renewal (up to
30 for a yearly subscription), while we retry the subscription charge.
During the free trial and in the grace period there is no overage
billing: limits are hard.

## Several organizations

Each organization has its own limits, its own cap, its own calculation and
its own charges. All organizations of the same owner share one period: it
is counted from the owner's subscription.

## Questions

**I do not want to pay for overage. Do I need to do anything?**
No. Overage billing is off by default.

**Can I know the amount in advance?**
Yes. The Usage page shows how much has accumulated and the forecast for the
end of the period. The total arrives by email two days before the charge.

**What if a charge looks wrong?**
Write to support — preferably before the date in the total email, but
after the charge is fine too. We will go through the calculation day by
day.
