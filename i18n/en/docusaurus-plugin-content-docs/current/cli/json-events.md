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
- adds a `ts` field (ISO-8601 timestamp) to every event.

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

Framework auto-detection finished.

| field | type |
|---|---|
| `framework` | string — `next`/`vite`/`astro`/`sveltekit`/`nuxt`/`gatsby`/`cra`/`docusaurus`/`static` |
| `build_cmd` | string |
| `output_dir` | string |
| `confident` | boolean — `false` for the static fallback |

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
automatically.

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

Project settings (`framework_hint` / `build_cmd` / `output_dir`) were applied
on the first deploy. No fields.

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

The build moved to a new stage.

| field | type |
|---|---|
| `name` | `clone`/`install`/`build`/`upload`/`activate` |

### `build_log`

One line of build output. Only worth forwarding to the user when it contains
an error — successful builds produce a lot of noise.

| field | type |
|---|---|
| `line` | string |
| `stream` | `stdout`/`stderr` |

### `ready`

**The final event.** The deploy is live. Show `url` to the user and stop.

| field | type | note |
|---|---|---|
| `url` | string | **The live public address of the site** — not the dashboard. For a plain `layero deploy` of a CLI project this is the project's production address (CLI uploads auto-promote to the apex). For a deploy into a named branch (`--branch`) it is that branch's preview address. It is reachable straight away; this is the link to open and to show the user. |
| `dashboard_url` | string? | The project management page (`https://app.layero.ru/projects/<id>`). This is **not** the site — never hand it over as the link to the finished site. |
| `preview_url` | string? | **Legacy, no longer emitted.** A separate per-deploy preview host in the `*.preview.layero.ru` zone. It existed to give out a link while the apex warmed up on the CDN. `layero.app` has no separate preview zone and no user sites remain on `layero.ru`, so the field is never populated. |
| `edge_ready` | bool? | Whether the address answers at the moment the deploy finishes. The field used to mean "the apex warmed up on the CDN" and stayed `false` forever for new hosts; it now comes from a real probe. You still should not gate on it — the address is live immediately. |
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

