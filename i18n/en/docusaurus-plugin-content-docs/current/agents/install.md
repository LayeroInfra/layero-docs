---
sidebar_position: 2
title: Connect an agent
description: Install commands for the Layero skill and MCP server in Claude Code, Cursor, Codex and any agent. Browser sign-in, the LAYERO_TOKEN token for CI and the Claude Code plugin, checking the connection.
---

# Connect an agent

**One command for your client, and the agent can publish and run sites on
Layero.** The commands below come from
[`agents-install.json`](https://github.com/LayeroInfra/layero-docs/blob/main/agents-install.json),
the same file the website and the dashboard read.

{/* The table below is generated from agents-install.json by
    scripts/check-agents-install.py --write and checked in make check.
    Do not edit by hand — edit the file. */}

{/* agents-install:begin */}
MCP server: `https://mcp.layero.ru/mcp` (transport `http`, name `layero`).
Skill repository: [`LayeroInfra/layero-agents`](https://github.com/LayeroInfra/layero-agents).

| Client | Command |
|---|---|
| CLI | `npx layero@latest deploy` |
| Agent Skill | `npx skills add LayeroInfra/layero-agents` |
| Agent MCP | `npx -y add-mcp https://mcp.layero.ru/mcp` |
| Claude Code | `claude plugin marketplace add LayeroInfra/layero-agents && claude plugin install layero@layero` |
| Cursor | `npx -y add-mcp https://mcp.layero.ru/mcp` — or the [install button](https://cursor.com/en/install-mcp?name=layero&config=eyJ1cmwiOiJodHRwczovL21jcC5sYXllcm8ucnUvbWNwIn0%3D) |
| Codex CLI | `codex mcp add layero --url https://mcp.layero.ru/mcp` |

In CI: `LAYERO_TOKEN=… npx layero@latest deploy --project <slug> --json --yes`
{/* agents-install:end */}

## What to install

- **Just the CLI** — if the agent only needs to publish a folder with code.
  Nothing to install: `npx` takes the latest version every time.
- **The skill** (the "Agent Skill" row) — instructions for the agent: the
  three paths, CLI events, what not to do. A second skill comes with it,
  `layero-content-rules`, — a check of the site against Layero's
  anti-phishing rules. More in [The layero skill](./skill.md).
- **MCP** (the "Agent MCP" row) — if the agent should see the site's state,
  logs, domains, database. The command connects the server to every installed
  client. What it can do — [MCP tools](./mcp-tools.md).
- **The Claude Code plugin** installs both skills and MCP with one command. The
  Cursor plugin is installed from Cursor itself: **Customize → Plugins →
  Add**, repository `LayeroInfra/layero-agents`.

## Sign-in

Four tools work without signing in: `search_docs`,
`report_docs_issue`, `check_copy` and `refactor_site`. The rest need a Layero
account.

**In the browser.** If the client supports OAuth sign-in, on the first call of
a tool that needs an account it opens the browser itself. Confirm the
sign-in, and the connection works. No token or config edits needed.

If the client shows "Authenticating…" but does not open the browser, it has no
OAuth sign-in. Then you need a token.

:::warning[The Claude Code plugin works only with a token]

The plugin sends the server a token from the `LAYERO_TOKEN` environment
variable. Set it before starting Claude Code — otherwise tools that need an
account reply that there is no token, and no browser opens. To sign in through
the browser without a token, connect MCP with the command from the "Agent MCP"
row.

:::

## `LAYERO_TOKEN` for CI

In CI and anywhere nobody can confirm a sign-in in a browser, you need a token
in the `LAYERO_TOKEN` variable. Issue one with:

```bash
npx layero@latest token create ci
```

or in the dashboard: [app.layero.ru/settings/cli](https://app.layero.ru/settings/cli),
the «Токены CLI и CI» (CLI and CI tokens) section. The token is shown once.

Such a token can read and publish, but cannot delete a project or create a
bucket for database files. That needs a token with the `admin` scope:
`--scope read,deploy,admin`. Keep the token in your CI secrets, not in the
repository. Revoke it in the same dashboard section or with
`layero token revoke`.

Then:

- **The CLI** reads the variable itself. `--yes` turns off questions, `--json`
  turns on line-by-line events. A ready example — [GitHub Actions](../deploys/github-actions.md).
- **MCP** accepts the same token in the `Authorization: Bearer $LAYERO_TOKEN`
  header. In Codex, add the `--bearer-token-env-var LAYERO_TOKEN` flag to the
  command from the table.

## Check the connection

Ask the agent to call `whoami`. The reply has the username, email and number
of projects. The tool is missing from the client's list — MCP is not
connected. A "not authorized" reply — the sign-in did not happen or the token
is not set.
