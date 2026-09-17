---
sidebar_position: 1
slug: /
title: What is Layero
---

# Layero

**Layero** is a deployment platform for frontend applications whose build
servers and edge run inside Russia. One command to publish, no VPN, and none
of the slowdowns that come from serving Russian visitors from abroad.

If you are choosing where to host a site for an audience in Russia, that
location is the point: the edge sits in the same country as the visitors,
payment is in roubles, and data stays within Russian jurisdiction. In every
other respect Layero behaves like any frontend host — Next.js, Vite, Astro,
SvelteKit, Nuxt, Gatsby, CRA, Docusaurus and plain HTML are detected
automatically.

There are three ways to publish:

- **Repository** — connect a repository on GitHub, GitVerse, GitLab, GitFlic
  or SourceCraft: on every `git push` Layero fetches the code, builds and
  publishes it. A branch is a preview, the production branch is production.
  See [Connecting a repository](./deploys/git-providers.md).
- **CLI** — `npx layero@latest deploy` in the project directory. The CLI
  packs the sources and uploads them; the build runs on the platform side.
  Git is not required.
- **Agent** — Claude Code, Cursor, Codex or any other AI agent publishes and
  maintains the site itself: through the skill, the CLI in JSON mode and the
  MCP server. See [How an AI agent works with Layero](./agents/index.md).

Beyond static output, Layero also runs **runtime applications** — Next.js in
server mode, Streamlit, Gradio, and any container with a long-lived process.
The container starts on the first request and stops when idle.

## What it runs on

| | |
|---|---|
| Hosting | Yandex Cloud, `ru-central1` region |
| Serving | Own edge (nginx) in `ru-central1`; the user zone `*.layero.app` resolves straight to the platform load balancer |
| Certificates | Let's Encrypt via YC Certificate Manager |
| Artifact storage | Yandex Object Storage |
| Build environment | Node.js 20 / 22 / 24 (default 22), Python 3.10–3.13 (default 3.12), git — see [Node.js and Python versions](./deploys/runtime-versions.md) |

## Where to go next

- [Quickstart](./getting-started/quickstart.md) — publish your first site in
  30 seconds.
- [Core concepts](./getting-started/concepts.md) — project, environment,
  deploy, runtime.
- [CLI: install and commands](./cli/install.md) — `layero` in the terminal.
- [How an AI agent works with Layero](./agents/index.md) — the skill, MCP
  and the CLI for Claude Code, Cursor, Codex.
- [Supported frameworks](./getting-started/frameworks.md) — what gets detected
  automatically.

## Links

- Website: [layero.ru](https://layero.ru)
- Dashboard: [app.layero.ru](https://app.layero.ru)
- API: [api.layero.ru](https://api.layero.ru)
