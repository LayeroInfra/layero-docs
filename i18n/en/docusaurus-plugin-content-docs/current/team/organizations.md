---
sidebar_position: 1
title: Organizations and teams
description: A personal organization and a team in Layero, how to invite members, what seats cost, how to switch between organizations and move projects.
---

# Organizations and teams

**Projects, domains, databases and the balance in Layero belong to an
organization.** There are two kinds: a personal organization and a team. The
organization switcher is in the top left corner of the dashboard.

## Personal organization

A personal organization is created at sign-up, everyone has exactly one. It
can't be deleted.

- **On Free** only you work in it: members can't be invited.
- **On Pro** it becomes a team: you can invite members, assign
  [roles](./roles.md) and set up project access. There's no need to create a
  separate team for that.

## Team

A team is a separate organization with its own members, subscription,
balance and card.

- The subscription belongs to the team itself. A team runs on its own Pro,
  not on the plan of one of its members.
- All team charges come from its balance. The team card tops up only that
  balance and isn't linked to the card of your personal organization.
- Only the team's [owners](./roles.md#billing) see and change billing.

A new team is created in the switcher: «Создать организацию» (Create
organization). Pro is paid right away, a new team has no trial.

## Members

To invite a member: organization settings → «Участники» (Members) → the
«Пригласить участников» (Invite members) block. Enter the email and the
[role](./roles.md) and click «Пригласить» (Invite).

The invitation arrives by email and is valid for 14 days. To accept it, sign
in to Layero with the email it was sent to. An invitation can be revoked in
«Участники» (Members) too.

## Seats

Every developer and every owner except the first needs a seat. The first
owner is included in the team's subscription. Guests are free and unlimited.

- A seat is 990 ₽ a month. It's always paid monthly, even with yearly Pro.
- All seats renew on the same day — the day of the month the team's
  subscription started.
- A seat added mid-month is paid right away from the team balance for the
  rest of the period until the renewal date. A seat already paid for this month isn't charged for again.
- Only a free seat can be removed. Money for the remaining days isn't
  refunded.
- Seats belong to the team, not to a person. When a member leaves, their seat stays free and keeps renewing until an owner removes that seat.
- Inviting a developer or an owner, or promoting a guest, needs a free seat.
  A pending invitation to such a role takes a seat too.

Seats are added and removed in «Участники» (Members), in the «Платные места»
(Paid seats) block, or with `npx layero@latest team seats` — see [In the CLI](#in-the-cli).

If a seat renewal isn't paid, a grace period of the same length as for Pro
starts — see [Balance and renewal](../billing/lifecycle.md). After it, developers beyond the paid seats lose access, starting with the most recently invited: they stay in the team but can't see its
projects until the renewal is paid. Owners aren't affected.

## Switching between organizations

The switcher remembers the selected organization in the browser: after a
page reload you'll be in the same one. The dashboard shows projects, deploys and repositories to import only for the selected organization.

## Moving a project to another organization

Project → «Настройки» (Settings) → «Передача проекта» (Project transfer).
Start typing the name of the receiving organization and the dashboard will suggest matches. The request shows up in the recipient's dashboard, in the
«Входящие передачи проектов» (Incoming project transfers) block, and arrives
by email. They accept or decline it there. While the request is pending, you
can withdraw it with the «Отменить запрос» (Cancel request) button.

- If the recipient declines, the sender gets an email and the project
  settings show the refusal.
- An unanswered request expires after 14 days. Until then you can't send a
  second one: a project has only one request at a time.
- A project belongs to one organization. After the move the sender no longer has access to the project.
- The project address doesn't change — neither the `layero.app` subdomain
  nor custom domains. Environment variables, deploys, access settings and
  analytics move along with the project.

If the project builds from a GitHub repository and nobody in the new
organization has write access to it, the link to the repository breaks.
Deploys won't go through until it's restored on the project page.

## In the CLI

CLI commands work within one organization.

```bash
npx layero@latest orgs list
```

Shows every organization you're a member of.

```bash
npx layero@latest deploy --org acme-team
```

Creates the project in the `acme-team` team on the first deploy from a
folder. After that, `deploy` in the same folder works with this project
without `--org`. If you have several organizations and `--org` isn't set,
the CLI asks where to create the project. With `--yes` it doesn't ask and
creates the project in your personal organization.

Members are managed with the `team` commands:

```bash
npx layero@latest team list --org acme-team
```

Shows the members, their roles and project access. An owner also sees
pending invitations and paid seats.

```bash
npx layero@latest team seats --add 1 --org acme-team
npx layero@latest team invite anna@example.com --role developer --org acme-team
```

Adds a seat — the rest of the month is charged to the team balance right
away — and invites a developer. Without a free seat you can't invite a
developer or an owner; a guest (`--role guest`) can be invited.

```bash
npx layero@latest team access anna@example.com --all view --project shop=edit --org acme-team
```

Anna sees every project of the team and can deploy, change domains and
variables in `shop`. All commands are in the [CLI reference](../cli/commands.md#team-members).

## GitHub

For a team to build repositories of a GitHub Organization without depending
on one person's access, connect the [GitHub App](./github-app.md).
