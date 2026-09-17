---
sidebar_position: 1
title: Quickstart
description: Install the CLI, sign in and publish your first site with one command. No git required.
---

# Quickstart

Thirty seconds to publish a local frontend through the CLI. **Git and GitHub
are not required** — Layero uploads the local directory directly. If you want
automatic deploys on `git push`, that is a day-N upgrade: see
[Deploying from GitHub](../deploys/github).

:::note[Is an agent publishing?]
If Claude Code, Cursor or another AI agent deploys the site, it needs the same
CLI in JSON mode plus the skill and MCP — see the
[AI agents](../agents/index.md) section.
:::

## 1. Run the CLI

Nothing to install — use `npx`:

```bash
cd my-site
npx layero@latest init
```

The command detects your framework (Next / Vite / Astro / SvelteKit / Nuxt /
Gatsby / CRA / Docusaurus / static HTML) and creates `.layero/project.json`.

Requires **Node.js ≥ 20**. If you prefer a local install:

```bash
npm install -D layero
```

## 2. Sign in

```bash
npx layero@latest login
```

The command prints a URL like `https://app.layero.ru/cli?code=ABCD-1234` and,
when run in a normal terminal, opens it in the browser. There you pick a
provider — **GitHub** or **Yandex ID**; a Layero account is created
automatically on the first OAuth — and press "Allow access". The CLI picks up
the token within a couple of seconds and saves it to `~/.layero/config.json`
(chmod 600).

:::tip[CLI on one machine, browser on another]
This is a device flow, like `gh auth login` or an Apple TV. The CLI does not
open a local HTTP server — the exchange goes through `api.layero.ru`. So the
login works from SSH, a Docker container, the Cursor sandbox and anywhere else
with an internet connection.
:::

## 3. Deploy

```bash
npx layero@latest deploy
```

The CLI will:

1. Auto-detect the framework and fill in `build_cmd` / `output_dir` if they are
   not set yet.
2. Pack the directory into a tar.gz, honouring `.gitignore` and
   `.layeroignore` (see [`layero deploy`](../cli/deploy)).
3. Upload the archive to Yandex Object Storage.
4. Start the build on the platform side.
5. Stream the logs to your terminal and print the address at the end.

The first deploy creates a project and records it in `./.layero/project.json`,
so later `layero deploy` runs go to the same project.

## 4. Open the site

When the build finishes the CLI prints the address — open it. The site is live
straight away; there is no host warm-up to wait for.

:::tip[What address the project gets]
User sites live in their own zone, `layero.app`. A new project gets an address
from a single slug: `https://my-site.layero.app`. Projects created before the
move (26 July 2026) still carry the organization prefix:
`https://vasya-my-site.layero.app`.

The exact address is printed by the CLI and shown in the dashboard — do not
assemble it from a template. More in
[Environments, previews and production](../deploys/environments).
:::

## 5. Changed the code — run `layero deploy` again

```bash
# you edited something in the editor (or an AI agent did)
npx layero@latest deploy
# → the new build is published to the project's production address again
```

For a CLI project (one with no repository connected) every `layero deploy`
**publishes to the apex automatically** — direct uploads auto-promote, and
neither `--prod` nor `promote` is needed.

The flip side is worth stating plainly: a plain deploy is **not** an isolated
preview — it replaces what visitors see.

:::danger[`--branch` does nothing in `layero deploy`]
The flag is accepted and silently ignored: the backend files **every** archive
upload under the reserved `cli` environment, so that a manual upload can never
collide with a branch of a connected repository (`projects.py:2865`). Verified
by experiment: after `layero deploy --branch=probe` no `probe` environment is
created.

What that means in practice:

- **A project with no repository.** `cli` *is* its default branch, so the
  deploy auto-promotes to the apex. **Every `layero deploy` replaces the live
  site, and there is no way to upload a non-promoting build from the CLI.**
- **A project with a repository connected.** `cli` is not the default branch,
  so a CLI upload lives at its own `<project>-cli` address and does not move
  the apex (unless `--prod` is passed).

Branch previews are a git-flow feature: pushing to a branch creates the
environment through the webhook.
:::

See [`layero promote`](../cli/promote) and
[Environments](../deploys/environments) for the production flow of git-backed
projects.

## Where to go next

- Using Cursor, Claude Code or another AI agent? —
  [Deploying from AI agents](../cli/agents).
- Bring a project up from GitHub: [Deploying from GitHub](../deploys/github).
- Add environment variables: [Env vars](../deploys/env-vars).
- Connect your own domain: [Custom domains](../deploys/custom-domains).
