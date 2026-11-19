---
sidebar_position: 1
slug: /agents/
title: How an AI agent works with Layero
description: An agent publishes and runs the site itself — through a connected repository, the CLI or MCP. The three paths, one-click sign-in, a site without an account, what an agent never does.
---

# How an AI agent works with Layero

**An agent publishes and runs the site itself — all you do is one click to
confirm the sign-in.** Claude Code, Cursor, Codex and any agent that can run
commands or connect MCP work with Layero the same way.

What it looks like in a chat:

```
You:    publish this landing page on Layero
Agent:  Open https://app.layero.ru/cli?code=ABCD-1234 and confirm the sign-in.
Agent:  Done: https://my-landing.layero.app
```

Then you can say "make the button red" — the agent edits the code and
publishes again to the same address.

Everything an agent needs to know is in the `layero` skill — see
[The layero skill](./skill.md). How to connect the skill and MCP to your
client — [Connect an agent](./install.md).

## Three paths

What the agent does depends on the situation.

### A repository is connected

The project is linked to a repository on GitHub, GitVerse, GitLab, GitFlic or
SourceCraft. Then publishing is `git push`:

- a push to a branch gives a preview at its own address;
- a push to the main branch (usually `main`) updates the site.

The agent commits and pushes, nothing else to run. If there is a repository
but no Layero project yet, the agent creates one itself:

```bash
npx layero@latest projects create --repo github:acme/site
```

Or with the MCP tool `import_repo`. A person can do the same in the dashboard:
**«Новый проект» → «Импорт из репозитория»** (New project → Import a
repository). More in [Connecting a repository](../deploys/git-providers.md).

### There is a folder with code

No repository, or you would rather not connect one:

```bash
npx layero@latest deploy --dry-run --json   # how it will build; uploads nothing
npx layero@latest deploy --json
```

The CLI packs the folder, and the platform builds it on its side: the agent's
machine needs no build tools, only Node.js 20 or newer for `npx`. Ready-made
files with `index.html` can also be published without the CLI — with the MCP
tool `publish_site`.

How the CLI talks to an agent — events, error codes, the site address — is on
the [CLI JSON events](../cli/json-events.md) page.

**If the project was detected wrong.** The first publish goes without
`layero.json`. If the build failed or a server was published as a static
site, the agent fixes one field using the symptom table on the
[`layero.json`](../build/layero-json.md) page and does not publish again
with the same error.

### The site is already on Layero

The site is live, and you need to find out what is wrong or set something up.
For this the agent has MCP: `diagnose_deploy` explains a failed build,
`deploy_logs` gives the logs, `rollback` rolls back, `connect_domain` connects a domain,
`check_domain` checks it, `env_vars` changes environment variables,
`site_analytics` shows traffic, `data_api_*` work with the database. The CLI
does the same: `layero diagnose`, `layero logs`, `layero rollback`,
`layero domains`, `layero env`. The full list — [MCP tools](./mcp-tools.md).

### How to pick the path

| Question | Yes | No |
|---|---|---|
| Does the project have a connected repository? | `git push` | next question |
| Is there a folder with sources or ready-made files? | `npx layero@latest deploy --json` or `publish_site` | next question |
| Is the site already on Layero and needs a look or a setting? | MCP tools or CLI commands | ask the person what they want |

Whether the project has a repository, the agent sees in the `site_status` or
`my_projects` response.

## Sign-in

The agent does not need to ask the person to run `layero login`:
`layero deploy` starts the sign-in itself and prints a link. The agent shows
it in the chat and waits — the person opens the link, signs in and comes back
to the conversation. The browser can be on another device.

Where nobody can confirm a sign-in — in CI and background jobs — a token in
the `LAYERO_TOKEN` variable is needed. How to issue one —
[Connect an agent](./install.md#layero_token-for-ci).

## A site without an account

No account yet, or the person stepped away from the computer:

```bash
npx layero@latest deploy --claim --yes --json
```

The platform publishes a temporary site for an hour at a random address closed
to search engines. Along with the address the agent gets a `claim_url` link and
hands it to the person: only a person can take the site into their account.
Only static sites and SPAs can be published this way — an app with a server
needs an account.

Without `--claim` and without a token the CLI asks for a sign-in. An agent
publishes without an account only if the person asked for it or agreed.

## What an agent never does

- **Does not create a repository just to publish.** No repository — it
  publishes the folder, it does not run `git init`.
- **Does not install the CLI globally.** `npm i -g layero` often fails in an
  agent's sandbox — always `npx layero@latest`.
- **Does not build the site address itself.** The address comes only from the
  platform: the `url` field of the CLI's `ready` event, or the `publish_site`
  and `site_status` responses in MCP. An address assembled from the project
  name may belong to someone else or be empty.
- **Does not replace the live site without the person knowing.** For a
  project without a repository, every `layero deploy` is visible to visitors
  at once — such a project has no previews, and `--branch` will not give one.
  MCP tools that change the site run only after the person confirms — see
  [MCP tools](./mcp-tools.md#what-needs-a-persons-consent).

## What next

- [Connect an agent](./install.md) — install commands for every client and a
  token for CI.
- [MCP tools](./mcp-tools.md) — what `mcp.layero.ru` can do.
- [The layero skill](./skill.md) — what is in the skill and what
  `layero init` writes to the project.
- [CLI JSON events](../cli/json-events.md) — events and error codes.
