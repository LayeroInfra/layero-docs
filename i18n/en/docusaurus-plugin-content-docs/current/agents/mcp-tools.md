---
sidebar_position: 3
title: MCP tools
description: The full list of tools on mcp.layero.ru by group, which of them change the site and need a person's confirmation, and the project and read_only URL parameters.
---

# MCP tools

The Layero MCP server: `https://mcp.layero.ru/mcp`, Streamable HTTP
transport, named `layero` in client configs. How to connect is described on
[Connect an agent](./install.md); this page is what the server can do, one
line per tool.

{/* Tool names are checked against the live server by ../mcp/check-tool-names.py:
    retired names (compose_landing and the like) are not allowed here. */}

## Account

| Tool | What it does |
|---|---|
| `whoami` | Who is connected: user, organisation, token expiry. |
| `my_projects` | The list of projects with addresses and source (repository or CLI). |
| `list_sources` | Git providers (GitHub, GitVerse, GitLab, GitFlic, SourceCraft) and the organisation's connections. |
| `import_repo` ⚠️ | Create a project from a repository: GitHub through the App installation, the others through the organisation's connection. Once linked, it applies the detected settings and starts the first build itself — what the dashboard's "Start deploy" button does; the result carries `setup` (`applied` / `pending` / `failed`), `first_deploy_id` and an honest `next_action`. `deploy=false` leaves the project in the setup wizard. Provider not connected — the answer is `needs_connection` with the dashboard address; the provider token is connected by the person, not the agent. |
| `project_create` ⚠️ | An empty project with no repository — an address reserved for a later `publish_site` or `npx layero@latest deploy`. |

## Site and deploys

| Tool | What it does |
|---|---|
| `site_status` | Site state: latest deploy, address, environments. When there has been no build yet it says so instead of passing a missing build off as a successful one. |
| `list_environments` | The project's environments — one per branch — with addresses and the state of the latest build. |
| `list_deploys` | The project's build history. |
| `deploy_logs` | Build and application logs. |
| `diagnose_deploy` | Why a build failed — with a log breakdown and the next step. |
| `retry_deploy` ⚠️ | Restart a failed build. |
| `cancel_deploy` ⚠️ | Cancel a running build. |
| `rollback` ⚠️ | Roll production back to a previous build. |
| `publish_site` ⚠️ | Publish ready static output (a folder with `index.html`) without the CLI; creates the project if it does not exist. `publish_landing` is a deprecated alias of `publish_site`. |
| `env_vars` ⚠️ | Read, set or delete the project's environment variables. |

## Domains

| Tool | What it does |
|---|---|
| `list_domains` | The project's domains and their state. |
| `connect_domain` ⚠️ | Connect your own domain: returns the DNS records to create. |
| `check_domain` | Check whether the domain works: DNS and certificate. |

## Site content

| Tool | What it does |
|---|---|
| `read_site` | Read a page of the published site as text and markup. |
| `site_screenshot` | A screenshot of a site page. |
| `site_issues` | What to fix on the site: broken links, meta tags, accessibility. |
| `refactor_site` | Propose a markup change — returns a patch, touches no files. |
| `check_copy` | Proofread Russian text against Layero's editorial rules. |
| `check_performance` | Measure site speed: Core Web Vitals, Lighthouse. |

## Analytics

| Tool | What it does |
|---|---|
| `connect_analytics` ⚠️ | Connect Yandex Metrica to the project. |
| `site_analytics` | Site traffic over a period. |

## Data API

| Tool | What it does |
|---|---|
| `data_api_status` | Whether the Data API is enabled for the project's database, and its address. |
| `data_api_methods` | Methods (tables and functions) and who may call them. |
| `data_api_grant` ⚠️ | Open or close access to a method for a role. |
| `data_api_keys` ⚠️ | Issue or revoke Data API keys. |
| `data_api_origins` ⚠️ | Sites allowed to call from the browser (CORS). |
| `data_api_probe` | A trial call of a method — check that access and the response are as expected. |

## Documentation

| Tool | What it does |
|---|---|
| `search_docs` | Search docs.layero.ru; touches no account data. |

## Which tools need a person's consent

Tools marked ⚠️ **change** the site, the project or access — the server
declares them without `readOnlyHint`, and the client (Claude Code, Cursor,
Codex) asks for confirmation before the call. The rest only read, and the
client calls them without asking.

The rule for an agent: before `rollback`, `publish_site`, a writing
`env_vars`, `data_api_grant` and `data_api_keys`, tell the person exactly what
will change and wait for the answer — even when the client does not require
confirmation.

## Sign-in

The server requires sign-in: a connection without a token gets `401` with
`WWW-Authenticate`, and a client that supports OAuth (Claude Code, Cursor,
Codex, VS Code) opens the browser itself — all that is left is to click
"Allow access". The authorization server is `api.layero.ru`, the resource
metadata is `https://mcp.layero.ru/.well-known/oauth-protected-resource`. For
CI and environments without a browser — the header
`Authorization: Bearer $LAYERO_TOKEN`; how to issue a token is on
[Connect an agent](./install.md#layero_token-for-ci). Deploying without an
account exists only in the CLI: `npx layero@latest deploy --claim`.

## URL parameters: `project` and `read_only`

The server's scope can be narrowed right in the connection address:

```
https://mcp.layero.ru/mcp?project=<slug>
https://mcp.layero.ru/mcp?project=<slug>&read_only=true
```

- `project=<slug>` — every tool works with this project only; `my_projects`
  returns just it, and a call with another project is refused.
- `read_only=true` — the ⚠️ tools are not declared at all. Handy for an agent
  that should only diagnose.

The parameters go into the client config, in the `url` field — no separate
mechanism is needed.
