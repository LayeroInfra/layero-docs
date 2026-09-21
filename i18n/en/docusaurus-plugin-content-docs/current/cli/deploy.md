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

1. The CLI looks at the folder and prints how it sees it (the `detected`
   event). That is advice: only what you name goes to the project (`--type`,
   `--root`, fields of `.layero/project.json`); the framework, the build
   command and the output folder are decided by the platform from the uploaded
   files.
2. It walks the current directory, applies the ignore rules (below), packs
   everything into a tar.gz in a temporary directory and computes the sha256
   on the fly.
3. The archive is uploaded to Yandex Object Storage through a presigned URL.
4. The backend creates a deploy and starts the build.
5. The CLI polls the deploy logs (`/deploys/{id}/logs`) until the status is
   `ready` or `failed`, printing them to the terminal.
6. Once the address answers with the site, it prints the link.

The first `layero deploy` in a new folder creates a project and writes
`./.layero/project.json`. Later runs reuse the same project — no browser
wizard, no manual linking.

Before deploying an unfamiliar folder, look at the plan — it uploads nothing
and needs no login:

```bash
npx layero@latest deploy --dry-run
```

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
| `index.html` in the root, no framework | static | none — files are served as they are | `.` |
| `package.json` with a `build` script, unknown framework | generic | `npm run build` | the folder with `index.html` after the build |

`confident: false` in the `detected` event means the folder was not
recognised; the event then carries `hint` and `next_action` — what the CLI saw
and what to do:

| What is in the folder | What the CLI suggests |
|---|---|
| an app in a subfolder (`apps/web`) | `--root apps/web` |
| an app in a subfolder that imports a neighbour workspace package | [`layero.json`](../deploys/layero-json.md) at the root: `"framework": "generic"`, `buildCommand`, `outputDirectory` |
| `frontend/` and `backend/` side by side | `layero.json` with the `frontend` and `backend` blocks |
| a custom build script with no known framework | `"framework": "generic"` — static files are never built |
| a server with no known framework | `-t node_web` / `-t python_web` |

If detection gets it wrong, pass `--type` explicitly: a static preset
(`--type vite`) or a runtime kind for a server (`-t node_web`,
`-t python_web`). If the app lives in a monorepo subfolder — `--root apps/web`.
To make the fix travel with the code, put a
[`layero.json`](../deploys/layero-json.md) into the repository — that page also
has the symptom-to-fix table. Values from `layero.json` are reflected in
`detected` and in `--dry-run`.

The CLI **does not save** its detection guess — neither to the project nor to
`.layero/project.json` (since 0.11.0; before that the first deploy stored it in
the project settings, and the build log showed it as `(from hint)` /
`(from dashboard)`). The `framework_hint`, `build_cmd`, `output_dir` fields of
`.layero/project.json` are yours: write them by hand, and a new project gets
them as your choice.

## Flags

