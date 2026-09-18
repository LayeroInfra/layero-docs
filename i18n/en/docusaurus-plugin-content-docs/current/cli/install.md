---
sidebar_position: 1
title: Install and sign in
description: How to install the Layero CLI (npx, project-local or global), sign in through the device flow, and where the token is kept.
---

# Install and sign in

## Install

The Layero CLI ships as the npm package [`layero`](https://www.npmjs.com/package/layero). Prefer `npx layero@latest` — **with the version tag, and without `-g`**:

```bash
# Recommended: no install, always the latest release
npx layero@latest deploy

# Project-local — this PINS the version; you update it yourself
npm install -D layero && npx layero deploy

# Global (often fails in Cursor / Claude Code over /usr/local permissions)
npm install -g layero@latest
```

Requires **Node.js ≥ 20**.

:::tip[Always write `@latest` — otherwise the version gets pinned]
`npx layero` without a version runs the copy you **already have**: the local one
from `node_modules`, or the global one. It does not contact the registry, so you
can keep running whatever you installed once, for years. That is how we found a
laptop on `layero@0.8.11` while 0.8.20 was published — and before 0.8.22 the CLI
could not even warn about it (its registry request was broken).

`npx layero@latest` fetches the current release every time. A project-local
install you update yourself: `npm i -D layero@latest`.
:::

## Sign in

```bash
npx layero@latest login
```

The CLI:

1. Makes one HTTP request to `api.layero.ru` and receives a short code like `5NFW-K2NG`.
2. Prints the URL `https://app.layero.ru/cli?code=5NFW-K2NG` (and tries to open it in a browser when running in an interactive terminal).
3. Polls quietly every 2 seconds until you approve or the 15-minute TTL expires.

In the browser you pick a sign-in method — an **emailed code** or **Yandex ID**. If you have no Layero account yet, it is created automatically on first sign-in. The page names the account it is about to authorise; if it is the wrong one, there is a "sign in as someone else" link right there. After you allow access, the CLI receives a JWT and stores it in `~/.layero/config.json` (chmod 600).

:::info[The browser and the CLI may be on different machines]
This is a device flow (like `gh auth login`, `aws sso login`, AppleTV). The CLI opens no local server on 127.0.0.1 — the exchange goes **through the backend**. So signing in works even when the CLI runs on a remote machine (SSH, Docker, headless CI) while your browser is on a laptop.
:::

Check which account you are signed in as:

```bash
npx layero@latest whoami
```

### If the code expired

Each `user_code` lives **15 minutes**. If you did not confirm in time, the CLI exits with `auth_expired` or `auth_timeout`. Just run `npx layero@latest login` again.

### You have no Layero account

There is no separate sign-up. The first sign-in — by an emailed code or with Yandex ID — creates your Layero account and personal organisation automatically. After signing in you may be asked to pick a username once — it becomes the slug of your personal organisation. For projects created before the move to `layero.app` (26 July 2026) it also ended up in the site address — `<username>-<project>.layero.app`. New addresses consist of the project slug alone.

## Initialise a project

Inside the site directory, run:

```bash
npx layero@latest init
```

The command:

- Looks at the folder and prints how it sees it (Next / Vite / Astro / SvelteKit / Nuxt / Gatsby / CRA / Docusaurus / static…), and when the app is not recognised — a hint on what to do
- Creates `.layero/project.json` with `analytics_enabled` and `env_vars` — the detection guess is not written there
- Appends a "Deploying with Layero" block to `AGENTS.md` / `CLAUDE.md` / `.cursorrules` (when they exist) — so that AI agents in later chat sessions know how to deploy without being told.

Idempotent: running it again updates the existing block rather than duplicating it.

## Where the config lives

| File | Purpose |
|---|---|
| `~/.layero/config.json` | Auth token and API URL. Created by `layero login`. |
| `./.layero/project.json` | Binds the cwd to a project. Created by `layero init` or the first `layero deploy`. The CLI does not write `framework_hint`, `build_cmd`, `output_dir` there — add them yourself to pin your choice. |

`~/.layero/config.json` looks roughly like this:

```json
{
  "apiUrl": "https://api.layero.ru",
  "token": "eyJhbGciOi...",
  "user": { "id": 42, "username": "alice", "email": "alice@example.com" }
}
```

`./.layero/project.json` after `init`:

```json
{
  "analytics_enabled": false,
  "env_vars": {}
}
```

You can add `framework_hint`, `build_cmd`, `output_dir` by hand — a new
project gets them as your choice. The CLI never fills them in itself: a
detection guess saved as a setting would override detection from the files on
every build.

After the first `deploy` it gains `project_id`, `slug`, `organization_slug` and `apex_hostname` — the CLI writes those itself, leave them alone.

## Clearing the token

```bash
npx layero@latest logout
```

Removes the token from `~/.layero/config.json`. It revokes nothing server-side — the JWT stays valid until its TTL expires (7 days). To revoke the session on the server, use `Settings → Active sessions` in the dashboard.

## CI / non-interactive

CI usually has no browser. Get a JWT with `layero login` on a dev machine, copy it out of `~/.layero/config.json` and pass it to CI as a secret:

```bash
# In CI
npx layero@latest token set "$LAYERO_TOKEN"
npx layero@latest deploy --prod --yes --project alice-my-site
```

`layero token set` is the manual escape hatch for CI and dev scenarios. In normal use, sign in with `login`.

## Next

- [CLI commands](./commands.md)
- [`layero deploy`: auto-detection, flags, limits](./deploy.md)
- [Deploying from AI agents (Cursor, Claude Code, Aider)](./agents.md)
- [JSON events: the full event and error-code schema](./json-events.md)
