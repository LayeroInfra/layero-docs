---
sidebar_position: 1
slug: /
title: What is Layero
description: Layero builds and publishes sites and apps on servers in Russia — from a repository, from a folder or by an AI agent. Custom domains, branch previews, server apps, Postgres databases.
---

# Layero

**Layero builds and publishes your site or app on servers in Russia.** You
bring the code — from a repository, from a folder or through an AI agent — and
the platform builds it and serves it at `<project>.layero.app`.

## How to publish a site

- **From a repository.** Connect a repository on GitHub, GitVerse, GitLab,
  GitFlic or SourceCraft. A push to the main branch updates the site; a push
  to any other branch gives a preview at its own address.
  See [Connecting a repository](./deploys/git-providers.md).
- **From a folder.** `npx layero@latest deploy` in the project folder uploads
  the code, and we build it on our side. No git needed. Without a terminal,
  drag the folder into the dashboard: **«Новый проект» → «Загрузить из папки»**
  (New project → Upload a folder). See [Your first site](./getting-started/quickstart.md).
- **Through an AI agent.** Claude Code, Cursor, Codex and other agents
  publish and run the site themselves. See [AI agents](./agents/index.md).

## What else the platform does

- **Apps with a server** — Next.js with server rendering, Node.js and Python
  servers, Streamlit, Gradio. The app starts on the first request and goes to
  sleep when nobody uses it. See [Runtime apps](./runtime/overview.md).
- **Custom domains** with automatic HTTPS — on the Pro plan.
  See [Custom domain](./addresses/custom-domains.md).
- **Postgres databases** and the **Data API** — HTTP access to the database
  straight from the frontend. See [Databases](./database/index.md) and
  [Data API](./data-api/index.md).
- **Speed and traffic** — page speed measurement and web analytics.
  See [Page Speed](./performance/index.md) and [Analytics](./team/analytics.md).

## The platform in brief

| What | How |
|---|---|
| Where it runs | build and delivery servers in Russia |
| Project address | `<project>.layero.app` with HTTPS; a custom domain after a DNS check |
| What it builds with | Node.js 20, 22 or 24 (22 by default), Python 3.10–3.13 (3.12 by default) — see [Node.js and Python versions](./build/runtime-versions.md) |
| Plans | Free and Pro, paid in rubles from the organization's balance — see [Plans](./billing/plans.md) |

## Where to start

- [Your first site](./getting-started/quickstart.md) — publish a site from
  a folder with one command.
- [How it all fits together](./getting-started/concepts.md) — organization,
  project, environment, build, main address.
- [AI agents](./agents/index.md) — the skill, MCP and CLI for Claude Code,
  Cursor, Codex.
- [Support](./support.md) — the chat in the dashboard and support@layero.ru.

Website — [layero.ru](https://layero.ru), dashboard —
[app.layero.ru](https://app.layero.ru), news —
[t.me/layero_ru](https://t.me/layero_ru).