| Flag | Description |
|---|---|
| `--dry-run` | Print the build plan and exit: framework, build command, output folder, where each value comes from (`layero.json`, project settings, `package.json`, a framework default), hints about the folder's shape, and whether the deploy replaces the live site. Uploads nothing, needs no login; with a login it also reads the settings of the linked project. The event is [`plan`](./json-events.md#plan). |
| `--prod` | Only for a project **with a connected repository**: make this upload live — the project's address switches to it. Without the flag such an upload lands in the separate `cli` environment. A project without a repository is always published; it does not need the flag. |
| `--promote` | After a successful build, point the live address at this deploy (the same as `--prod`, but the CLI switches it after the build). Not needed for a project without a repository. |
| `--branch <name>` | **Refused** with `branch_unsupported` (exit code 4): archive uploads always land in the `cli` environment (see below), so the flag cannot give you a preview. Only meaningful for `layero promote --branch`. |
| `--claim` | Deploy without an account: a temporary site for 1 hour and a `claim_url` for a human to take the site over. Static sites and SPAs only: a server app (SSR, fullstack, container) is refused before upload with `claim_static_only` (exit code 4). The address is random — the folder name and `--name` do not go into it; the site is closed to search engines (`robots.txt` with `Disallow: /` and `X-Robots-Tag: noindex, nofollow`). Only with this flag: without `--claim` and without a token `deploy` asks for a login (`auth_required`) — in an agent environment too. The token, the claim code and the link are kept in `~/.layero/config.json`, not in `.layero/project.json`: that file goes to git. Taking the site into an account clears the environment variables, deploy hooks and build settings set up without an account. Together with `--project` it is refused with `claim_with_project` (exit code 4). |
| `--prebuilt [dir]` | Ship an already-built artifact instead of building on the platform. Without an argument it picks the first existing of `dist/`, `build/`, `public/`, `out/`, `_site/`. `.gitignore` and `.layeroignore` rules are **not applied** — see the note below. |
| `-t`, `--type <preset>` | Override auto-detection. A **static preset** says what to build with: `vite`, `vitepress`, `next`, `astro`, `cra`, `sveltekit`, `nuxt`, `gatsby`, `docusaurus`, `storybook`, `eleventy`, `hugo`, `static` (no build runs at all), `generic` (your own build script: `buildCommand` and `outputDirectory` from [`layero.json`](../deploys/layero-json.md) are executed). A **runtime kind** says the app has to run in a container instead of being served as files: `node_web`, `python_web`, `ssr_next`, `streamlit`, `gradio`, `flask`; aliases — `express`, `fastapi`, `django`, `node`, `python`. An unknown value is refused with `invalid_type`. |
| `--root <dir>` | Monorepo: the subdirectory of the repository that the builder treats as the app root, e.g. `--root apps/web`. **Saved on the project** — push and hook builds use the same value. `layero.json` has no key for this. |
| `--name <name>` | Project name. Only on the first deploy. |
| `--project <id_or_slug>` | Deploy into a specific project, ignoring `./.layero/project.json`. Handy for CI. |
| `--org <slug>` | Create the project in a given Layero organization (on the first deploy). |
| `--yes`, `-y` | Skip the `--prod` / `--promote` confirmation and interactive questions. |
| `--json` | JSON lines on stdout (for AI agents and CI). |
| `--config` | Legacy alias for the current behaviour (auto-detection + `.layero/project.json`). |
| `--confirm-repeated-failure` | Proceed although recent deploys keep failing with the **same** error: the platform stops such repeats until you confirm you know what changed. A flag for a person, not for an agent. |

## Where a deploy lands

```bash
# A CLI project (no repository connected): published to the apex AUTOMATICALLY.
# Direct uploads auto-promote — no separate --prod / promote needed.
npx layero@latest deploy
# → the project's production address (the live public address; printed in the output)

# A project with a connected repository: publish the upload live (CI)
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

**How `--prod` differs from `--promote`** (relevant for projects with a
repository; for a project without one the live address moves anyway):

- `--prod` — the platform points the live address at this upload by itself
  once the build is ready.
- `--promote` — the CLI points it after the build, with a separate request. The
  result is the same.

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
{"event":"detected","framework":"vite","build_cmd":"npm run build","output_dir":"dist","confident":true,"sources":{"framework":"detected","build_cmd":"package.json","output_dir":"framework default"}}
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

In the `ready` event, `url` is the **live public site**. For a project without
a repository that is the project's address (direct uploads are published at
once); for a project with a repository and no `--prod` — the address of the
`cli` environment. `ready` arrives once the address already answers with the
site (`edge_ready: true`): the CLI waits for that itself, up to 90 seconds — a
container app needs time to start. `edge_ready: false` means the app never
answered — see `npx layero@latest logs --runtime`. `dashboard_url` is the
management page, **not** the site. More in the
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

- Maximum archive size — **500 MB**.
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
