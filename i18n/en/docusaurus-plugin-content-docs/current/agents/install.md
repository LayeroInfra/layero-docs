---
sidebar_position: 2
title: Connect an agent
description: Layero install commands for the CLI, the skill, Claude Code, Cursor, Codex and any MCP client — from a single agents-install.json. OAuth for clients and LAYERO_TOKEN for CI.
---

# Connect an agent

The commands on this page come from the file
[`agents-install.json`](https://github.com/LayeroInfra/layero-docs/blob/main/agents-install.json),
the same one the landing page and the dashboard read.

{/* The table below is generated from agents-install.json by
    scripts/check-agents-install.py --write and checked by a gate in make check.
    Do not edit it by hand — edit the file. */}

{/* agents-install:begin */}
MCP server: `https://mcp.layero.ru/mcp` (transport `http`, name `layero`).
Skill repository: [`LayeroInfra/layero-agents`](https://github.com/LayeroInfra/layero-agents).

| Client | Command |
|---|---|
| CLI | `npx layero@latest deploy` |
| Agent Skill | `npx skills add LayeroInfra/layero-agents` |
| Any agent | `npx -y add-mcp https://mcp.layero.ru/mcp` |
| Claude Code | `claude plugin marketplace add LayeroInfra/layero-agents && claude plugin install layero@layero` |
| Cursor | `npx -y add-mcp https://mcp.layero.ru/mcp` — or the [install button](https://cursor.com/en/install-mcp?name=layero&config=eyJ1cmwiOiJodHRwczovL21jcC5sYXllcm8ucnUvbWNwIn0%3D) |
| Codex CLI | `codex mcp add layero --url https://mcp.layero.ru/mcp` |

In CI: `LAYERO_TOKEN=… npx layero@latest deploy --project <slug> --json --yes`
{/* agents-install:end */}

## What to install

- **CLI** — if the agent only needs to publish a folder with code. Nothing is
  installed: `npx` fetches the current version on every run.
- **Agent Skill** — instructions for the agent (the three paths, JSON events,
  what not to do). Works with any client that reads `.agents/skills`. Details:
  [The layero skill](./skill.md).
- **MCP** — if the agent should see the site's state, logs, domains, Data
  API. For Claude Code and Cursor the plugin installs both the skill and MCP
  at once; for the others — `add-mcp` plus `npx skills add`.

The MCP tools are described on [MCP tools](./mcp-tools.md).

## Sign-in: OAuth in the client

`search_docs`, `check_copy` and `refactor_site` work without sign-in — the
documentation is always available, right after connecting. Every other tool
works with a Layero account. Clients that support OAuth (Claude Code, Cursor,
Codex) **open the browser themselves** on the first call of such a tool —
confirm the sign-in, and the connection appears in the client automatically.
No token and no config editing needed.

If the client shows an "Authenticating…" card and does not open a browser, it
has no OAuth; move on to the token.

## `LAYERO_TOKEN` for CI

In CI and in environments without a browser, sign-in is done with a token in
the `LAYERO_TOKEN` environment variable. Issue a token:

```bash
npx layero@latest token create
```

or in the dashboard: **app.layero.ru → Settings → CLI**. The token is shown
once.

Then:

- **The CLI** reads the variable itself:
  `LAYERO_TOKEN=… npx layero@latest deploy --project <slug> --json --yes`.
  The `--yes` flag turns off questions; `--json` gives line-by-line events
  to parse. A ready example: [GitHub Actions](../cli/github-actions.md).
- **MCP** accepts the same token in the header
  `Authorization: Bearer $LAYERO_TOKEN`. In Codex:
  `codex mcp add layero --url https://mcp.layero.ru/mcp --bearer-token-env-var LAYERO_TOKEN`.

The token grants full access to the organisation — keep it in CI secrets, not
in the repository.

## Check the connection

Ask the agent to call `whoami`. The response contains your login, organisation
and token expiry. If the tool is missing from the client's list, MCP is not
connected; if the answer is "not authorised", sign-in has not happened.
