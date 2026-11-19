---
slug: /cli/deploy
sidebar_position: 4
title: From a folder with the CLI
description: How to publish a folder with layero deploy — no repository. What happens on upload, where it lands, flags, what isn't sent, build limits and JSON mode.
---

# From a folder with the CLI

**`layero deploy` uploads a folder to Layero, and the platform builds and
publishes it.** No repository needed.

```bash
cd my-site
npx layero@latest deploy
```

To see the plan without uploading and without signing in:

```bash
npx layero@latest deploy --dry-run
```

The plan shows the framework, the build command, the output folder, where each
value came from and whether the upload will replace the live site.

## What happens

1. The CLI looks at the folder and prints how it understood it. That's a
   hint: the platform detects the framework, build command and output folder
   itself from the uploaded files — see [Frameworks](../build/frameworks.md).
2. It packs the folder, skipping files by the rules below, and uploads the
   archive.
3. The platform builds the project. The build log streams to the terminal.
4. The CLI waits until the site answers (up to 90 seconds) and prints its address.

The first upload from a folder creates a project and records it in
`.layero/project.json`. Later uploads from this folder go to the same
project.

If you haven't signed in yet, `layero deploy` shows a sign-in link itself —
see [Installing and signing in](../cli/install.md).

## Where the upload lands

- **A project without a repository.** Every upload replaces the site at the
  main address right away. You can't upload a version that won't go live.
- **A project with a connected repository.** The upload lands in the separate
  `cli` environment at `<project>-cli.layero.app` and doesn't touch the main
  address. To publish it there, add `--prod`.

You can't pick a branch for an upload: the CLI refuses `--branch` with the
`branch_unsupported` code. Branch previews come from pushes to a connected
repository — see [Connecting a repository](./git-providers.md).

Take the exact address from the CLI output (the `url` field of the `ready`
event) rather than building it from a template.

## Flags

| Flag | What it does |
|---|---|
| `--dry-run` | show the build plan and exit. Uploads nothing, no sign-in needed |
| `--prod` | only for a project with a repository: publish the upload at the main address |
| `--promote` | the same result as `--prod`, only the CLI switches the main address itself after the build, with a separate request |
| `-y`, `--yes` | ask no questions, including the `--prod` confirmation |
| `-t`, `--type <type>` | set the framework or app type by hand — values are on [Frameworks](../build/frameworks.md#setting-the-framework-by-hand) |
| `--root <folder>` | monorepo: the app folder, for example `apps/web`. Saved on the project |
| `--prebuilt [folder]` | send a ready build instead of building on the platform |
| `--name <name>` | the new project's name |
| `--address <label>` | the new project's address: `inbox` → `inbox.layero.app` |
| `--org <slug>` | the organization for a new project. Personal by default |
| `--project <id or slug>` | upload into an existing project, ignoring `.layero/project.json` |
| `--db <database>` | connect an organization database before the build, so the first build already gets the Data API address and key |
| `--claim` | publishing without an account, see below |
| `--confirm-repeated-failure` | go on even though recent builds fail with the same error |
| `--json` | JSON-mode output, see below |

### `--prebuilt`: a ready build

Without a folder, the first existing one of `dist`, `build`, `public`, `out`,
`_site`, `.output/public`, `docs/.vitepress/dist`, `.vitepress/dist` is taken.

:::warning[`--prebuilt` ignores `.gitignore`]
For a ready build, `.gitignore` and `.layeroignore` rules don't apply.
`layero deploy --prebuilt .` at the project root publishes everything there,
including drafts hidden by `.gitignore`. `.env*` files, `.git` and
`node_modules` are excluded here too, but still name the `--prebuilt` folder
explicitly.
:::

### `--claim`: without an account

With `--claim` the CLI publishes a temporary site for an hour and prints a link for taking the site into an account. Static sites and single-page apps only: the CLI refuses an app with a
server with the `claim_static_only` code. The address is random, and search
engines don't index the site. Without `--claim` and without a sign-in,
`deploy` asks you to sign in.

## What isn't sent

The CLI skips files by the `.gitignore` and `.layeroignore` rules (same
syntax) and by its own list:

```
node_modules  .git  .svn  .hg
dist  build  .next  .nuxt  .output  .cache  .turbo  .vercel  .netlify
.env  .env.*  *.log  .DS_Store  Thumbs.db  .layero
.gitignore  .layeroignore
```

You don't need to upload build output (`dist`, `build`, `.next`): the project
is built on the platform. Lock files are always sent, even if `.gitignore`
hides them — dependencies are installed from them.

**`.env*` files** don't go into the archive, even if `.gitignore` allows them.
If an environment file is needed at build time — for example,
`.env.production` with public variables for Vite — name it in
`.layeroignore`:

```
!.env.production
```

Broad rules like `!*` don't bring environment files back. Secrets are better
kept in the [project's environment variables](../build/env-vars.md).

## Limits

- The upload archive — up to 500 MB.
- The build — up to 30 minutes, installing dependencies — up to 30 minutes,
  uploading the result — up to 10 minutes, and everything together — up to
  40 minutes.
- Build memory — 4 GB.

Builds run in an isolated environment: builds of different projects don't
see each other. If the limits aren't enough, write to
[support](../support.md).

## JSON mode for agents and CI

With the `--json` flag or the `LAYERO_JSON=1` variable, the CLI prints one
JSON object per line:

```jsonl
{"event":"detected","framework":"vite","build_cmd":"npm run build","output_dir":"dist","confident":true}
{"event":"packing","files":124,"bytes":2401234}
{"event":"deploy_started","deploy_id":"..."}
{"event":"build_log","line":"...","stream":"stdout"}
{"event":"ready","url":"https://my-site.layero.app/","dashboard_url":"https://app.layero.ru/projects/...","deploy_id":"..."}
```

In the `ready` event, `url` is the site itself and `dashboard_url` is the
project page in the dashboard. An error comes as an `error` event with a code
and a ready next step in `next_action`.

JSON mode turns on by itself when the CLI runs inside an AI agent — Claude
Code, Cursor, Aider and others that set their own environment variable. In CI
and when output doesn't go to a terminal, the CLI prints plain text and asks
nothing: `--prod` there publishes to the main address without confirmation.

All events and error codes — [CLI JSON events](../agents/json-events.md).