Result of `layero data keys create`. The full key value is sent once — store it right away.

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
| `request` | object | `method`, `path`, `as`, `user_id`, `query`, `schema` — what was sent; `schema` is lowercased, the body is not repeated |
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
| `deploy_not_started` | The build never started | Re-run `layero deploy`; if it repeats, check the project in the dashboard |
| `deploy_failed` | The build never reached `ready` | Open the logs at the URL in `next_action` |
| `repeated_failure` | Consecutive builds keep failing with the **same** error, so the platform refused to ship another one blindly. The error text is in `message` and in the `repeated_failure_guard` event | Read the error and fix its cause. Re-running unchanged fails the same way. If you already fixed it — `layero deploy --confirm-repeated-failure` |
| `repeated_failure_declined` | Same, but the interactive prompt «ship anyway?» was answered no | Fix the error and run `layero deploy` again |
| `no_deploy` / `no_deploys` | The project has no deploys yet | Run `layero deploy` first |
| `rollback_unsupported` | The deploy has no servable artifact: either a runtime project, or static whose artifact was purged by retention | Rebuild the commit with `layero deploy` |
| `env_not_found` | No such variable | `layero env list` |
| `nothing_to_set` | `layero env set` called without a `KEY=value` pair | `layero env set KEY=value` |
| `bad_format` | An argument could not be parsed | The expected format is in the message |
| `domain_not_found` | The project has no such domain | `layero domains list` |
| `domain_rejected` | The platform refused the domain | The reason is in the message |
| `forbidden` | The token lacks the scope this operation needs | Issue a token with the required scope |
| `branch_without_env` | The branch has no environment yet | Deploy that branch first |
| `analytics_not_connected` | Analytics is not connected | `layero analytics connect` |
| `no_runs` | No speed-check runs recorded | `layero perf check` |
| `data_api_disabled` | `layero data …` was run for a database whose Data API is off | `layero data enable --db <database>` |
| `data_key_kind` | `layero data keys create --kind` with an unknown key kind | `--kind public` — a key for the site, `--kind secret` — for the server |
| `data_key_expiry` | `--expires-in` with an unsupported lifetime | Allowed lifetimes are in `next_action`, or `never` |
| `data_key_unknown` | The database has no active key with that id or prefix | `layero data keys list --db <database>` |
| `data_key_ambiguous` | The prefix matches several keys of the database | Pass the key id — the ids are in `next_action` |
| `data_levels_missing` | `layero data grant` was run without a single level | Table: `--get visitor --post server …`; function: `--call visitor` |
| `data_level_unknown` | The access level is not on the list | `closed`, `visitor` — any visitor, `user` — signed-in users, `server` — server only |
| `data_levels_blocked` | The platform refused to apply the levels: e.g. privileges are granted on individual columns, or the schema belongs to another role. The reason is in `message`; nothing was sent | Change the request as the refusal says; current levels — `layero data methods --db <database>` |
| `data_api_already_enabled` | `layero data enable --db <database>` for a database whose Data API is already on. Nothing changed: enabling again would revoke the API roles' privileges on schema `public` | Keys — `layero data keys list --db <database>`, methods — `layero data methods --db <database>`. If the roles or the `api` schema privileges were broken by hand — `layero data enable --db <database> --repair --yes` |
| `confirmation_required` | The command changes access (revoking a key, removing a site, applying levels) and there is nobody to confirm it in agent mode. Nothing was changed; the command plan came as a separate event | Show the plan to a human and rerun with `--yes` — the ready command is in `next_action` |
| `data_probe_method` | A method other than `GET`, `POST`, `PATCH`, `DELETE`; `/whoami` with a method other than `GET`; a function (`/rest/v1/rpc/…`) with a method other than `GET` or `POST`. Nothing was sent | A suitable method is in `next_action`; for `/whoami` and functions, as a ready command |
| `data_probe_path` | The probe path contains `?` or ends with a slash. Nothing was sent | A ready command with all the flags you passed is in `next_action`: parameters from `?` become `--query` flags, the path loses the slash |
| `data_probe_query` | `--query` is not `name=value`, the name is empty, or the same name is given twice | `--query select=id,title --query price=gt.100`; several conditions on one column — one `or=(…)` parameter |
| `data_probe_body` | The probe body could not be used: not JSON, not an object or array, the file is unreadable, both `--body` and `--body-file` are given, a body with `GET` or `DELETE`, or a number in the body cannot be passed exactly — e.g. `9007199254740993` would be sent as `9007199254740992` | A JSON object or array in `--body` or `--body-file`, for `POST` and `PATCH` only; pass a big number as a quoted string |
| `data_probe_as` | `--as` is not `visitor`, `user` or `server`, or `--user` without `--as user` | `--as visitor`, `--as user --user <id>` or `--as server` |
| `data_probe_user_required` | `--as user` without `--user`: no user to probe as | `--user <app user id>` |
| `data_probe_user_invalid` | `--user` is not a UUID: the platform expects an app user id | Take the id from the database page in the dashboard, in the list of app users |
| `data_probe_schema` | `--schema` is not `api`, `public` or `app`, or it is given for a function or `/whoami`, which have no schema. Without this check the platform would silently ignore the flag | `--schema api`, `public` or `app` — tables only; without the flag the gateway looks for the table in `api`, then `public`, then `app` |
| `data_probe_expect` | `--expect` could not be parsed: a status (`200`), a class (`2xx`) or a comma-separated list is expected | `--expect 200`, `--expect 2xx`, `--expect 201,204` |
| `data_probe_rejected` | The platform refused the probe before calling the gateway: the path is not a method of the database, sign-in is off for the database, the body exceeds 64 KB, more than 50 parameters, the gateway cannot roll back probes yet. The reason is in `message`; nothing was run. A refusal by the gateway itself (`4xx`) is not this code but a `data_probe` event | A hint for the specific case is in `next_action` |
| `data_probe_gateway_failed` | The gateway gave no answer: it answered `5xx` (e.g. `503` with `too_busy`) or did not answer the platform at all. If the gateway answered, the `data_probe` event arrived before the error. A status listed in `--expect` never produces this error | Repeat the probe later |
| `data_probe_unexpected_status` | The gateway status did not match `--expect`. The `data_probe` event arrived before the error | Compare the probe answer with the access levels: `layero data methods --db <database>` |
| `data_probe_not_rolled_back` | A write probe went through (response 200–399) and the gateway did not confirm the rollback: data may have changed. The `data_probe` event arrived before the error; `--expect` does not suppress this error | Check the database data; do not repeat the write probe until the cause is found |
| `internal` | An unexpected CLI error (network, unhandled exception) | Re-run with `--debug` |

:::note[The deploy code is built from the status]
The code for an unsuccessful deploy is assembled as `deploy_<status>` from the
build status, and a deploy has four statuses: `ready`, `building`, `failed`,
`cancelled`. So in practice you will only ever see `deploy_failed` and
`deploy_cancelled` — `deploy_error` and `deploy_timed_out` do not exist, do not
branch on them.
:::

## Cold-start template for an agent

A minimal behavioural block to drop into a system prompt:

```text
If user asks to deploy via Layero:
  1. Run: npx layero@latest deploy --json
  2. Parse each stdout line as JSON, route on .event:
     - "auth_required" → render .url as clickable link, keep waiting
     - "ready" → show .url (the live site) to user. It is reachable right
                 away — do NOT gate on .edge_ready. Then stop.
     - "error" → follow .next_action verbatim
  3. Never run `git init`. Never run `npm install -g layero`.
```

A fuller example is in [Deploying from AI agents](./agents).
