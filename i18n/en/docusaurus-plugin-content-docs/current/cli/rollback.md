---
sidebar_position: 6
title: Rollback
description: How to bring the production apex back to a working deploy — with the rollback command, or with a targeted promote onto a specific commit_sha.
---

# Rollback

:::tip[Fixed on 27 July 2026]
`layero rollback` used to print `rolled back to <sha>` while moving only
`environments.active_deploy_id` — and the public address resolves through
`projects.production_deploy_id`. The command reported success without
restoring anything, precisely at the moment production was already down.

Rollback now moves the pointer as well: if the apex is served by the branch
being rolled back, the public address comes back with it. Verified on a live
project — three deploys, a rollback, and the apex serves the previous version
from the very first request. The pointer change is recorded in the history as
a separate `rollback` action.

Rolling back a *different* branch still leaves the apex alone: if the owner
deliberately keeps production on another branch, that is their choice.
:::

:::warning[Not available for runtime apps yet]
Rollback works for static projects only. If your project runs as a runtime app
— Next SSR, Streamlit, Gradio — `layero rollback` prints a plan and then fails:
the artifact of such a deploy lives in the image registry rather than in Object
Storage, and the API-side check insists on the storage path. As of 28 July 2026
that is 113 projects out of 507.

The way back for them is to **rebuild the commit you want** with an ordinary
`layero deploy`. Do not reach for `promote` onto an older deploy on a runtime
project: the image of that older deploy may already have been collected, and
then the address stops resolving.
:::

## How to roll back

```bash
layero rollback              # return to the previous successful deploy
layero rollback --yes        # no confirmation
```

The command shows a plan and, once confirmed, restores both the environment's
active deploy and — if the apex is served by this branch — the public address.

A second `layero rollback` in a row changes nothing: the rollback target is
already live. The CLI answers with the `rollback_noop` error and exit code `4`.
To go further back, pick a build explicitly: `layero deploys list`, then
`layero promote <sha>`.

## When you want promote instead

If you need to go back not to the previous deploy but to a specific older one,
by `commit_sha`:

```bash
layero deploys list                 # find the commit_sha of a working build
layero promote ff0d1b86 --yes       # point the apex back at it
```

The argument is **positional**. There is no `--deploy=` flag, and
`layero promote --rollback` does not exist either — the CLI answers
`unknown option`.

`promote` looks the deploy up by `commit_sha`, not by deploy id:
`promote <deploy-id>` returns `no deploy matching …`.

## Why not just rebuild the older commit

Rebuilding a previous commit from git history is not idempotent: `npm install`
against today's registry can produce a different `node_modules` — lockfile
drift, transitive republishes. `promote` reuses **the same** artifact that
worked before: it is already in S3 and is not rebuilt.

## What happens when you promote an older deploy

1. The CLI shows the plan and asks for confirmation:
   ```
   promote plan:
     from: ce70191  2026-05-19 07:09  feature: new pricing page (current production)
     to:   1743a29  2026-05-08 20:30  v2.4.0 — stable release
   proceed? [y/N]
   ```
2. The backend atomically updates `projects.production_deploy_id`, capturing
   the old value into `previous_production_deploy_id`; writes to
   `promote_events` (who, when, source); and invalidates the resolver cache
   through a Postgres NOTIFY.
3. Within a few seconds the apex serves the version you picked — the only delay
   is a short edge cache, up to a minute.

## The two pointers on a project

```
projects.production_deploy_id           ── what the apex serves right now
projects.previous_production_deploy_id  ── what it served before the last promote
```

`previous_production_deploy_id` is updated on every promote (UI / CLI /
auto-promote), so the previous working deploy is always visible in the promote
history: Project → Deploys → "Promote history".

## Limits

- You can only promote a `ready` deploy that has an artifact in storage (or a
  registered runtime container).
- It moves the project's **production apex**; branch preview URLs are
  untouched — each branch has its own independent deploy history.
- For **runtime** projects (SSR Next, Streamlit, Gradio, Flask) the pointer
  switches instantly, but a running instance of the old build keeps answering
  until it is cycled: the next cold start already picks up the right artifact.
- If auto-promote of the default branch is **on**, the next push to it will
  overwrite your manual promote. Turn it off in the project settings if you
  want manual control over production.

## Alternatives

- In the dashboard: the project page → the Production card → the "Roll back"
  button, which moves the production pointer on the backend.
- The per-deploy "Roll back the active deploy" control in the deploys list
  behaves the same way: since 27 July 2026 it also returns the apex when the
  production pointer is served by that branch.
- If you want an actual **rebuild** of the older commit rather than reusing the
  artifact, run an ordinary `layero deploy` with that code, or Redeploy from
  the dashboard.

## Where the divergence came from

Every branch used to have its own canonical host, and `layero rollback` changed
`environments.active_deploy_id` — that is, it worked per branch. When the model
moved to "one apex per project" (V071), a rollback had to move the project's
**production pointer** instead. The CLI command never followed: it stayed on the
old, per-branch path. Hence the success report while the apex never changed.

Related: [`layero promote`](./promote),
[Environments, previews and production](../deploys/environments).
