---
sidebar_position: 2
title: All commands
description: Reference of Layero CLI commands — publishing, projects and environments, rollback, logs and diagnostics, variables, domains, databases and the Data API, analytics, speed, hooks, tokens, team members. Common flags and CLI environment variables.
---

# All commands

**Every command runs as `npx layero@latest <command>`.** Detailed help for
any of them — `npx layero@latest <command> --help`. Most commands take
`--project <id or slug>`: without it, the project linked to the current
folder is used.

## Sign-in and account

| Command | What it does |
|---|---|
| `login` | sign in through the browser; `--no-browser` only prints the link |
| `logout` | remove the sign-in from this machine |
| `whoami` | which account you're signed in as |
| `username <name>` | set the username — your personal organization's address. For agents and CI |
| `orgs list` | organizations you're a member of |
| `token create <name>` | issue a long-lived token for CI and agents, `--scope read,deploy,admin` |
| `token list` | issued tokens: name, rights, last use |
| `token revoke <id>` | revoke a token, takes effect at once |
| `token set <token>` | save on this machine a token issued elsewhere |

How to sign in and where it's stored — [Installing and signing in](./install.md).

## Team members

| Command | What it does |
|---|---|
| `team list` | members, their roles and project access; for an owner, also pending invitations and paid seats |
| `team invite <email>` | invite by email; the role is `--role owner`, `developer` (default) or `guest`. An owner or a developer needs a free seat |
| `team role <email> <role>` | change the role: `owner`, `developer` or `guest` |
| `team remove <email>` | remove a member or revoke an invitation. The seat stays with the team and keeps renewing until it's removed with `team seats --remove` |
| `team access <email>` | show project access. `--all <level>` — the level for all projects, `--project <project>=<level>` — an exception, the flag can be repeated. Levels: `none`, `view`, `edit` |
| `team seats` | show paid seats; `--add <N>` — add seats (the rest of the month is charged to the team balance right away), `--remove <N>` — remove free ones |

Without `--org <slug>`, `team` commands work with your personal organization. What roles and access levels allow — [Roles and permissions](../team/roles.md), what seats cost — [Seats](../team/organizations.md#seats).

## Publishing

| Command | What it does |
|---|---|
| `deploy` | pack the folder and publish it; `--dry-run` shows the plan — [details](../deploys/deploy.md) |
| `init` | add a Layero block to `AGENTS.md`, `CLAUDE.md` or `.cursorrules` — [details](../agents/skill.md#layero-init-and-agentsmd) |
| `link <id or slug>` | link the current folder to an existing project |
| `claim status [code]` | state of a temporary site created with `deploy --claim` |
| `claim accept [code]` | open the page where a person takes the site into their account |

## Projects and environments

| Command | What it does |
|---|---|
| `projects list` | your projects |
| `projects create --repo <provider>:<owner>/<repository>` | create a project from a connected repository: a push to a branch gives a preview, a push to the main branch the main address |
| `projects delete <id or slug>` | delete a project — **irreversible** |
| `envs list` | the project's environments and their addresses |
| `sources list` | Git providers and the organization's connections |
| `sources connect <provider>` | connect a provider with a personal token |
| `sources repos <connection id>` | repositories the connection's token can see |

`projects delete`, `domains remove` and other irreversible commands work with
a `login` sign-in. A token needs `admin` rights for them.

## Builds, rollback and diagnostics

| Command | What it does |
|---|---|
| `deploys list` | recent builds of the main branch; `--branch` for another |
| `rollback` | bring back the previous build; `--deploy` for a specific one |
| `promote [build]` | make a build the main one; without an argument takes the latest build of the `cli` environment |
| `logs` | the build log; `--runtime` for the running app's log, `--tail <n>` for how many lines |
| `diagnose` | explain why a build is in its state: the cause, the log around the error, the app's state |
| `source [build]` | download an upload's sources as a ZIP; `--url` gives just the link |

Rollback and picking a build — [a separate article](../deploys/rollback.md).

In `deploys list` every build shows its source: `cli` — a folder upload,
`push` — a push to the repository or a hook, `manual` — started with the
«Собрать заново» (Build again) button in the dashboard.

## Project settings

| Command | What it does |
|---|---|
| `env list` | environment variable names and value lengths |
| `env set KEY=value …` | set variables, leaves the rest alone |
| `env unset KEY …` | delete variables |
| `domains list` | the project's domains |
| `domains add <domain>` | connect a domain and show the DNS records |
| `domains verify <domain>` | check DNS now instead of waiting for the background check |
| `domains primary <domain>` | make the domain primary: the `layero.app` address redirects to it |
| `domains remove <domain>` | disconnect a domain — **irreversible** |
| `hooks list` | the project's deploy hooks |
| `hooks create <name>` | create a hook: an address a POST to which starts a build. For CMSs, cron and external CI |
| `hooks delete <id>` | revoke a hook; the address stops working at once |

Details: [environment variables](../build/env-vars.md),
[custom domain](../addresses/custom-domains.md).

## Analytics and speed

| Command | What it does |
|---|---|
| `analytics status` | whether Yandex Metrica is connected |
| `analytics connect` | connect Metrica: the command prints a link, a person grants access |
| `analytics stats` | traffic: totals, trend, sources, devices, pages |
| `analytics disconnect` | disconnect Metrica |
| `perf check` | measure the main branch's speed; `--wait` waits for the result |
| `perf show` | the latest measurement and the comparison with the previous build |

## Databases and the Data API

| Command | What it does |
|---|---|
| `db list`, `db create`, `db connect`, `db disconnect`, `db sql`, `db delete` | the organization's databases — [details](../database/cli.md) |
| `data enable` | turn on the Data API for a database |
| `data env` | `VITE_` and `NEXT_PUBLIC_` variables for the frontend; `--write` puts them into `.env.local` |
| `data methods` | tables and functions available through the API and the access level of each |
| `data grant <object>` | set the access level: shows the SQL and applies it after confirmation |
| `data keys` | keys: list, issue, revoke |
| `data origins` | sites allowed to call the database from the browser |
| `data probe <method> <path>` | a test request through the API: real rights and policies, writes are rolled back |
| `data auth` | sign-in of the app's users: methods, providers, return addresses |
| `data buckets` | file buckets: list and create |
| `data secrets` | secrets for HTTP requests from SQL; values are never shown |

Details — in the [Data API](../data-api/index.md) section.

## Common flags

| Flag | What it does |
|---|---|
| `--json` | print JSON events, one per line — [list of events](../agents/json-events.md) |
| `--debug` | print the full stack trace on an error |
| `--help` | help for the command |
| `--version` | the CLI version |

## CLI environment variables

| Variable | What it does |
|---|---|
| `LAYERO_TOKEN` | a token for CI and agents. Wins over the sign-in saved by `login` |
| `LAYERO_JSON=1` | the same as `--json` |
| `LAYERO_NO_UPDATE_CHECK=1` | don't check whether a newer CLI version is out. Without it the CLI asks npm for the version once a day and, if there is a newer one, says so on stderr; it never goes to stdout or the JSON events. Useful in CI, where extra stderr lines get in the way |
