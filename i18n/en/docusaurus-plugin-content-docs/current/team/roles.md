---
sidebar_position: 2
title: Roles and permissions
description: What an owner, a developer and a guest can do in a Layero team, how to set up project access and who sees billing.
---

# Roles and permissions

**A team has three roles: owner, developer and guest.** An owner manages
everything, including billing and members. A developer works with the
projects they have access to. A guest only views.

The role is picked when inviting. To change it, open the «Участники»
(Members) page in the organization settings: member menu → «Сменить роль»
(Change role).

## What roles can do

“In their projects” means only the projects the member has access to. How to set up access is described [below](#project-access).

| | Owner | Developer | Guest |
|---|---|---|---|
| View projects, deploys, previews and analytics | ✓ | in their projects | in their projects |
| Deploy and roll back | ✓ | in their projects | — |
| Domains, environment variables, databases | ✓ | in their projects | — |
| Create projects | ✓ | ✓ | — |
| Delete projects | ✓ | — | — |
| Invite members and change roles | ✓ | — | — |
| Balance, card, subscription, consumption budget | ✓ | — | — |
| Delete the team | ✓ | — | — |

A guest never sees the values of secret variables.

Every developer and every owner except the first takes a paid seat. Guests are free and unlimited. Seat prices are in [Seats](./organizations.md#seats).

## Owners

A team can have several owners with equal rights: each of them can top up
the balance, change the card, the subscription and the consumption budget,
and invite members. The last owner can't be removed from the team or made a
developer — make someone else an owner first.

## Databases

A developer works with the databases of the projects they have access to:
queries, tables, roles, keys, the Data API, functions and backups.

Only an owner can:

- create a database and pay for it;
- change its size or disk;
- restore a database from a backup;
- move a database;
- delete a database.

Connecting a database to a project or disconnecting it needs edit access to
that project.

## Billing

Only owners see and change billing. Developers and guests don't have the
«Оплата и тариф» (Billing and plan) section in the menu; if they open it by a
link, the dashboard shows the message «Оплатой команды занимаются владельцы» (Owners
handle the team's billing) and a «Попросить владельца» (Ask the owner) button.

When the team reaches a plan limit, developers and guests see a notice about the limit and a «Попросить владельца оплатить» (Ask the owner to pay) button.

## Project access

An owner always sees and changes every project of the team. For a developer
or a guest, access is set up like this:

1. **A level for all projects** — also applies to projects created later:
   «Нет доступа» (No access), «Просмотр» (View) or «Редактирование» (Edit).
2. **Exceptions** — a different level for particular projects. For example, all projects — “View”, except `shop` — “Edit”.

A guest can only get «Нет доступа» (No access) or «Просмотр» (View): editing needs the «Разработчик»
(Developer) role. Whoever creates a project gets «Редактирование» (Edit) in
it right away.

Where to set it: «Участники» (Members) → member menu → «Доступ к проектам»
(Project access). In a terminal — `npx layero@latest team access <email>`, examples are in [In the CLI](./organizations.md#in-the-cli).

### Access to one project

Project → «Настройки» (Settings) → «Доступ» (Access) → the «Команда» (Team)
card. It shows who in the team sees this project and can change it:

- owners always have «Редактирование» (Edit);
- everyone else has the same level as on all projects in the team's
  «Участники» (Members), unless it was set separately for this project. An
  owner picks such a level right here, and the member's line gets the note
  «отдельно для этого проекта» (separately for this project).

Owners change the levels on this screen; everyone else can only view them. The
«Участники и доступ ко всем проектам» (Members and access to all projects)
link leads to the team settings.

The project's «Участники» (Members) page leads there too: you can't add a
person to a single project bypassing the team. Rights to a project come only from team membership and the level set for it.

The team's Page Speed feed also shows each person only the projects
they have access to.
