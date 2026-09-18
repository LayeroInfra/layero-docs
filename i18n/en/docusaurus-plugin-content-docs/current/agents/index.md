---
sidebar_position: 1
slug: /agents/
title: How an AI agent works with Layero
description: The three paths for an agent — a connected repository, a folder with code, a site already published. How to pick the path, what the agent never does, where the skill lives.
---

# How an AI agent works with Layero

Layero is built on the assumption that the site is published not by a person
at a keyboard but by an agent — Claude Code, Cursor, Codex or anything else
that can run commands and connect to MCP. Everything the agent needs to know
lives in one skill:
[`LayeroInfra/layero-agents`](https://github.com/LayeroInfra/layero-agents),
file `skills/layero/SKILL.md`. This page is its short version.

## The three paths

An agent is always in one of three situations, and that decides what to do.

### (a) There is a connected repository

The project is linked to a repository on GitHub, GitVerse, GitLab, GitFlic or
SourceCraft. Then a deploy is a `git push`:

- push to a branch → a preview environment with its own address;
- push to `main` (the production branch) → production.

The agent commits and pushes; nothing needs to be run. A repository is
connected in the dashboard: **"Create project" → "Import from repository"**.
The CLI and MCP cannot connect a repository yet.
Details: [Connecting a repository](../deploys/git-providers.md).

### (b) There is a folder with code

No repository, or no wish to connect one. Then:

```bash
npx layero@latest deploy --json
```

The CLI packs the folder, uploads it and **builds on our side** — the agent
needs neither Node nor a bundler. The first run asks to open a link and
confirm the sign-in (device flow); in CI the `LAYERO_TOKEN` variable is used
instead. Ready-made static output (a folder with `index.html`) can be published
without the CLI at all — with the MCP tool `publish_site`.

How the CLI talks to an agent — events, error codes, what counts as the site
address — is on [Deploying from AI agents](../cli/agents.md).

**When detection is wrong.** The first deploy goes without `layero.json`. If
the build failed or a server got published as a static site, the agent fixes
one field per symptom using the table on the
[`layero.json`](../deploys/layero-json.md) page — and does not deploy a third
time with the same error.

### (c) There is a site on Layero

The site is already published and the task is to understand what is going on
with it. This is MCP territory: `diagnose_deploy` (or `layero diagnose`) for a
failed build, `deploy_logs`, `rollback`, domains (`connect_domain`,
`check_domain`), environment variables (`env_vars`), analytics
(`site_analytics`), Data API (`data_api_*`). The full list: [MCP tools](./mcp-tools.md).

## How to pick the path

| Question | Yes | No |
|---|---|---|
| Does the project have a connected repository? | path (a): `git push` | next question |
| Is there a folder with sources or ready static output? | path (b): `npx layero@latest deploy --json` or `publish_site` | next question |
| Is the site already on Layero and needs diagnosing or configuring? | path (c): MCP tools | ask the person what they want |

Whether a repository exists is visible via `site_status` or `my_projects` —
the response shows the project's source.

## What the agent never does

- **Never runs `git init` for the sake of a deploy.** No repository means
  path (b), not creating a repository "like on Vercel".
- **Never installs the CLI globally** (`npm i -g layero`). In an agent sandbox
  that often fails; always `npx layero@latest`.
- **Never assembles the site address from a template.** The address comes
  only from the `ready.url` event (CLI) or from the `publish_site` /
  `site_status` response (MCP). A guessed `<slug>.layero.app` may belong to
  someone else or be empty.
- **Never publishes something that replaces the live site without the
  person knowing.** A plain `deploy` of a CLI project is not a preview — it
  replaces production; MCP tools that change the site require confirmation
  (see [MCP tools](./mcp-tools.md)).

## Where next

- [Connect an agent](./install.md) — install commands for every client,
  OAuth and `LAYERO_TOKEN`.
- [MCP tools](./mcp-tools.md) — what `mcp.layero.ru` can do.
- [The layero skill](./skill.md) — what is inside the skill and how it is
  installed.
- [Deploying from AI agents](../cli/agents.md) — the CLI's JSON mode.
