---
sidebar_position: 3
title: layero deploy
description: What layero deploy does, its flags, how auto-detection, .layeroignore and the archive limits work.
---

# `layero deploy`

Packs the current directory and publishes it as a new deploy of the project.
**Git and GitHub are not required** — the CLI uploads the local directory
directly.

## Basic use

```bash
cd my-site
npx layero@latest deploy
```

What happens:

1. The CLI auto-detects the framework (`package.json`, configs such as
   `vite.config.ts` / `next.config.js`) and fills in `framework_hint` /
   `build_cmd` / `output_dir` if they are not already set in
   `.layero/project.json`.
2. It walks the current directory, applies the ignore rules (below), packs
   everything into a tar.gz in a temporary directory and computes the sha256
   on the fly.
3. The archive is uploaded to Yandex Object Storage through a presigned URL.
4. The backend creates a deploy and starts the build.
5. The CLI polls the deploy logs (`/deploys/{id}/logs`) until the status is
   `ready` or `failed`, printing them to the terminal.
6. At the end it prints the link — a preview or production URL.

The first `layero deploy` in a new folder creates a project and writes
`./.layero/project.json`. Later runs reuse the same project — no browser
wizard, no manual linking.

## Framework auto-detection

The CLI reads `package.json` and the characteristic configs:

| Signal | Framework | `build_cmd` | `output_dir` |
|---|---|---|---|
| `next` in deps / `next.config.*` | nextjs | `npm run build` (or `npx next build`) | `out` |
| `nuxt` in deps / `nuxt.config.*` | nuxt | `npm run generate` if present, else `npm run build` | `.output/public` |
| `@sveltejs/kit` / `svelte.config.js` | sveltekit | `npm run build` | `build` |
| `gatsby` in deps | gatsby | `npm run build` | `public` |
| `astro` in deps / `astro.config.*` | astro | `npm run build` | `dist` |
| `@docusaurus/core` / `docusaurus.config.*` | docusaurus | `npm run build` | `build` |
| `vite` in deps / `vite.config.*` | vite | `npm run build` | `dist` |
| `react-scripts` in deps | cra | `npm run build` | `build` |
| `.html` in the root, no `package.json` | static | `true` (no-op) | `.` |

If detection gets it wrong, edit `.layero/project.json` by hand or pass
`--type` explicitly.

These values are stored in `.layero/project.json` after the first deploy. They
survive later runs and can be edited by hand.

## Flags

| Flag | Description |
|---|---|
| `--prod` | The deploy lands on the project's default branch (the same as a push to main). If the project has auto-promote on, the apex switches to the fresh build automatically. |
| `--promote` | After a successful build, moves `production_deploy_id` to this deploy **immediately**. Works for any branch — handy for shipping a feature branch to production in one command. |
| `--branch <name>` | **Refused** with `branch_unsupported` (exit code 4): archive uploads always land in the `cli` environment (see below), so the flag cannot give you a preview. Only meaningful for `layero promote --branch`. |
| `--claim` | Deploy without an account: a temporary project for 72 hours and a `claim_url` for a human to take the site over. Turns on by itself when there is no token, the run is non-interactive (an agent, not CI) and `--yes` is passed. |
| `--prebuilt [dir]` | Ship an already-built artifact instead of building on the platform. Without an argument it picks the first existing of `dist/`, `build/`, `public/`, `out/`, `_site/`. `.gitignore` and `.layeroignore` rules are **not applied** — see the note below. |
| `--type <preset>` | Override auto-detection: `vite`, `next`, `astro`, `cra`, `sveltekit`, `nuxt`, `gatsby`, `docusaurus`, `static`. |
| `--name <name>` | Project name. Only on the first deploy. |
| `--project <id_or_slug>` | Deploy into a specific project, ignoring `./.layero/project.json`. Handy for CI. |
| `--org <slug>` | Create the project in a given Layero organization (on the first deploy). |
| `--yes`, `-y` | Skip the `--prod` / `--promote` confirmation and interactive questions. |
| `--json` | JSON lines on stdout (for AI agents and CI). |
| `--config` | Legacy alias for the current behaviour (auto-detection + `.layero/project.json`). |

## Where a deploy lands

