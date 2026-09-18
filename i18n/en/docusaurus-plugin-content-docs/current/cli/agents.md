---
sidebar_position: 5
title: Deploying from AI agents
description: How Cursor, Claude Code, Aider and other AI agents deploy a site through Layero — no git repository, no browser wizard.
---

# Deploying from AI agents

The Layero CLI is built so that an AI agent (Cursor, Claude Code, Aider,
Continue and the like) can deploy a site **within a single conversation** — no
`git init`, no wizard in the dashboard. The only thing the user does is click
one login link.

:::note[This is one of the agent's three paths]

The CLI is the path for **a folder with code**. If the project already has a
repository connected, the agent only needs to `git push`; if the site is
already published and needs diagnosing or configuring, that is MCP. The
decision, the skill and the install commands are in the
[AI agents](../agents/index.md) section.

:::

## The target scenario

```
User:  deploy this landing page with layero
Agent: On it. Open https://app.layero.ru/cli?code=ABCD-1234 and confirm.
       (user opens the link, clicks "Authorize", returns to the chat)
Agent: ✓ Live at https://my-landing-abc123.layero.app
```

No `git init`, no `gh repo create`, no trip to the dashboard. Afterwards the
user can say "make the button red" and "deploy" again — the site updates at
the same address.

## Teaching the agent what to do

### Option 1 — a project file (the main one)

Run this once in the project directory:

```bash
npx layero@latest init
```

The command appends a block to an existing `AGENTS.md` / `CLAUDE.md` /
`.cursorrules` (or creates `AGENTS.md`). The block contains the device-flow
login recipe (`auth_required` → click → poll), a table of JSON events with
explanations (`detected` / `project_created` / `build_log` / `ready` /
`error`), the list of error codes with remediation (`auth_required`,
`auth_expired`, `cli_deploys_disabled`, …) and the rules around `--prod`.

Any modern agent reads those files at the start of a session and knows what to
do without being told.

### Option 2 — cold start (the agent sees Layero for the first time)

With no `AGENTS.md` in the project, the agent works it out from the request.
When the user says "deploy with layero", the agent either:

1. Fetches `https://layero.ru/llms.txt` — the canonical page for AI agents,
   with the recipe ready to follow; or
2. Searches for "layero deploy" and lands on this documentation page.

Both paths lead to the same command: `npx layero@latest deploy`.

## JSON mode

When the CLI runs inside an AI agent it switches to JSON-lines mode
**automatically**. The triggers:

- stdout is not a TTY (always the case in Cursor / Claude Code / any
  subprocess);
- environment variables `CURSOR_AGENT`, `CLAUDECODE`, `LAYERO_AGENT`,
  `LAYERO_JSON=1`;
- an explicit `--json` flag.

In this mode the CLI asks no questions, prints one `{"event":"…"}` line per
action on stdout, and reports errors with a stable `code` and `next_action` —
so the agent can react without parsing prose.

### The event stream

```jsonl
{"event":"auth_required","url":"https://app.layero.ru/cli?code=ABCD-1234","user_code":"ABCD-1234"}
{"event":"authorized","user":"alice"}
{"event":"detected","framework":"vite","build_cmd":"npm run build","output_dir":"dist","confident":true}
{"event":"project_created","project_id":"...","slug":"my-site","organization":"alice"}
{"event":"packing","files":124,"bytes":2401234,"sha256":"abc123..."}
{"event":"uploading"}
{"event":"uploaded","archive_key":"..."}
{"event":"setup_applied"}
{"event":"deploy_started","deploy_id":"..."}
{"event":"stage","name":"install"}
{"event":"build_log","line":"npm install ...","stream":"stdout"}
{"event":"stage","name":"build"}
{"event":"build_log","line":"vite v5.0.0 building...","stream":"stdout"}
{"event":"ready","url":"https://my-site.layero.app/","dashboard_url":"https://app.layero.ru/projects/...","deploy_id":"..."}
```

`url` is the live public site (for a project without a repository the upload
is published at once). `ready` arrives once the address already answers with
the site (`edge_ready: true`): the CLI waits for that itself, up to 90 seconds.
Show that one to the user. `dashboard_url` is the management page, not the
site (see the [JSON events schema](./json-events)).

### When detection is wrong

The `detected` event is advice, not a decision: the CLI does not save it to
the project, and the platform detects the framework from the uploaded files.
Values from `layero.json` are already reflected in it. `confident: false`
means "the folder was not recognised" — then the event carries `hint` and
`next_action`: a monorepo subfolder → `--root apps/web`, frontend and backend
side by side → the `frontend` and `backend` blocks of `layero.json`, a custom
build script → `"framework": "generic"`, a server → `-t node_web`.
`npx layero@latest deploy --dry-run` shows the plan without deploying.
Everything else takes one field in [`layero.json`](../deploys/layero-json.md):
that page has the symptom-to-fix table and the log lines that show the value
was applied.

### Error codes

The full canonical list is in the [JSON events schema](./json-events). In
short:

| `code` | `next_action` | When |
|---|---|---|
| `auth_required` | `layero login`, or set `LAYERO_TOKEN` | No token in `~/.layero/config.json` and none in the environment |
| `auth_required` (`next_action: set_layero_token`) | create a token | CI only: no credentials and no browser to get them from |
| `auth_expired` / `auth_timeout` | run: layero login | The user did not confirm the code within 15 minutes |
| `invalid_type` | valid types: vite, next, … | `--type` with an unknown value |
| `project_unknown` | run from the project directory, or pass `--project` | Invoked outside a project |
| `project_not_found` | run `layero projects list` | `--project` points at a project that does not exist |
| `cli_deploys_disabled` | enable in project settings | An admin turned CLI deploys off |
| `prebuilt_no_dir` / `prebuilt_no_index` | pass `--prebuilt ./dist` | No build directory, or no `index.html` inside it |
| `deploy_not_started` | re-run `layero deploy` | The build never started |
| `deploy_failed` | inspect logs at … | The build never reached `ready` |
| `internal` | re-run with `--debug` | An unexpected CLI error |

The full list is on the [JSON events](./json-events) page. The codes
`not_logged_in`, `project_unlinked`, `username_missing`,
`org_membership_missing`, `no_organization`, `deploy_error` and
`deploy_timed_out` **do not exist** — they were emitted by early versions of the
CLI and have since been removed.

## Cold start: what your agent should do

If you are writing a system prompt for an agent (Cursor rules, Claude Code
skills, `CLAUDE.md`), include something like this:

```markdown
## Deployment

If the user asks to deploy a site to Layero:

1. If the project already has a repository connected to Layero, commit and
   push — that is the deploy. Otherwise do NOT create a git repository:
   Layero deploys local files directly.
2. Run `npx layero@latest deploy --json` from the project root.
3. If output contains `{"event":"auth_required","url":"..."}` — render the
   URL as a clickable link in chat and wait. The user will click it once.
4. Continue waiting for additional JSON events. When you see
   `{"event":"ready","url":"..."}` — show `url` (the live site) to the user.
   It is reachable right away; do not gate on `edge_ready`. Then stop.
5. If you see `{"event":"error","code":"...","next_action":"..."}` —
   follow next_action verbatim.
```

## What not to do

- ❌ `git init` + `gh repo create` before deploying — a detour agents often
  take by analogy with Vercel/Netlify. It is different when a repository is
  **already connected** to Layero — then the deploy is a `git push`, see
  [Connecting a repository](../deploys/git-providers.md).
- ❌ `npm install -g layero` — global installs frequently fail in an agent
  sandbox. Use `npx layero@latest` or `npm install -D layero`.
- ❌ Opening the dashboard to "finish the setup" — `layero deploy` is fully
  inline; there is no manual browser step between upload and build.
- ❌ Asking the user to run `layero login` separately — `layero deploy`
  starts the device flow itself (`auth_required`) when there is no token.
- ❌ Adding `--prod` for a CLI project. A project created by `layero deploy`
  auto-promotes to its apex on **every** deploy, so the apex is already the
  destination and `--prod` changes nothing. The corollary matters more: a
  plain deploy is **not** a harmless preview — it replaces what visitors see.
  There is no way around this from the CLI: `--branch` is refused with
  `branch_unsupported` — every archive upload is filed under the reserved `cli`
  environment. A publish that leaves the live address alone is done by
  connecting a repository and pushing to a branch:
  `npx layero@latest projects create --repo <provider>:<owner/repo>`.

## The full chain for an agent

A self-contained recipe that works from nothing configured:

```bash
# 1. Create .layero/project.json + AGENTS.md (optional, but handy for later sessions)
npx layero@latest init

# 2. Authenticate (once per machine; the token lands in ~/.layero/config.json)
npx layero@latest login

# 3. Deploy
npx layero@latest deploy --json
```

After `ready`, show the user the URL and stop. Further edits → `npx layero@latest
deploy` again → a new URL.
