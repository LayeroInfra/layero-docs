---
sidebar_position: 2
title: Commands
description: The full list of layero commands — init, login, projects, deploy, rollback, deploys list, link, token.
---

# CLI commands

| Command | What it does |
|---|---|
| `layero init` | Auto-detect the framework, scaffold `.layero/project.json` and add a block for AI agents to `AGENTS.md` / `CLAUDE.md` / `.cursorrules`. |
| `layero login` | Sign in through the browser (an emailed code or Yandex ID) — a device flow. |
| `layero logout` | Remove the saved token. |
| `layero whoami` | Show the current account. |
| `layero orgs list` | List your Layero organizations (personal + teams). |
| `layero projects list` | List your projects. |
| `layero projects create --repo <provider>:<owner/repo>` | Create a project from a repository of a connected provider — push to a branch = preview, push to main = production. |
| `layero projects delete <slug> --yes` | Delete a project. Irreversible; needs a token with scope `admin`. |
| `layero sources list` | Git providers the platform supports and the organization's connections. |
| `layero sources connect <provider> --token-stdin` | Connect a provider with a personal access token (read from stdin, so it stays out of shell history). |
| `layero sources repos <connection_id>` | Repositories visible to a connection. |
| `layero envs list` | Environments (branches) of a project with their addresses. |
| `layero link <id_or_slug>` | Link the current directory to an existing project. |
| `layero deploy` | Auto-detect the framework, pack the current directory, deploy. |
| `layero deploy --prod` | Deploy to production (with confirmation). |
| `layero deploy --org <slug>` | Create the new project in the given team instead of your personal organization. |
| `layero deploy --json` | A machine-readable event stream — for agents and CI. |
| `layero deploy --claim` | Deploy without an account: a temporary project for 72 hours and a link for a human to take the site over. |
| `layero claim status` / `claim accept <code>` | State of a claimable project's claim; open the page where a human accepts it. |
| `layero deploys list` | Show recent deploys of the current project. |
| `layero promote` | Point the production apex at a specific ready deploy. |
| `layero promote <sha>` | Point the apex at a specific deploy by `commit_sha` — the working way to roll back, see [Rollback](./rollback). |
| `layero hooks list/create/delete` | Deploy hooks — URL tokens that start a build on POST (CMS, cron, external CI). |
| `layero token set <jwt>` | Set the token by hand (for CI). |

The full flag list for a command:

```bash
npx layero@latest <cmd> --help
```

The global `--json` flag switches the CLI to JSON lines on stdout — that is for
AI agents (Cursor, Claude Code) and CI pipelines. More in
[Deploying from AI agents](./agents).

## `layero init`

Run it once inside the site directory:

```bash
cd my-site
npx layero@latest init
```

What it does:

1. Reads `package.json` and the characteristic configs (`next.config.*`,
   `vite.config.*`, `astro.config.*` and so on) to determine the framework.
2. Creates `.layero/project.json` with `framework_hint` / `build_cmd` /
   `output_dir`. If the file already exists it is left alone.
3. Appends a "Deploying with Layero" block to `AGENTS.md`, `CLAUDE.md` and/or
   `.cursorrules` (whichever exist; if none do, it creates `AGENTS.md`).

The block is fenced with `<!-- layero:start -->` / `<!-- layero:end -->`
markers, so a repeat `init` updates it in place instead of duplicating it.

Flags:

- `--skip-agent-docs` — leave `AGENTS.md` / `CLAUDE.md` / `.cursorrules`
  untouched.
- `-y`, `--yes` — non-interactive (all defaults applied silently).

## `layero orgs list`

Shows the Layero organizations you belong to:

```
borisowvalia        personal  (admin)
acme-team           team      (admin)
client-x            team      (member)
```

* **personal** — your personal account, created at signup.
* **team** — a team, created by hand (in the dashboard or via
  `layero deploy --org=...`).

Under the older naming scheme the organization slug was a prefix of the
hostname (`<org>-<project>.layero.app`). For projects created after the move
the address consists of the project slug alone — see
[Environments, previews and production](../deploys/environments).