```bash
# A CLI project (no repository connected): published to the apex AUTOMATICALLY.
# Direct uploads auto-promote — no separate --prod / promote needed.
npx layero@latest deploy
# → the project's production address (the live public address; printed in the output)

# CI mode: no confirmation
npx layero@latest deploy --prod --yes
```

**For a CLI project (no repository)** every `layero deploy` replaces what the
apex serves — that is the publish. The address works right after the first
successful build: the CDN warm-up that used to take several minutes is gone,
because user sites go straight to the platform edge.

What the address looks like depends on which domain zone the project lives in
(`<project>.layero.app`, or `<org>-<project>.layero.app` for projects older
than 26 July 2026) — see
[Environments, previews and production](../deploys/environments). Do not
assemble the address from a template: take it from the `url` field of the
`ready` event.

**How `--prod` differs from `--promote`** (relevant for git projects; for
direct CLI uploads the apex moves anyway):

- `--prod` = "put it on the default branch". After that the apex is the
  business of either auto-promote (if enabled in Settings) or your manual
  "Promote" click.
- `--promote` = "once it builds, point the apex at this deploy". Works for any
  branch — the short path for "hot-fix from a feature branch → production".

:::danger[`--branch` is refused in `layero deploy`]
Archive uploads are **always** filed under the reserved `cli` environment, so a
manual upload never collides with a branch of a connected repository. Before
0.10.0 the flag was accepted and silently ignored: after
`layero deploy --branch=probe` no `probe` environment appeared and the live
site was replaced. Since 0.10.0 the CLI refuses before packing —
`branch_unsupported`, exit code 4 — and `next_action` says what to do:
connect a repository (`layero projects create --repo …`) and push a branch.

What that means in practice:

- **A project with no repository.** `cli` *is* its default branch, so the
  deploy auto-promotes to the apex. **Every `layero deploy` replaces the live
  site, and there is no way to upload a non-promoting build from the CLI.**
- **A project with a repository connected.** `cli` is not the default branch,
  so a CLI upload lives at its own `<project>-cli` address and does not move
  the apex (unless `--prod` is passed).

Branch previews are a git-flow feature: pushing to a branch creates the
environment through the webhook.
:::


:::warning[`--prebuilt` does not look at `.gitignore`]
The flag points at a **build output directory**, where source-tree rules are
meaningless, so `.gitignore` and `.layeroignore` are not applied there. That is
by design — but it has a flip side.

`layero deploy --prebuilt .` at your project root publishes **everything that
sits there** except the built-in denylist — including drafts and notes you hid
via `.gitignore`. Verified on a live deploy: a `.gitignore`d file is served
with a 200 after such a command.

Secrets are still safe: `.env`, `.env.*`, `.git`, `node_modules` and the rule
files are excluded on this path too (verified, nested directories included).
Even so, name the directory explicitly rather than using `.`.
:::

## Mixed mode: GitHub + CLI on one project

The same project can accept both at once:

* **a push to GitHub** → an automatic deploy (webhook);
* **`layero deploy`** → a CLI tarball upload.

The GitHub integration is optional. A first deploy through the CLI needs
**neither** a git repository nor a GitHub account. You can connect GitHub
later, through the dashboard, if you want auto-deploy on push.

Mixed mode is useful when:

* the GitHub build is slow or flaky and you need a quick local hot-fix:
  `layero deploy --prod --yes` puts your local code into production in seconds
  without a commit;
* in CI, after the tests pass, you want to pin the release explicitly:
  `layero deploy --prod --yes` after `git push`.

Artifacts in the dashboard are labelled by source:

| Badge | What it means |
|---|---|
| `push` | A webhook from a GitHub push |
| `cli` | Uploaded through `layero deploy` |
| `manual` | Started from the dashboard (Redeploy) |

An example CI build:

```bash
LAYERO_TOKEN=$LAYERO_DEPLOY_TOKEN npx layero@latest deploy --prod --yes \
  --project alice-my-site
```

## JSON mode for agents and CI

Every CLI command supports `--json` (or `LAYERO_JSON=1`):

```bash
npx layero@latest deploy --json
```

Each stdout line is a JSON object with an `event` field:

