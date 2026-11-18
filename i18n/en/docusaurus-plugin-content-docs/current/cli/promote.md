---
sidebar_position: 5
title: layero promote
description: Point the production apex at a specific deploy — from any branch, without a rebuild. Also the working way to roll production back.
---

# `layero promote`

:::danger[The command forms were verified on 27 July 2026]
- The deploy is given as a **positional argument**: `layero promote <commit-sha>`.
  There is no `--deploy=` flag. Take the sha from `layero deploys list`.
- **`layero promote --rollback` does not exist** — the CLI answers
  `unknown option`. For the working rollback, see [Rollback](./rollback).
:::

Point a project's production apex at the given deploy. It moves the
`production_deploy_id` pointer — no rebuild — and the apex starts serving the new
artifact almost immediately; the only delay is a short edge cache, up to a
minute.

## What it is for

Layero's production flow works the way Vercel's does:

1. Push to any branch → that branch's preview URL
2. Test it, share it, compare it
3. Ready to ship — **promote** the ready deploy you just checked

Without a promote the apex keeps serving the previous production. That is the
safeguard against accidental releases right after a merge into main, when
auto-promote is off for the team.

## Usage

```bash
# the latest ready upload from the CLI (the cli branch)
layero promote

# the latest ready build of the repository's main branch
layero promote --branch=main

# promote by commit SHA (the first 7+ characters) or a full deploy id
layero promote a3f9c2b

# a specific branch → its latest ready deploy
layero promote --branch=staging

# roll back: return the apex to a previous working deploy, by its sha
layero promote <commit-sha>

# CI: no confirmation
layero promote --yes
```

:::warning[No argument means the `cli` branch]
Without a sha and without `--branch` the command takes the latest ready upload
from the CLI, not the build of the main branch. For a project with a
repository this can put an old upload into production. Pass a sha or
`--branch=main`.
:::

## What happens

1. The CLI finds the deploy (by the positional sha, by the latest ready deploy
   in `--branch`, and without either — by the latest ready deploy of the `cli` branch).
2. It shows the plan:
   ```
   promote plan:
     from: 1743a29  2026-05-08 20:30  v2.4.1 — bugfix release
     to:   ce70191  2026-05-19 07:09  feature: new pricing page
   proceed? [y/N]
   ```
3. Once you confirm, the backend:
   - atomically updates `projects.production_deploy_id` (a CTE captures the old
     value into `previous_production_deploy_id`, for rollbacks);
   - writes to `promote_events` (an audit log: who, when, source='cli',
     prev → new);
   - invalidates the resolver cache through a Postgres NOTIFY.
4. The edge picks up the new artifact at once; previously cached responses
   refresh on a short TTL, up to a minute.

## Rolling back

`layero rollback` returns the **previous** successful deploy and, since
27 July 2026, moves the production pointer with it — see
[Rollback](./rollback).

Use `promote` when you need a **specific** older deploy rather than the
previous one:

```bash
layero deploys list                # find the commit_sha of a working build
layero promote ff0d1b86 --yes      # point the apex back at it
```

The platform keeps two pointers on the project — `production_deploy_id` and
`previous_production_deploy_id`. The second is updated on every promote, so the
previous working deploy is always visible in the promote history. More in
[Rollback](./rollback).

## `--promote` as a flag on `layero deploy`

If you want build → promote in one command, without waiting for `ready` in the
UI:

```bash
layero deploy --promote --yes
```

The build finishes, the CLI moves straight to the promote and confirms it. It is
equivalent to `layero deploy … && layero promote <last-sha>`, minus the second
manual command.

## Limits

- You can only promote a `ready` deploy that has an `s3_path` (or a registered
  runtime container).
- For **runtime** projects (SSR Next, Streamlit, Gradio, Flask) the promote
  switches the pointer instantly, but a running instance of the old build keeps
  answering until it is cycled — the next cold start already uses the new
  artifact.
- If auto-promote of the default branch is **on**, the next push to that branch
  will overwrite your manual promote. Turn auto-promote off in the project's
  Settings if you want to keep manual control over production.

## Alternatives

- In the dashboard, on the deploy page — the "Promote to production" button.
- On the project page, in the Production card — the "Roll back" button. It works
  on the backend and moves the production pointer; since 27 July 2026 the CLI's
  [`rollback`](./rollback) does the same.
- The promote history — Project → Deploys → "Promote history" (it shows auto vs
  ui vs cli, and who did it).

## How this relates to rollback

Each branch used to have its own canonical hostname, and `layero rollback`
changed `environments.active_deploy_id` — that is, it worked per branch. Under
V071 the domain model became one-per-project, and a rollback has to move the
project's **production pointer**. For a while the CLI command lagged behind that
change and did not bring the apex back; fixed on 27 July 2026 — `rollback` now
moves the pointer too, when the apex is served by the same branch. Details in
[Rollback](./rollback).