## `layero projects list`

Shows every project you have access to.

## `layero link`

Link the current directory to an existing project:

```bash
npx layero@latest link 123          # by id
npx layero@latest link alice-blog   # by slug
```

It creates `./.layero/project.json` pointing at the project. Useful when you
cloned somebody else's repository and want to deploy into your own project, or
moved from another folder.

## `layero deploy`

Pack the current directory and start a deploy. Details in
[`layero deploy`](./deploy).

## `layero deploys list`

Show the project's recent deploys (the default branch unless told otherwise):

```bash
npx layero@latest deploys list                       # the current default branch
npx layero@latest deploys list --branch=staging      # another branch
npx layero@latest deploys list --limit 50            # more history
```

Each line carries the status (`ready`/`building`/`failed`), the commit SHA, a
timestamp and the deploy **source**:

| Badge | What it means |
|---|---|
| `(push)` | Came from a GitHub webhook after a push |
| `(cli)` | Uploaded through `layero deploy` |
| `(manual)` | Started by hand from the dashboard (Redeploy) |


## `layero projects create`

A project from a repository without the dashboard — path (a) for agents and
the terminal:

```bash
layero sources list                                           # providers and connections
echo "$GITVERSE_TOKEN" | layero sources connect gitverse --token-stdin
layero sources repos <connection_id>
layero projects create --repo gitverse:acme/site --branch main --json
```

GitHub is connected by installing the Layero GitHub App in the dashboard; the
other providers take a personal access token. The command checks the
repository against the connection, creates the project and installs the
webhook. If the provider refuses the webhook (token permissions; SourceCraft
has no outgoing webhooks at all), the CLI says so with `webhook_unavailable`
and the URL to register by hand — the repository is connected either way, only
push-triggered builds wait for the webhook.

## `layero projects delete`

```bash
layero projects delete <slug> --yes
```

Irreversible: the address and slug are freed immediately, resources are
cleaned up in the background. The route needs a token with scope `admin` —
the default token (`read` + `deploy`) gets `forbidden`, and that is right: an
agent holding a deploy token must not be able to wipe a project. In a terminal
without `--yes` the command asks you to type the slug; outside a terminal
without `--yes` it refuses with `confirmation_required`.

## `layero envs list`

The project's environments with their addresses. An environment and a branch
are the same thing: a CLI project has one (`cli`), a project with a repository
has one per branch; production is marked. In `--json` — the `environments`
event.

## `layero claim`

For a project created without an account (`layero deploy --claim`):
`layero claim status` shows whether the claim is alive, `layero claim accept`
opens the dashboard page where a human takes the site into their account. A
claim cannot be accepted from the terminal — only by a person in the
dashboard.

## `layero hooks`

A deploy hook is a URL that starts a build when it receives a `POST`. It is
for cases where the build is triggered by something other than a person:
publishing in a headless CMS, a cron job, an external CI pipeline.

```bash
layero hooks create strapi-content        # preview hook, default branch
layero hooks create publish --prod        # production hook
layero hooks list
layero hooks delete <id>                  # revoked immediately
```

The command prints a URL of the form `https://api.layero.ru/hooks/<token>`.
Verified on a live project: `POST` returns `202` with a `deploy_id` and starts
a build, while `GET` returns `405` — so a crawler or an accidental visit in a
browser cannot fire one.

:::warning[The hook URL is a credential]
Anyone holding it can start a build. To rotate, delete the hook and create a
new one; there is no separate "regenerate token".
:::

## `layero promote`

Point the project's production apex at a specific ready deploy. Details in
[`layero promote`](./promote).

```bash
npx layero@latest promote                        # default branch → latest ready
npx layero@latest promote --branch=staging       # latest ready of the staging branch
npx layero@latest promote a3f9c2b                # a specific deploy by commit_sha (positional)
npx layero@latest promote --yes                  # no confirmation (CI)
```

`layero deploy --promote` is the short path — "build it and ship it to
production straight away", equivalent to
`layero deploy … && layero promote <last-sha>`.