```jsonl
{"event":"detected","framework":"vite","build_cmd":"npm run build","output_dir":"dist","confident":true}
{"event":"project_created","project_id":"...","slug":"my-site","organization":"alice"}
{"event":"packing","files":124,"bytes":2401234,"sha256":"..."}
{"event":"uploading"}
{"event":"deploy_started","deploy_id":"..."}
{"event":"build_log","line":"...","stream":"stdout"}
{"event":"ready","url":"https://my-site.layero.app/","dashboard_url":"https://app.layero.ru/projects/...","deploy_id":"..."}
```

Errors arrive with a stable `code` and `next_action`:

```json
{"event":"error","code":"cli_deploys_disabled","next_action":"enable them in project settings","message":"CLI deploys are disabled on project \"my-site\""}
```

> Not signed in? `layero deploy` starts the device flow itself (an
> `auth_required` event → click the link → poll); a separate `layero login` is
> not needed.

In the `ready` event, `url` is the **live public site**. For a CLI project
that is the production address (direct uploads auto-promote); for a deploy
into a named branch it is that branch's preview address. Show the user `url` —
it works straight away. `dashboard_url` is the management page, **not** the
site. On the legacy `preview_url` / `edge_ready` fields see the
[JSON events schema](./json-events).

JSON mode turns on automatically when the CLI runs inside Cursor / Claude Code
/ any process with a non-TTY stdout. More in
[Deploying from AI agents](./agents); the full event list is in the
[JSON events schema](./json-events).

## Ignore rules

The CLI honours:

- `.gitignore` (as git does);
- `.layeroignore` (same syntax, can extend or un-exclude);
- a built-in denylist:
  ```
  node_modules
  .git
  dist
  build
  .next
  .env*
  .DS_Store
  .gitignore
  .layeroignore
  ```

  The rule files themselves are excluded deliberately: they have no business
  being on the web, and they list exactly the filenames you chose to hide — a
  published `.gitignore` tells a visitor what to look for.

:::tip
Build artifacts (`dist`, `build`, `.next`) do **not** need uploading — the
build runs on Layero's side after unpacking.
:::

## Limits

- Maximum archive size — **200 MB**.
- `layero deploy` is bounded by backend timeouts:
  | Stage | Limit |
  |---|---|
  | clone / unpack | 15 min |
  | install | 30 min |
  | build | 15 min |
  | upload to S3 | 10 min |

If your build does not fit, write to support — limits are raised
case by case.

## The build environment

Every build runs in an **isolated sandbox** on a dedicated builder VM:

- **CPU / memory**: 2 vCPU, 4 GB RAM, up to 4 GB swap, a 1024-process limit.
- **Disk**: writable scratch (`/mnt/scratch`, ~40 GB per build), a 256 MB
  tmpfs `/tmp`. The `npm`/`yarn`/`pnpm` caches are redirected to scratch
  automatically, so large binaries (`rolldown`, `swc`, `sharp`) download
  without ENOSPC.
- **Network**: outbound HTTPS is allowed to the npm mirror, GitHub, package
  registries (npm, yarn) and S3. Arbitrary external endpoints are unreachable
  from the build stage — that protects other people's builds from accidental
  or malicious traffic. If your build needs a private registry or CDN, write
  to support.
- **Isolation**: gVisor (`runsc`) + seccomp + drop-all capabilities + a
  read-only rootfs. Builds of different projects cannot see each other and
  have no access to Layero's infrastructure.

The environment does not persist between builds: anything written to `/tmp` or
`/mnt/scratch` disappears when it finishes. Artifacts in `output_dir` (`dist`
by default) are uploaded to object storage, which is what the platform edge
serves.

## After the deploy

Once `ready` arrives:

- The **branch preview URL** is available right after a successful build and
  lives as long as the branch exists.
- The **apex** (the project's production address) serves this deploy if it
  became production: for a CLI project (no repository) that happens
  automatically on every `layero deploy`; for a git project it happens through
  auto-promote of the default branch or `--promote`. `--branch` changes none of this — see the note
  above.

See [Environments, previews and production](../deploys/environments) for the
full picture.

## The postinstall banner

After `npm install -g layero` or `npm install -D layero` (without `--silent`)
the CLI writes a short quickstart to `/dev/tty`. In CI environments the banner
is suppressed automatically (`CI=1`). To switch it off by hand:

```bash
LAYERO_SKIP_POSTINSTALL=1 npm install -D layero
```
