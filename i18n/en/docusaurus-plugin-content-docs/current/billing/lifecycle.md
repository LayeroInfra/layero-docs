---
sidebar_position: 2
title: Expiry & renewal of Pro
description: What happens to your projects, domains, settings, and shared database when a Pro subscription ends, and how everything is restored after you pay again. Projects aren't deleted.
---

# Expiry & renewal of Pro

Short answer: **projects aren't deleted when Pro ends.** The organization
moves to Free, and whatever exceeds the Free limits is temporarily **suspended**
(not erased). After you pay again, everything is restored automatically.

There's one exception — the [shared database](../database/pricing.md#if-pro-isnt-renewed):
after the grace period, access to it closes and its data is deleted.

## What happens when Pro ends

The organization moves to [Free](./plans). All deploys, builds, settings,
environment variables, and history stay in place. Only what isn't part of
Free gets suspended or turned off:

- **Projects over the limit.** Free allows **5 projects**. If you had more
  on Pro, the **5 oldest** stay active and the rest become "suspended".
- **Custom domains.** These are a Pro capability, so all linked custom
  domains are suspended.
- **Search indexing.** It is turned off for every project: the sites stop
  appearing in Yandex and Google.
- **The Layero badge** comes back on sites where it was removed.
- **A team organization** is suspended: teams are a Pro capability.
- **The shared database.** It's part of Pro and keeps working until the end
  of the [grace period](#grace-period). After that, access to the database
  closes and its data will be deleted — download a backup in advance.
  Dedicated databases are paid for separately and don't depend on the
  subscription.

### A suspended project is not a deleted one

A suspended project:

- **stays in the dashboard** with a suspended marker — you can still see it;
- **does not serve its site** — a placeholder page is shown instead
  (HTTP 503);
- **rejects new deploys** until you return to Pro.

Projects within the Free limit (the 5 oldest) keep working normally and are
served on their platform-issued addresses.

### Custom domain

Only the **domain** is suspended — the project itself is unaffected. The DNS
record and the domain link in Layero are kept, and the project keeps
serving on its platform-issued address (if it's among the active ones). When
you return to Pro, the domain comes back with nothing to reconfigure.

## Data retention

There is **no** timer after which suspended projects are erased. No
automatic deletion exists — suspended projects are kept indefinitely,
waiting for you to return to Pro.

A project is deleted only if **you** delete it (or [delete the whole
account](#delete-your-account)). Subscription expiry has nothing to do with deleting
projects. The shared database is the exception, see above.

## How Pro renews

Pro renews from the **organization's balance** on the day the paid period
ends. Three days before renewal you get an email with the amount and where it
will come from (for annual Pro, also seven days before).

| On the balance | Card set for auto top-up | What happens |
|---|---|---|
| enough | doesn't matter | the amount is taken from the balance |
| not enough | yes | the card tops the balance up by the missing amount, Pro renews |
| not enough | no | a [grace period](#grace-period) starts |

Cards are charged only during the day, Moscow time. If a card payment fails,
it is retried a few more times over five days.

## Grace period

If Pro could not be renewed, it still works in full: **7 days** for a monthly
subscription and **30 days** for an annual one. Top up the balance in that time
and Pro renews from the original date, as if there had been no gap. If you
don't, the organization moves to Free.

There is **no** grace period:

- after the **free trial** — if payment fails when it ends, the organization
  moves to Free at once;
- if you **cancelled the subscription** with «Отменить подписку» (Cancel
  subscription) — Pro runs to the end of the paid period, then the
  organization moves to Free.

**To end Pro at once**, use the «Оплата и тариф» (Billing & plan) page: the
organization moves to Free right away, and the cost of the unused days goes
back to the balance.

## Paying again restores everything automatically

Once Pro is paid, the organization returns to Pro and **all**
previously suspended resources come back — projects, custom domains, the team
organization. Indexing and the hidden badge come back on the projects where
they were on before the move to Free. Because nothing was deleted, exactly the same projects and domains
are restored, with nothing to set up again. Sites start serving again
within seconds.

## Delete your account

The button is in the dashboard: **Profile settings → Delete account**
([open settings](https://app.layero.ru/settings/accounts#delete-account)).
To confirm, type your email address.

What happens:

- **Immediately and irreversibly** all your projects (sites, domain bindings,
  environment variables) and databases are deleted.
- **Auto-renewal is turned off** at the same moment: the card is unlinked and
  no further charges are made. The subscription runs until the end of the paid
  period. Money for unused days is not refunded automatically: write to
  support@layero.ru and we will refund it.
- **After 30 days** the account and your personal data are deleted.
- **Payment records** (amount, date, receipt number) are kept: the law
  requires it. They are no longer linked to you.
- **Consent to personal data processing** is withdrawn by the same action.

If you created a team that has other members, you cannot delete the account:
your colleagues' projects and databases would go with it. The dashboard lists
such teams. First hand over or delete each of them:

- to hand it over to another member — write to support@layero.ru;
- to delete it yourself — first its projects and databases, then the team.

Then delete the account as usual.

## In short

| Event | What happens |
|---|---|
| Pro ended | Organization → Free; projects over 5 and custom domains suspended (not deleted), indexing off |
| Sites on platform-issued addresses | 5 oldest keep working; suspended ones show a placeholder (503) |
| Custom domain | Turned off; the project lives on, DNS and link preserved |
| Deletion by timer after Pro ends | **None.** Suspended projects are kept indefinitely |
| Paying for Pro again | Everything is restored automatically |
| [Deleting the account](#delete-your-account) | Projects and databases are deleted immediately, the account after 30 days |

:::tip[How to avoid downtime]
If you keep more than 5 projects or rely on a custom domain, keep the renewal
amount on the balance or set a card up for auto top-up. Then there are no
"Free ↔ Pro" transitions or suspensions at all.
:::
