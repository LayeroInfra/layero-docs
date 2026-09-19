---
sidebar_position: 6
title: JSON events schema
description: The full list of events and error codes the Layero CLI emits on stdout in JSON mode. The canonical reference for AI agents and CI.
---

# JSON events schema

The CLI switches to JSON-lines mode automatically when it runs inside an AI
agent (Cursor, Claude Code) or when stdout is not a TTY. You can also turn it
on explicitly with the `--json` flag or `LAYERO_JSON=1`.

In this mode the CLI:

- **asks no questions** — every interactive confirmation is skipped (`--prod`
  still needs `--yes`);
- prints one `{"event":"…", …}` line per action on stdout;
- reports errors with a stable `code` and a `next_action`;
- adds a `ts` field (ISO-8601 timestamp) to every event;
- **every command** emits events — since 0.10.0 also `whoami`, `projects`, `orgs`, `link`, `hooks`, `logout`, `init`;
- the exit code tells error classes apart — see [Exit codes](#exit-codes).

## Events

Each line is a standalone JSON object. Route on the `event` field.

### `auth_required`

The CLI has started the device-flow login. Show the URL to the user as a
clickable link.

| field | type | note |
|---|---|---|
| `url` | string | e.g. `https://app.layero.ru/cli?code=ABCD-1234` |
| `user_code` | string | e.g. `ABCD-1234` — also shown on the confirmation page |

The CLI keeps polling every 2 seconds. Once the user confirms, `authorized`
follows. On expiry you get `error{code: "auth_expired" | "auth_timeout"}`.

### `authorized`

Login succeeded.

| field | type |
|---|---|
| `user` | string — username, email or user id |

### `detected`

How the CLI sees the folder. It is advice, not a decision: the platform detects
the framework again on the uploaded files, and the CLI's guess is **not saved**
to the project (since 0.11.0). Only what a person names is sent: `--type`,
`--root`, fields they wrote into `.layero/project.json`.

| field | type | note |
|---|---|---|
| `framework` | string | `vite`/`nextjs`/`astro`/…/`static`/`generic`; for a server — the name of its framework (`express`, `fastapi`…) |
| `build_cmd` | string \| null | `null` — there is no build (static files, a container app) or nothing to run it with |
| `output_dir` | string \| null | `null` — the folder is known only after the build |
| `confident` | boolean | `true` — the folder was recognised: a known framework, a server, or ready-made files with `index.html`. `false` — not recognised: the values above are defaults, read `hint` |
| `sources` | object | where each value comes from: `framework`, `build_cmd`, `output_dir` → `layero.json`, `--type`, `.layero/project.json`, `project settings`, `package.json`, `framework config`, `framework default`, `detected`, `none` |
| `runtime_kind` | string? | the app runs in a container: `node_web`, `python_web`, `ssr_next`, … |
| `hint` | string? | what the CLI saw instead of a recognised app: an app in a subfolder, frontend and backend side by side, a custom build script, a server without a known framework |
| `next_action` | string? | one concrete step: `npx layero@latest deploy --root apps/web`, the text of a `layero.json`, etc. |
| `candidates` | string[]? | app folders found below the current one |
| `ssr_warning` | string? | Nuxt/SvelteKit will build a server, not static files |
| `layero_warnings` | string[]? | `layero.json` keys the platform will not apply, with the right name. For example, `"type": "vite"` does nothing — write `"framework": "vite"` (since CLI 0.11.4) |

`framework`, `buildCommand` and `outputDirectory` from `layero.json` are
already applied here (`sources` = `layero.json`).

### `plan`

The result of `layero deploy --dry-run`: how the platform will build the folder
if you deploy now. Nothing is packed, uploaded or created; no login needed. The
order is the builder's: `layero.json` > project settings > detection.

| field | type | note |
|---|---|---|
| `framework`, `build_cmd`, `output_dir`, `confident`, `sources`, `hint`, `next_action`, `candidates`, `layero_warnings` | | as in `detected`, plus the settings of a linked project (`sources` = `project settings`) |
| `runtime_kind` | string \| null | the app runs in a container |
| `root` | string \| null | the app's subfolder (`--root` or the project setting) |
| `project` | object \| null | `id`, `slug`, `project_type`, `repo` of the linked project |
| `project_settings` | string | `read`, `not linked` or `not read: …` (not signed in) |
| `creates_project` | boolean | the deploy will create a new project |
| `replaces_live_site` | boolean | the deploy will replace the live site. `false` only for a project with a connected repository and no `--prod` |
| `prebuilt_dir` | string? | with `--prebuilt` |

### `project_created`

First deploy in this directory. A new project was created.

| field | type |
|---|---|
| `project_id` | string |
| `slug` | string |
| `organization` | string — organization slug |

### `project_linked`

Deploy into an existing project (cwd is linked via `.layero/project.json`).

| field | type |
|---|---|
| `project_id` | string |
| `slug` | string |

### `packing`

The CLI packed the directory into a tar.gz.

| field | type |
|---|---|
| `files` | number |
| `bytes` | number |
| `sha256` | string |

### `uploading`

Archive upload to S3 started. No extra fields.

### `uploaded`

Upload succeeded.

| field | type |
|---|---|
| `archive_key` | string |

### `prebuilt`

The deploy ships a ready-made build (`--prebuilt <dir>`) — installing
dependencies and building on the platform side are skipped.

| field | type |
|---|---|
| `dir` | string — the directory holding the artifact |

### `runtime_type_applied`

The project was recognised as a runtime application and its type was set
automatically — both when the project is created and when `--type` changes it.
A type named by the CLI's detection is stored as a guess the platform may
refine from the upload; a type from `--type` is the person's choice.

| field | type |
|---|---|
| `project_type` | `ssr_next` · `node_web` · `python_web` · `streamlit` · `gradio` · `flask` |

### `runtime_type_apply_failed`

The type was detected but could not be applied. The deploy continues with the
project's previous type.

| field | type |
|---|---|
| `error` | string |

### `setup_applied`

Project settings accepted. Only what was named explicitly (`--type`, your own
`.layero/project.json`) is written; otherwise the builder decides from the
archive on every build what to build with and where the result goes. No
fields.

### `repeated_failure_guard`

Consecutive builds failed with the **same** error, so the platform stopped
before starting another one. The event carries the error text itself: an agent
that reached the repeat usually never read it — it arrives at the end of a long
build log while the agent looks at the exit code.

Next the CLI either asks for confirmation (interactive terminal) or exits with
the `repeated_failure` code. It cannot continue automatically — that is exactly
the loop this rule breaks.

| field | type |
|---|---|
| `streak` | number — how many failures with this error were counted |
| `threshold` | number — the stop threshold |
| `scope` | `"project"` \| `"owner"` — where it was counted: in this project, or summed across all your projects |
| `failure_stage` | string, optional — build stage |
| `error` | string, optional — error text |

`scope: "owner"` answers the first question this raises: "I only built here
three times, where does ten come from?". The same error is also counted across
all of the owner's projects — moving the app into a fresh project does not get
around the rule, because the cause is not the project.

### `deploy_started`

The backend accepted the job.

| field | type |
|---|---|
| `deploy_id` | string |

### `stage`

The build moved to a new stage. Arrives before the first `build_log` line of
that stage (since 0.11.0 it follows the log lines themselves, not the deploy's
current stage).

| field | type |
|---|---|
| `name` | `clone`/`install`/`build`/`upload`/`activate` |

### `build_log`

One line of build output. Only worth forwarding to the user when it contains
an error — successful builds produce a lot of noise.

The `npm http fetch …` and `npm http cache …` lines (one per package) are
hidden in JSON mode; a single marker line arrives instead. Full log:
`npx layero@latest logs --deploy <deploy_id>`.

| field | type |
|---|---|
| `line` | string |
| `stream` | `stdout`/`stderr` |

### `ready`

**The final event.** The deploy is live. Show `url` to the user and stop.

| field | type | note |
|---|---|---|
| `url` | string | **The live public address of the site** — not the dashboard. For a plain `layero deploy` of a CLI project this is the project's production address (CLI uploads auto-promote to the apex). For a project with a repository, where a CLI upload is not promoted, it is the address of the `cli` environment (`--branch` on `deploy` is refused, see `branch_unsupported`). It is reachable straight away; this is the link to open and to show the user. |
| `dashboard_url` | string? | The project management page (`https://app.layero.ru/projects/<id>`). This is **not** the site — never hand it over as the link to the finished site. |
| `preview_url` | string? | **Legacy, no longer emitted.** A separate per-deploy preview host in the `*.preview.layero.ru` zone. It existed to give out a link while the apex warmed up on the CDN. `layero.app` has no separate preview zone and no user sites remain on `layero.ru`, so the field is never populated. |
| `edge_ready` | bool? | `true` — the address already answers with the site itself: before `ready` the CLI (since 0.11.0) polls `url` while the platform's own page answers instead (header `X-Layero-Screen`), for up to 90 s. So a container app no longer shows the "nothing here yet" placeholder after `ready`. `false` — the app did not answer within that time: see `npx layero@latest logs --runtime`. |
| `screen` | string? | with `edge_ready: false` — which platform page answered (`starting`, `unavailable`, …) |
| `edge_eta_seconds` | number? | **Legacy, no longer emitted.** An estimate of the remaining CDN warm-up. There is nothing to propagate — user sites do not sit behind a CDN. |
| `deploy_id` | string | |

### `promoted`

The apex now points at the given deploy. Emitted by `layero promote` and by
`layero deploy --promote`.

| field | type |
|---|---|
| `url` | string — the public address |
| `deploy_id` | string |

### `data_api_enabled`

Result of `layero data enable`: the Data API is on for the database.

| field | type | note |
|---|---|---|
| `org` | string | organisation slug |
| `database` | string | database slug or id |
| `slug` | string | the database address in the Data API: `https://data.layero.ru/<slug>` |
| `public_key` | string \| null | the public key for the site — full value, sent once |
| `secret_key` | string \| null | the secret key — only with `--with-secret`; keep it on the server, never in site code |
| `reapplied` | boolean | `true` — the Data API was already on and was re-applied with `--repair` |

### `data_keys`

Result of `layero data keys list`. Key values are never in this event — prefixes only.

| field | type | note |
|---|---|---|
| `org` | string | organisation slug |
| `database` | string | database slug or id |
| `keys` | array | keys: `id`, `kind` (`public` \| `secret`), `prefix`, `label`, `created_at`, `last_used_at`, `expires_at` (string \| null), `in_build` (boolean — the key goes into the site build), `service` (boolean) |

### `data_key_issued`

Result of `layero data keys issue`. The full key value is sent once — store it right away.

| field | type | note |
|---|---|---|
| `org` | string | organisation slug |
| `database` | string | database slug or id |
| `id` | string | key id — used to revoke it |
| `kind` | string | `public` or `secret` |
| `prefix` | string | start of the key, shown in the list |
| `key` | string | the full key value |
| `expires_at` | string \| null | when the key stops working; `null` — never |

### `data_key_revoked`

Result of `layero data keys revoke`.

| field | type |
|---|---|
| `org` | string — organisation slug |
| `database` | string — database slug or id |
| `id` | string — id of the revoked key |

### `data_origins`

Result of `layero data origins list`: sites a browser may call the Data API from.

| field | type | note |
|---|---|---|
| `org` | string | organisation slug |
| `database` | string | database slug or id |
| `origins` | array | added by hand: `origin`, `note` (string \| null) |
| `from_projects` | string[] | addresses of the organisation's projects — allowed without adding |
| `localhost_allowed` | boolean | whether requests from `localhost` are allowed |

### `data_origin_added` and `data_origin_removed`

Result of `layero data origins add` and `layero data origins remove`.

| field | type |
|---|---|
| `org` | string — organisation slug |
| `database` | string — database slug or id |
| `origin` | string — site address |

### `data_methods`

Result of `layero data methods`: tables and functions of the database with the access level of each method. Levels: `closed`, `visitor` — any visitor, `user` — signed-in users, `server` — server only.

| field | type | note |
|---|---|---|
| `org` | string | organisation slug |
| `database` | string | database slug or id |
| `tables` | array | `schema`, `name`, `kind` (`table` \| `view`), `rls` (boolean \| null), `path`, `profile` (string \| null), `shadowed_by` (string \| null), `levels` (`GET`, `POST`, `PATCH`, `DELETE` → level), `writable` (which of `POST`, `PATCH`, `DELETE` the table accepts) |
| `functions` | array | `schema`, `name`, `args`, `kind` (`function` \| `procedure`), `signature`, `path` (string \| null — `null` when not callable over HTTP), `overloaded` (boolean), `level`, `public_only` (boolean) |
| `warnings` | string[] | always present; one line per table whose privilege does not work: the role has no USAGE on its schema, so the gateway cannot see the table. The line says what to do. Empty — no warnings |

### `data_grant`

Preview and result of `layero data grant`. Without `--yes` outside a terminal the event comes with `applied: false`, followed by an `error` with `confirmation_required` or `data_levels_blocked`. After applying — `applied: true`, and `current` describes the new state.

| field | type | note |
|---|---|---|
| `org` | string | organisation slug |
| `database` | string | database slug or id |
| `object` | object | `kind` (`table` \| `view` \| `function` \| `procedure`), `schema`, `name`, `args` — functions only |
| `current` | object | method → level now; a function has `POST` only |
| `next` | object | method → level after applying |
| `sql` | string[] | the commands applying will run |
| `warnings` | string[] | warnings, including the reasons from `blocked` |
| `blocked` | string[] | why it cannot be applied; empty — it can |
| `applied` | boolean | whether it was applied |
| `next_action` | string | only when confirmation is needed — the ready command to rerun |

### `data_probe`

The result of `layero data probe`: the gateway's answer to a Data API method probe. The request is real, writes are rolled back. Not rolled back: sequence numbers, outbound calls made by the database, session locks and the daily call quota.

The event arrives whenever the gateway answered. The exit code follows one rule, checked in order:

1. a write rollback was not confirmed — error `data_probe_not_rolled_back`;
2. the status matches `--expect` — 0;
3. the gateway answered `5xx` — error `data_probe_gateway_failed`;
4. the status does not match `--expect` — error `data_probe_unexpected_status`;
5. otherwise 0, including a `4xx` refusal: `401`, `403`, `404` are the probe's answer, not a failure.

The error arrives as an `error` event right after `data_probe`.

| field | type | note |
|---|---|---|
| `org` | string | organization slug |
| `database` | string | database slug or id |
| `request` | object | `method`, `path`, `as`, `user_id`, `query`, `schema` — what was sent; `schema` is lowercased and `null` for functions and `/whoami`; the body is not repeated |
| `status` | number | HTTP status of the gateway response |
| `elapsed_ms` | number | duration of the gateway request |
| `caller` | string \| null | who the gateway took the request for: `visitor`, `user`, `server`; `null` — the key or token was not accepted |
| `rows` | number \| null | rows in the response |
| `total` | number \| null | rows visible to the role, from `Content-Range` |
| `owner_total` | number \| null | rows in the table as the owner sees them — the M in "N of M". `null` — not counted; do not substitute `total`: that is the role's own count |
| `rollback_expected` | boolean | a rollback was expected — for everything except `/whoami` |
| `rolled_back` | boolean | the gateway confirmed the rollback |
| `not_rolled_back` | boolean | `true` — a rollback was expected, the response was 200–399 and there is no confirmation: data may have changed. An `error` with code `data_probe_not_rolled_back` follows |
| `body_truncated` | boolean | the response is longer than 64 KB; `body` holds only its beginning |
| `headers` | object | only `content-type`, `content-range`, `x-layero-caller`, `x-layero-key` (key prefix), `x-layero-user`, `x-layero-rolled-back` |
| `body` | any | response body: JSON or a string |

### `claimable`

A deploy without an account (`layero deploy --claim`, or automatically: no
token, an agent environment — not a terminal and not CI — `--yes`, and the
project is new). The platform created a temporary project and a token for it; the site lives for
72 hours. The event arrives **before** `ready`: after `ready` an agent stops
reading, and without this link the site disappears with its deadline.

| field | type | note |
|---|---|---|
| `project_id` | string | |
| `slug` | string | |
| `url` | string | the live site address — the same as in `ready` |
| `claim_url` | string | the link a human uses to take the project into their account. Only a person signed in to the dashboard can accept a claim — neither the CLI nor an agent does it |
| `expires_at` | string | ISO-8601 — when the site and the token stop working |

The claim code is saved in `.layero/project.json` (`claim`), the token in
`~/.layero/config.json`; another `layero deploy` in the same directory updates
the same site until the deadline and prints `claimable` again with the same
link. `npx layero@latest diagnose` and `logs` in that folder use the sandbox
token — no login needed. It never turns on by itself in CI: a runner
without `LAYERO_TOKEN` gets `auth_required`.

A sandbox only ever creates a **new** project. When `--project` is passed or
the folder is linked to an account project (`.layero/project.json` without a
`claim` field) and there is no token, the CLI starts signing in: an
`auth_required` event with `url` and `user_code`. Before 0.10.5 an agent
environment with `--yes` turned the sandbox on here, and the platform answered
`username_required`. A sandbox token from `~/.layero/config.json` is only
used for its own project.

### `claim_status`

The result of `layero claim status [code]`. Without a code it reads
`.layero/project.json`.

| field | type |
|---|---|
| `code` | string |
| `status` | string — the claim's state on the server (`unclaimed`, `claimed`, `expired`) |
| `claimed` | boolean |
| `expires_at` | string \| null |
| `url` | string \| null — the site address |
| `claim_url` | string \| null |

### `claim_accept`

The result of `layero claim accept [code]`. In a terminal the CLI opens
`claim_url` in the browser; in agent mode it only prints it: a person signed
in to the dashboard has to confirm.

| field | type |
|---|---|
| `code` | string |
| `claim_url` | string |
| `opened` | boolean — whether a browser was opened |

### `me`

The result of `layero whoami`.

| field | type |
|---|---|
| `id` | string |
| `username` | string \| null |
| `email` | string \| null |
| `github_login` | string \| null |

### `logged_out`

The result of `layero logout`.

| field | type |
|---|---|
| `config_path` | string — the removed token file |

### `projects`

The result of `layero projects list`.

| field | type |
|---|---|
| `projects` | array — `id`, `slug`, `name`, `organization`, `url` (live address), `source_type` (`cli` \| `github` \| `git`), `repo` (string \| null — `owner/repo` of the connected repository), `status` |

### `organizations`

The result of `layero orgs list`.

| field | type |
|---|---|
| `organizations` | array — `id`, `slug`, `kind` (`personal` \| `team`), `role` (`admin` \| `member`) |

### `init_done`

The result of `layero init` (after `detected`).

| field | type |
|---|---|
| `framework` | string |
| `confident` | boolean — as in `detected` |
| `agent_docs` | array — `file` (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`), `result` (`created` \| `updated` \| `unchanged`) |
| `project_json` | `created` \| `unchanged` |

Since 0.11.0 `init` records the detection guess neither in
`.layero/project.json` (only `analytics_enabled` and `env_vars` there) nor in
`AGENTS.md`: the framework is named there only when detection is sure of it.

### `hooks`, `hook_created`, `hook_deleted`

The results of `layero hooks list`, `hooks create`, `hooks delete`. The hook
URL is a credential: anyone holding it can start a build.

| field | type | event |
|---|---|---|
| `project` | string — project id | all three |
| `hooks` | array — `id`, `name`, `branch` (string \| null), `target` (`preview` \| `production`), `url`, `last_triggered_at` (string \| null) | `hooks` |
| `id`, `name`, `branch`, `target`, `url` | as in the list | `hook_created` |
| `id` | string | `hook_deleted` |

### `sources`

The result of `layero sources list`: the providers the platform supports and
the organization's connections. No tokens in the event — the platform never
returns them.

| field | type |
|---|---|
| `org` | string — organization slug |
| `providers` | array — `id` (`gitverse`, `gitlab`, `gitflic`, `sourcecraft`, …), `title`, `self_hosted` (boolean — accepts `--base-url`), `webhook_supported` (boolean — `false` for SourceCraft: no push-triggered builds there), `token_hint` (string \| null — where to issue a token and with which permissions) |
| `connections` | array — `id`, `provider`, `account` (string \| null — the token owner's login), `status` (`active` \| `invalid`), `projects_count`, `token_expiry_state` (`ok` \| `soon` \| `today` \| `expired` \| `unknown`), `last_error` (string \| null) |

### `source_connected`

The result of `layero sources connect <provider>` and a step of
`layero projects create --repo`.

| field | type |
|---|---|
| `org` | string |
| `connection_id` | string — connection id (for the GitHub App — the account key `github:<installation>`) |
| `provider` | string |
| `account` | string \| null |

### `source_repos`

The result of `layero sources repos <connection_id>`.

| field | type |
|---|---|
| `org` | string |
| `connection_id` | string |
| `repos` | array — `path` (`owner/repo`, `group/sub/project` on GitLab), `name`, `default_branch`, `private`, `can_admin` (boolean — enough rights to create a webhook), `updated_at` (string \| null) |

### `webhook_installed` and `webhook_unavailable`

A step of `layero projects create --repo`. A separate event rather than a
field: without a webhook a push does not build, and the agent has to say so
to the user in words. On `webhook_unavailable` the repository **is already
connected** — builds from the button and from `layero deploy` work; automatic
builds start once the webhook is registered by hand at `url`.

| field | type | event |
|---|---|---|
| `project` | string — slug | both |
| `url` | string — the webhook address; absent for the GitHub App: there the webhook is part of the installation and has no address of its own | both |
| `hint` | string — why it failed and what to do | `webhook_unavailable` |

### `setup_applied`, `deploy_started`, `setup_pending`, `setup_failed`

Finishing the setup wizard in `layero projects create --repo` (since 0.10.2).
The command used to stop at the link: the project stayed in `pending_setup`
and the first build waited for a "Start deploy" click in the dashboard. Now
the command does what the button does: takes the detection hint, applies it
and starts the build.

| event | fields | meaning |
|---|---|---|
| `setup_applied` | `project`, `framework`, `build_cmd` (string \| null), `output_dir` (string \| null), `layero_found` (boolean) | Setup finished. The framework, command and folder are what detection saw, for information: they are not written into the project (since CLI 0.11.4) — the builder detects them from the repository on every build |
| `deploy_started` | `project`, `deploy_id`, `url` | First build started; follow it with `layero deploys list --project <slug>` |
| `setup_pending` | `project`, `url`, `hint` | `--no-deploy`: the project stays in the wizard; nothing builds until setup is finished at `url` |
| `setup_failed` | `project`, `reason`, `url`, `hint` | Detection, setup or the build start failed. The project **is created**, exit 0 — tell the person to finish in the dashboard at `url` |

### `environments`

The result of `layero envs list`. An environment and a branch are one thing:
a CLI project has a single one (`cli`), a project with a repository has one
per branch. Archived and retired ones are not included.

| field | type |
|---|---|
| `project` | string — slug |
| `environments` | array — `id`, `branch`, `url` (the environment's address), `hostname`, `active_deploy_id` (string \| null), `active_deploy_at` (string \| null), `production` (boolean — this is the production branch) |

### `project_deleted`

The result of `layero projects delete <slug> --yes`. Resource cleanup (CDN,
S3, certificates, webhook) runs in the background; the address and slug are
freed immediately.

| field | type |
|---|---|
| `project_id` | string |
| `slug` | string |

### `error`

| field | type |
|---|---|
| `code` | string — see the table below |
| `next_action` | string — the concrete command or URL that resolves it |
| `message` | string — human-readable description |

## Error codes

Checked against the CLI sources: these are all the codes it actually emits.
Do not write handling for codes that are not on this list.

| `code` | When it happens | What to do (`next_action`) |
|---|---|---|
| `auth_required` | No token in `~/.layero/config.json` and none in `LAYERO_TOKEN` | Run `layero login`, or set `LAYERO_TOKEN` |
| `auth_expired` | The login no longer works: either the `user_code` expired (15 min TTL) without confirmation, or the saved token expired (7-day TTL) / its session was revoked — the API answered `401` | Run `layero login` again |
| `auth_timeout` | The CLI polled for 15 minutes and the user never confirmed | Run `layero login` again |
| `plan_limit` | A plan limit: the API answered `402` (e.g. more projects than the free plan allows) | Change the plan at `app.layero.ru/billing`, or delete what you no longer need |
| `username_required` | The account has no username (it doubles as the personal organisation's address) — the API answers `412`. An interactive terminal is asked during `login`/`deploy`; in agent mode there is nobody to ask | `layero username <name>` |
| `username_rejected` | The name is taken, reserved, or malformed | Pick another: lowercase latin letters, digits and hyphens, 2–32 characters |
| `oauth_unavailable` | The sign-in provider is unreachable | Ours to fix — retry later |
| `project_unknown` | Run outside a project directory and without `--project` | Run from the project directory or pass `--project <id\|slug>` |
| `project_not_found` | `--project` points at a project that does not exist | `layero projects list` |
| `cli_deploys_disabled` | An admin turned CLI deploys off for the project | Enable it in Project Settings, or deploy into another project |
| `invalid_type` | `--type` with an unknown value | Drop the flag (auto-detection) or pass a valid preset — listed in the message |
| `invalid_choice` | An interactive prompt got an invalid choice in non-TTY mode | Pass the value as an explicit flag |
| `prebuilt_no_dir` | The `--prebuilt` directory does not exist | Pass it explicitly: `--prebuilt ./dist` |
| `prebuilt_no_index` | The `--prebuilt` directory has no `index.html` | Point it at the folder containing the built `index.html` |
| `deploy_not_started` | The build never started | Re-run `layero deploy`; if it repeats, `npx layero@latest diagnose` |
| `deploy_watch_lost` | The CLI lost its connection to the build log (several network failures in a row). The build itself keeps running on the platform | Do **not** deploy again. Result: `npx layero@latest deploys list --json`; log: `npx layero@latest logs --deploy <id>` |
| `deploy_failed` | The build never reached `ready` | `npx layero@latest diagnose --deploy <id>` — the command in `next_action`; works in a sandbox without an account too |
| `repeated_failure` | Consecutive builds keep failing with the **same** error, so the platform refused to ship another one blindly. The error text is in `message` and in the `repeated_failure_guard` event | Read the error and fix its cause. Re-running unchanged fails the same way. If you already fixed it — `layero deploy --confirm-repeated-failure` |
| `repeated_failure_declined` | Same, but the interactive prompt «ship anyway?» was answered no | Fix the error and run `layero deploy` again |
| `no_deploy` / `no_deploys` | The project has no deploys yet | Run `layero deploy` first |
| `rollback_unsupported` | The deploy has no servable artifact: either a runtime project, or static whose artifact was purged by retention | Rebuild the commit with `layero deploy` |
| `rollback_noop` | The rollback target is already live — e.g. a second `layero rollback` in a row. Nothing changed, exit code `4` | Pick a build: `layero promote <sha>`; list them with `layero deploys list` |
| `env_not_found` | No such variable | `layero env list` |
| `nothing_to_set` | `layero env set` called without a `KEY=value` pair | `layero env set KEY=value` |
| `bad_format` | An argument could not be parsed | The expected format is in the message |
| `domain_not_found` | The project has no such domain | `layero domains list` |
| `domain_rejected` | The platform refused the domain | The reason is in the message |
| `forbidden` | The token lacks the scope this operation needs | Issue a token with the required scope |
| `database_unknown` | The organization has no database with that name, slug or id. For `layero data enable --repair` — no `--db` given: re-applying revokes the API roles' privileges on schema `public`, so the database is never guessed | `layero db list`; create one — `layero db create <name>`. For `--repair` — `layero data enable --db <database> --repair` |
| `branch_without_env` | The branch has no environment yet | Deploy that branch first |
| `analytics_not_connected` | Analytics is not connected | `layero analytics connect` |
| `no_runs` | No speed-check runs recorded | `layero perf check` |
| `data_api_disabled` | `layero data …` was run for a database whose Data API is off | `layero data enable --db <database>` |
| `data_key_kind` | `layero data keys issue --kind` with an unknown key kind | `--kind public` — a key for the site, `--kind secret` — for the server |
| `data_key_expiry` | `--expires-in` with an unsupported lifetime | Allowed lifetimes are in `next_action`, or `never` |
| `data_key_unknown` | The database has no active key with that id or prefix | `layero data keys list --db <database>` |
| `data_key_ambiguous` | The prefix matches several keys of the database | Pass the key id — the ids are in `next_action` |
| `data_levels_missing` | `layero data grant` was run without a single level | Table: `--get visitor --post server …`; function: `--call visitor` |
| `data_level_unknown` | The access level is not on the list | `closed`, `visitor` — any visitor, `user` — signed-in users, `server` — server only |
| `data_levels_blocked` | The platform refused to apply the levels: e.g. privileges are granted on individual columns, or the schema belongs to another role. The reason is in `message`; nothing was sent | Change the request as the refusal says; current levels — `layero data methods --db <database>` |
| `data_api_already_enabled` | `layero data enable --db <database>` for a database whose Data API is already on. Nothing changed: enabling again would revoke the API roles' privileges on schema `public` | Keys — `layero data keys list --db <database>`, methods — `layero data methods --db <database>`; with `--with-secret` — issue the secret key with `layero data keys issue --db <database> --kind secret`. If the roles or the `api` schema privileges were broken by hand — `layero data enable --db <database> --repair`: outside a terminal and with `--json`, a `confirmation_required` follows with the ready `--repair --yes` command |
| `confirmation_required` | The command changes access (revoking a key, removing a site, applying levels, re-applying the Data API — `layero data enable --repair`) and there is nobody to confirm it in agent mode. Nothing was changed; the command plan came as a separate event | Show the plan to a human and rerun with `--yes` — the ready command is in `next_action` |
| `data_probe_method` | A method other than `GET`, `POST`, `PATCH`, `DELETE`; `/whoami` with a method other than `GET`; a function (`/rest/v1/rpc/…`) with a method other than `GET` or `POST`. Nothing was sent | A suitable method is in `next_action`; for `/whoami` and functions, as a ready command |
| `data_probe_path` | The probe path contains `?`, ends with a slash, or has no table or function name (`/rest/v1/`, `/rest/v1/rpc/`). Nothing was sent | A ready command with all the flags you passed is in `next_action`: parameters from `?` become `--query` flags, the path loses the slash. For a path without a name — `layero data methods --db <database>` |
| `data_probe_query` | `--query` is not `name=value`, the name is empty, the same name is given twice, or it is given both in the path after `?` and as `--query` | `--query select=id,title --query price=gt.100`; several conditions on one column — one `or=(…)` parameter |
| `data_probe_body` | The probe body could not be used: not JSON, not an object or array, the file is unreadable, both `--body` and `--body-file` are given, a body with `GET` or `DELETE`, or a number in the body cannot be passed exactly — e.g. `9007199254740993` would be sent as `9007199254740992` | A JSON object or array in `--body` or `--body-file`, for `POST` and `PATCH` only; pass a big number as a quoted string |
| `data_probe_as` | `--as` is not `visitor`, `user` or `server`, or `--user` without `--as user` | `--as visitor`, `--as user --user <id>` or `--as server` |
| `data_probe_user_required` | `--as user` without `--user`: no user to probe as | `--user <app user id>` |
| `data_probe_user_invalid` | `--user` is not a UUID: the platform expects an app user id | Take the id from the database page in the dashboard, in the list of app users |
| `data_probe_schema` | `--schema` for a table is not `api`, `public` or `app`, or for a function is not `api`: the gateway calls functions only from `api`. Without this check the platform would silently ignore the flag. For `/whoami` the schema is dropped without a refusal; an empty one counts as no flag | For a table — `--schema api`, `public` or `app`; for a function — `api` or no flag. Without the flag the gateway looks for the table in `api`, then `public`, then `app` |
| `data_probe_expect` | `--expect` could not be parsed: a status (`200`), a class (`2xx`) or a comma-separated list is expected | `--expect 200`, `--expect 2xx`, `--expect 201,204` |
| `data_probe_rejected` | The platform refused the probe before calling the gateway: the path is not a method of the database, sign-in is off for the database, the body exceeds 64 KB, more than 50 parameters, the gateway cannot roll back probes yet. The reason is in `message`; nothing was run. A refusal by the gateway itself (`4xx`) is not this code but a `data_probe` event | A hint for the specific case is in `next_action` |
| `data_probe_gateway_failed` | The gateway gave no answer: it answered `5xx` (e.g. `503` with `too_busy`) or did not answer the platform at all. If the gateway answered, the `data_probe` event arrived before the error. A status listed in `--expect` never produces this error | Repeat the probe later |
| `data_probe_unexpected_status` | The gateway status did not match `--expect`. The `data_probe` event arrived before the error | Compare the probe answer with the access levels: `layero data methods --db <database>` |
| `data_probe_not_rolled_back` | A write probe went through (response 200–399) and the gateway did not confirm the rollback: data may have changed. The `data_probe` event arrived before the error; `--expect` does not suppress this error | Check the database data; do not repeat the write probe until the cause is found |
| `branch_unsupported` | `layero deploy --branch`: an archive upload cannot land in a branch — the platform files every archive under the `cli` environment whatever you pass. Before 0.10.0 the flag was accepted and silently ignored. Nothing was packed or uploaded | Branch previews exist only for projects with a repository: connect one — `layero projects create --repo <provider>:<owner/repo>` — and push to a branch. For a project with a repository `next_action` names the repository to push to |
| `repo_format` | `--repo` is not of the form `<provider>:<owner/repo>`, or missing | `layero projects create --repo github:acme/site`; providers — `layero sources list` |
| `account_not_found` | The organization has no connection to that provider, or it is inactive (token revoked, App installation suspended) | `layero sources connect <provider> --token-stdin`; GitHub — install the App in the dashboard; the address is in `next_action` |
| `repo_not_found` | The repository is not visible to the connection: a typo in the path, or the token lacks access | Available paths are in `next_action`; the full list — `layero sources repos <connection_id>` |
| `repo_already_imported` | The repository is already connected to a project of the organization | `layero link <id>` — link the directory to it |
| `source_connect_failed` | The project was created but the repository did not attach (the provider did not answer or refused). The project was deleted if the token had the rights; otherwise it stays without a repository — `next_action` says which | Check the connection (`layero sources list`) and retry; a stray project — `layero projects delete <slug> --yes` |
| `provider_unknown` | `layero sources connect` with a provider not on the list | The list is in `next_action` and in `layero sources list`; GitHub is connected by installing the App |
| `token_missing` | `layero sources connect` without `--token` and without `--token-stdin` (or stdin is empty) | `echo "$PAT" \| layero sources connect <provider> --token-stdin` |
| `source_rejected` | The provider rejected the token (the API answered 502): wrong, revoked, or missing permissions | Where to issue it and with which rights — in `next_action` (the provider's `token_hint`) |
| `connection_not_found` | `layero sources repos` with an id the organization does not have | `layero sources list` |
| `hook_not_found` | `layero hooks delete` with an id the project does not have (already deleted?) | `layero hooks list` |
| `claimable_unavailable` | Deploying without an account is not enabled on the platform (the API answered 404/501/503), the claim quota is exhausted (429), or the platform returned no claim code | Sign in: `layero login` — or `LAYERO_TOKEN` |
| `claim_with_project` | `layero deploy --claim --project <project>`: a sandbox creates a new project and never deploys into an existing one. Nothing was created or uploaded | For an existing project sign in: `layero login` — and retry without `--claim`; a new site without an account — `--claim` without `--project` |
| `claim_unknown` | `layero claim status`/`accept` without a code and without a claim in `.layero/project.json`, or the claim with that code expired or the code is wrong | Pass the code; a new project without an account — `layero deploy --claim` |
| `internal` | An unexpected CLI error (network, unhandled exception) | Re-run with `--debug` |

:::note[The deploy code is built from the status]
The code for an unsuccessful deploy is assembled as `deploy_<status>` from the
build status, and a deploy has four statuses: `ready`, `building`, `failed`,
`cancelled`. So in practice you will only ever see `deploy_failed` and
`deploy_cancelled` — `deploy_error` and `deploy_timed_out` do not exist, do not
branch on them.
:::

## Exit codes

Since 0.10.0 the exit code tells error classes apart — a script does not need
to parse the `error` event to know whose fault it is. The class comes from the
error code.

| Exit code | Class | `error` codes |
|---|---|---|
| `0` | success | — |
| `1` | other | `plan_limit`, `forbidden`, `confirmation_required`, `repeated_failure`, `cli_deploys_disabled`, `username_required` and anything not in the classes below |
| `2` | sign-in needed | `auth_required`, `auth_expired`, `auth_timeout` |
| `3` | not found | `project_unknown`, `project_not_found`, `org_unknown`, `database_unknown`, `env_not_found`, `domain_not_found`, `hook_not_found`, `connection_not_found`, `account_not_found`, `repo_not_found`, `claim_unknown`, `branch_without_env`, `no_deploy`, `no_deploys`, `no_runs`, `data_key_unknown` |
| `4` | invalid input | `invalid_type`, `invalid_choice`, `prebuilt_no_dir`, `prebuilt_no_index`, `bad_format`, `nothing_to_set`, `rollback_noop`, `sql_missing`, `branch_unsupported`, `claim_with_project`, `provider_unknown`, `repo_format`, `token_missing`, `username_rejected`, `gb_not_supported`, `dedicated_needs_panel`, `data_key_kind`, `data_key_expiry`, `data_key_ambiguous`, `data_levels_missing`, `data_level_unknown`, `data_probe_method`, `data_probe_path`, `data_probe_query`, `data_probe_body`, `data_probe_as`, `data_probe_user_required`, `data_probe_user_invalid`, `data_probe_schema`, `data_probe_expect` |
| `5` | remote failure | `deploy_failed`, `deploy_cancelled`, `deploy_not_started`, `deploy_watch_lost`, `internal`, `oauth_unavailable`, `claimable_unavailable`, `data_probe_gateway_failed`, any `deploy_<status>` and `http_5xx` |

## Cold-start template for an agent

A minimal behavioural block to drop into a system prompt:

```text
If user asks to deploy via Layero:
  1. Run: npx layero@latest deploy --dry-run --json
     If "detected".confident is false → do what .next_action says first.
  2. Run: npx layero@latest deploy --json
  3. Parse each stdout line as JSON, route on .event:
     - "auth_required" → render .url as clickable link, keep waiting
     - "ready" → show .url (the live site) to user; it already answers
                 (.edge_ready true). Then stop.
     - "error" → follow .next_action verbatim
  4. Never run `git init`. Never run `npm install -g layero`.
```

A fuller example is in [Deploying from AI agents](./agents).
