---
sidebar_position: 3
title: MCP tools
description: Every tool of the mcp.layero.ru server by group — which ones change the site and need a person's consent, what works without signing in, how to limit a connection to one project or to read-only.
---

# MCP tools

**The Layero MCP server gives an agent access to projects, builds, domains and
the database.** The server address is `https://mcp.layero.ru/mcp`, the name in
client settings is `layero`. How to connect — [Connect an agent](./install.md).
This page lists what each tool does.

{/* Tool names are checked against the live server by ../mcp/check-tool-names.py:
    retired names (compose_landing and others) are not allowed here. */}

The ⚠️ mark means the tool can change the site, the project or access: always
or only with some parameters. For example, `env_vars` changes variables only
when it writes them.

## Account and projects

| Tool | What it does |
|---|---|
| `whoami` | Who is connected: username, email, number of projects. |
| `my_projects` | Projects with addresses and the code source — a repository or a folder upload. The `repo` parameter keeps the projects of one repository. |
| `list_sources` | Repository providers (GitHub, GitVerse, GitLab, GitFlic, SourceCraft) and which of them the organization has connected. |
| `import_repo` ⚠️ | Create a project from a repository and start the first build. An app in a subfolder — the `root_directory` parameter, for example `apps/web`. Provider not connected — the reply links to the dashboard: a person connects the provider token. Repository already linked — the reply lists its projects. |
| `project_create` ⚠️ | An empty project without a repository — an address for a future publish. |
| `project_settings` ⚠️ | Read or change build settings: app folder, install and build commands, output folder, project type, the "Made with Layero" label. Shows where each value comes from. |

## Team members

| Tool | What it does |
|---|---|
| `team_members` | Who is in the team: role (owner, developer, guest) and project access. Only owners see paid seats and invitations. |
| `team_invite` ⚠️ | Invite a person by email with the role `developer`, `guest` or `owner`. A developer or an owner needs a free paid seat; without one, the answer says how to add a seat or invite as a guest. Roles, project access and seats are changed in the dashboard or with `npx layero@latest team`. |

## Site and builds

| Tool | What it does |
|---|---|
| `site_status` | The site's state: latest build, address, repository and branch. Tells the site's own response from a platform page. The `path` parameter checks a specific address on the site, `wait_s` waits for a running build to finish. |
| `list_environments` | The project's environments — branches with addresses and the state of the latest build. |
| `list_deploys` | Build history: status, source, time in the queue and duration. |
| `deploy_logs` | Build and app logs. Noisy package install lines are hidden by default. |
| `diagnose_deploy` | Why a build failed: log analysis, the next step and what it was built with — framework, commands, output folder, Node.js version. |
| `retry_deploy` ⚠️ | Restart a build. With `redeploy=true` it rebuilds the latest commit without a push. |
| `cancel_deploy` ⚠️ | Stop a running build. |
| `rollback` ⚠️ | Put the previous build back on the main address. |
| `download_source` | A link to a ZIP with the sources of an uploaded build; lives 5 minutes, no `.env*` files in the archive. For a build from a repository — a link to the commit. |
| `publish_site` ⚠️ | Publish ready-made files with `index.html` without the CLI: up to 200 files, up to 8 MB in total and up to 2 MB per file. Creates the project if there is none. `publish_landing` is the old name of the same tool. |
| `env_vars` ⚠️ | Read, set or delete environment variables. |

## Domains

| Tool | What it does |
|---|---|
| `list_domains` | The project's domains and their state. |
| `connect_domain` ⚠️ | Connect a custom domain — returns the DNS records to create. |
| `check_domain` | Check whether the domain works: DNS and certificate. |

## Site content

| Tool | What it does |
|---|---|
| `read_site` | Read a page of the published site — text and markup. |
| `site_screenshot` | A screenshot of a site page. |
| `site_issues` | What to fix on the site: broken links, meta tags, accessibility — with the address of each problem. |
| `refactor_site` | Suggest a markup edit. Returns the changes, does not touch files. |
| `check_copy` | Proofread Russian text: typography and editorial rules. |
| `check_rules` | Check the site against [Layero's anti-phishing rules](https://layero.ru/rules): collecting other services' passwords and card details, fake warnings, prize lures. |
| `check_performance` | Measure site speed: Core Web Vitals and Lighthouse. |

## Analytics

| Tool | What it does |
|---|---|
| `connect_analytics` ⚠️ | Connect Yandex Metrica to the project. |
| `site_analytics` | Site traffic over a period. |

## Data API

| Tool | What it does |
|---|---|
| `data_api_status` | Whether the Data API is on for the project's database, and at what address. |
| `data_api_methods` | Tables and functions available through the API, and who can use them. |
| `data_api_grant` ⚠️ | Open or close access to a table or function for a role. |
| `data_api_keys` ⚠️ | Issue or revoke keys. |
| `data_api_origins` ⚠️ | Sites allowed to query the database from a browser. |
| `data_api_buckets` ⚠️ | Buckets for files: list and create. Creating needs a token with the `admin` scope. |
| `data_api_auth` ⚠️ | App user sign-in: methods, providers, return address, sender name of sign-in emails. Provider keys are set by a person — in the dashboard or with `layero data auth provider set`. |
| `data_api_probe` | A test request to a table or function: check access and the response. Rolls back writes, changes no data. |

## Documentation

| Tool | What it does |
|---|---|
| `search_docs` | Search docs.layero.ru. |
| `report_docs_issue` | Tell us about a docs error that cost the agent time. No account data goes into the report. |

## What needs a person's consent

Tools marked ⚠️ run in the client — Claude Code, Cursor, Codex — only after a
person confirms. The rest only read, and the client calls them without
asking. Sometimes the client also asks about `data_api_probe` or
`report_docs_issue`: they are not marked read-only, though they do not change
projects.

Before `rollback`, `publish_site`, a write with `env_vars`, `data_api_grant`
and `data_api_keys`, the agent tells the person what exactly will change and
waits for an answer — even if the client does not ask for confirmation.

## Sign-in

`search_docs`, `report_docs_issue`, `check_copy` and `refactor_site` work
without signing in: connect the server and ask about the platform right away.

The other tools need an account. A client with OAuth sign-in opens the
browser itself on the first such call — you only confirm the sign-in. For CI
and environments without a browser — the `Authorization: Bearer $LAYERO_TOKEN`
header; how to issue a token — [Connect an agent](./install.md#layero_token-for-ci).
Only the CLI can publish without an account: `npx layero@latest deploy --claim`.

## One project or read-only

A connection can be limited right in the server address:

```
https://mcp.layero.ru/mcp?project=<slug>
https://mcp.layero.ru/mcp?project=<slug>&read_only=true
```

- `project=<slug>` — tools work only with this project: a call for another
  project is refused.
- `read_only=true` — everything that changes the site or the project is
  refused. Handy for an agent that should only investigate a problem.
  Reporting a docs error still works.

Put the address with parameters in the `url` field of the client settings.
