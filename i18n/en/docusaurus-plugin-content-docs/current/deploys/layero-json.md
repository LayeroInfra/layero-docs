---
sidebar_position: 2
title: layero.json — configuration in the repository
description: A file in the repository sets the framework, the build and start commands, the output folder, the Node version, the app type and the frontend + backend layout. When you need it, the complete key list, a symptom-to-fix table and how to verify in the build log.
---

# `layero.json` — configuration in the repository

An optional file at the root of the app. It sets what Layero would otherwise
detect on its own, and it lives next to your code — so it travels with it and
can differ per branch.

There is one rule:

> Whatever you set in the file, Layero must apply. Whatever you leave out,
> Layero decides for itself.

## Deploy without the file first

**Make the first deploy without `layero.json`.** By platform data over 90
days, 84% of new projects go live on the first build with no file at all: Layero finds the framework, the package
manager, the build script, the output folder and the Node version, and for a
server app — the start command and the port.

The file is an answer to one specific failure: **one symptom, one field**.

- Every field you write stops being auto-detected and is
  [locked in the dashboard](#a-field-from-the-file-is-not-editable-in-the-dashboard).
  A value copied "just in case" becomes a lie the day the project changes its
  bundler.
- About 60% of failed builds are not fixable by the file at all — they are
  fixed elsewhere, see [what the file does not fix](#what-the-file-does-not-fix).

When a build or a launch fails:

1. Read the real error, not the deploy card: in the build log
   (`npx layero@latest logs`; `logs --runtime` for the output of the running
   app) or with `npx layero@latest diagnose`.
2. Find the symptom in the [table below](#symptom--fix) and change exactly one
   thing.
3. [Verify in the log](#how-to-verify-in-the-log) that the value was applied
   and the file produced no warnings.
4. The same failure twice in a row — stop and re-read the log instead of
   deploying a third time. After ten identical failures in a row Layero pauses
   auto-deploys from git.

The file is also justified without a failure when the configuration has to
travel with the code: differ per branch or go through code review.

## Examples: one symptom, one field

Wrong output folder, nothing else:

```json title="layero.json"
{ "outputDirectory": "dist/client" }
```

Detected as "Static (no build)", but it is a Vite app:

```json title="layero.json"
{ "framework": "vite", "outputDirectory": "dist" }
```

Your own build script and no known framework:

```json title="layero.json"
{ "framework": "generic", "buildCommand": "node build.mjs", "outputDirectory": "public" }
```

A Node server that Layero treated as a static site:

```json title="layero.json"
{ "runtime": "node_web", "startCommand": "node dist/server.js", "port": 3000 }
```

A FastAPI app with a non-standard entry point:

```json title="layero.json"
{ "runtime": "python_web", "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT" }
```

Every field is optional. An empty file `{}` is valid and means "detect
everything yourself".

`"$schema": "https://layero.ru/schema/layero-v2.json"` turns on autocompletion
and error highlighting in any editor that supports JSON Schema: VS Code,
JetBrains, Neovim. It has no effect on the build.

## All keys

Only these names exist. An unknown key does not fail the build — it is skipped
with a note in the log, see [mistakes inside the file](#mistakes-inside-the-file).

| Key (short name) | Applies to | What it sets |
|---|---|---|
| `framework` | build | Framework name; wins over detection. Values — in the [framework list](../getting-started/frameworks). |
| `installCommand` (`install`) | build | Dependency install command. |
| `buildCommand` (`build`) | build | The whole build command. |
| `outputDirectory` (`output`) | static only | Folder with `index.html` after the build. |
| `nodeVersion` (`node`) | build | Node.js version. |
| `runtime` | app type | Run the app in a container instead of serving files. |
| `startCommand` (`start`) | container only | Start command inside the container. |
| `port` | container only | Port the app listens on. |
| `memory_mb`, `cpu_quota`, `idle_timeout_s`, `preload` | container only | Container resources and the idle time before sleep. |
| `env` | container only | **Non-secret** environment variables. |
| `layout` | shape | `"fullstack"` — declare two halves explicitly. |
| `frontend` | full-stack | The half served as files. |
| `backend` | full-stack | The half that runs in a container. |
| `apiPrefix` (`api_prefix`) | full-stack | Path prefix routed to the backend, e.g. `"/api"`. |

### `framework`

The framework name. Set it only when detection was wrong: Storybook next to a
Vite app, "Static (no build)" on a project that needs a build.

Two values are worth telling apart:

- **`static` — no build runs at all.** No install and no build: `buildCommand`
  is ignored with it, and whatever is in the folder gets published.
- **`generic` — your own build script.** There is no known framework, but the
  project has to be built: Layero executes your `buildCommand` and
  `outputDirectory`.

### `installCommand`

The dependency install command. By default Layero uses your package manager's
reproducible command: `npm ci`, `yarn install --frozen-lockfile`,
`pnpm install --frozen-lockfile`.

Fix the repository first: commit an up-to-date lockfile and an exact
`packageManager` — and only then set the field. `npm ci` without a lockfile is
a ready-made failure.

For an app in a container the field applies to Python only: it replaces the
`pip install -r requirements.txt` step. A Node server (`node_web`, `ssr_next`)
never executes it — install is chosen from the lockfile.

### `buildCommand`

The whole build command: `pnpm build:prod`, not `build:prod`. Do not write
`npm run build` into the file — it is already the default, and writing it
locks the field in the dashboard.

### `outputDirectory`

The folder with the built static files, relative to the app root — the one
that contains `index.html` **after** the build. For example: `dist`, `build`,
`out`, `dist/client`, `dist/my-app/browser`. It names a folder, not a file.
Layero executes what is written and does not swap in a better guess.

The field only applies to sites Layero serves as files. For an app in a
container it is accepted but never applied — and no warning is printed. Give
such an app a [`startCommand`](#startcommand).

### `nodeVersion`

The Node.js version to build on. Accepts a major `"22"`, an exact version
`"22.14.0"` or `"lts"`. The field overrides `.nvmrc` and `engines.node`: if the
version is already set there, fix it there — otherwise the project ends up
with two sources of truth.

### `runtime`

The type of an app that Layero **runs in a container**: `ssr_next`, `node_web`,
`python_web`, `streamlit`, `gradio` (the last two require `app.py`). There are
no other values.

Layero normally switches a project between static and container by itself when
it recognises the server: Next without `output: 'export'`, Express, Fastify,
FastAPI, Flask, Django. The field is for when it did not. A top-level `runtime`
wins over the project type in the settings — the log says `the file wins`. One
line changes how the site is served, so write it on purpose.

A one-off alternative without a file: `npx layero@latest deploy -t node_web`.
More on containers — [When you need a runtime](../runtime/overview.md).

### `startCommand`

The start command of an app in a container. Without `runtime` (or a server
project type) it does nothing.

The application's working folder inside the container is `/app`: your code
lands there, and that is where Layero installs dependencies and builds the
project. Paths in the command are relative to it: `node server.js` starts
`/app/server.js`. The file in the command must exist **after** the build.

When the field is not set, Layero works the command out itself: for a Node
application that is usually `npm start` from `package.json`. No `start`
script — set `startCommand`.

The app must listen on `0.0.0.0` and on the port from `$PORT`, for example
`uvicorn main:app --host 0.0.0.0 --port $PORT`. A server on `127.0.0.1` is
unreachable from outside the container. An ASGI app needs `uvicorn`, not
`gunicorn app:app`.

### `port`

The port the app listens on, when it differs from the default: Node — 3000,
Next — 8080, Python — 8000, Streamlit — 8501, Gradio — 7860.

### `memory_mb`, `cpu_quota`, `idle_timeout_s`, `preload`

Container resources and the idle time after which the app goes to sleep.
`memory_mb` is the memory of the **running container**, not of the build: it
does not cure a build that runs out of memory.

### `env`

Non-secret variables for an app in a container — at build time and at run
time. A name set here overrides the project variable of the same name. A
static build does not read this field.

The file is committed to git — **secrets do not belong in it**. Secrets go
into the [project environment variables](./env-vars.md).

## Full-stack: frontend and backend in one repository

The frontend is served as files, the backend runs in a container, the API
lives under `/api`:

```json title="layero.json"
{
  "frontend": { "root": "frontend", "output": "dist" },
  "backend": { "root": "backend", "framework": "fastapi" },
  "apiPrefix": "/api"
}
```

- **Inside the halves, use the short names.** `frontend`: `root`, `framework`,
  `install`, `build`, `output`, `node`. `backend`: `root`, `framework`,
  `runtime`, `install`, `start`, `node`, `port`, `memory_mb`, `cpu_quota`,
  `idle_timeout_s`, `preload`, `env`. The long top-level names
  (`buildCommand`, `outputDirectory`, `startCommand`) do not work inside the
  blocks.
- **Both blocks are required.** One block alone does not switch the layout
  on — with or without `"layout": "fullstack"`.
- The backend usually needs only `root` and `framework` (`fastapi`, `express`,
  `django`…): for FastAPI, Flask, Django and Express the start command and the
  port are derived. Add `start` and `port` only when the launch fails.
- `root` is a folder that exists. A half that lives at the repository root
  gets an empty `root` or none at all. If the folder is missing, the build
  fails and the error lists the real folders — copy the path from there.
- `backend.runtime` does **not** choose the container type: the project
  setting does, and a mismatch is only reported in the log.
- **The `frontend` and `backend` blocks replace the full-stack settings from
  the dashboard entirely.** Blocks with invented keys (`dir`, `build_cmd`,
  `start_cmd`) switch those settings off and give nothing back: a project that
  was building stops building. If the project already builds from dashboard
  settings, do not add the blocks.

## Short names keep working

Six fields have a short form, and it is **not deprecated**: files written with
the short names will keep working forever.

| primary name | short name |
|---|---|
| `installCommand` | `install` |
| `buildCommand` | `build` |
| `outputDirectory` | `output` |
| `nodeVersion` | `node` |
| `startCommand` | `start` |
| `apiPrefix` | `api_prefix` |

If a file contains both names for the same field, the primary one is applied.
Layero reports the other one in the build log: otherwise you would be editing
the wrong line.

## Symptom → fix

Strings in monospace are what you will literally see in the deploy card, a CLI event
or the build log. First look at the stage that failed — it tells you where the
fix lives:

| Stage | Where the fix lives |
|---|---|
| `detect` | The shape of the app: root folder, project type, `runtime`. Not the code. |
| `install` | Lockfile and `packageManager` in the repository, then `installCommand`. |
| `build` | The error line from the log: usually code, sometimes `buildCommand` or `nodeVersion`. |
| `verify`, `upload` | `outputDirectory`. |
| `launch` | `startCommand`, `port`, environment variables. |
| `clone`, `timeout`, `activate` | Platform or source access. Retry once. |

### What the file fixes

| Symptom | Fix |
|---|---|
| `собранный сайт не содержит index.html в '.'` · `сборка отработала, но папки 'dist' нет. После сборки в каталоге есть: …` · `[output] в 'dist' нет index.html` | `outputDirectory` — the folder that holds `index.html` after the build. The error lists what is on disk — take the path from there. |
| The log says `static framework: skipping install/build`, and the output folder is missing although `buildCommand` and `outputDirectory` are correct | The build never ran: `framework: "static"` means "no install and no build". Use `"framework": "generic"`. The output path was never the problem. |
| `npm error Missing script: "build"` · `не знаем, чем собирать этот проект: команда сборки не задана` | `buildCommand` with a script that exists. No build needed at all — `"framework": "static"`. If it is a server or a bot — see the next row. |
| A Node or Python server is published as a static site: files are served, nothing runs | `runtime` + `startCommand`, plus `port` if needed. Without a file: `deploy -t node_web`. |
| `launch/boot: container failed to start in time`, with `ERR_MODULE_NOT_FOUND /app/…` in the log or the app listening on `127.0.0.1` | `startCommand`: a path relative to `/app`, a file that exists after the build, address `0.0.0.0`, port `$PORT`. A different port — `port`. |
| `ERR_UNKNOWN_BUILTIN_MODULE` · `EBADENGINE` · `Node.js 18 снят с поддержки и закрыт для новых сборок` | `"nodeVersion": "22"` — but look at the `[config] node=…` line first: if `.nvmrc` or `engines.node` sets the version, fix it there. |
| `npm error code EUSAGE` · `ERR_PNPM_…` | First the lockfile and `packageManager` in the repository, then `installCommand`. |
| `/bin/sh: 1: run: not found` | The command is a fragment. Write the whole command: `npm run build`, not `run build`. |
| `Can't resolve '@scope/shared'` in a workspace | Build root = workspace root, and a `buildCommand` that builds dependencies first: `pnpm --filter @scope/shared build && pnpm --filter @scope/web build`, plus `outputDirectory: "apps/web/dist"`. |
| Frontend and backend in one repository, but only a static site is published | The [`frontend` + `backend`](#full-stack-frontend-and-backend-in-one-repository) blocks. |

### What the file does not fix

| Symptom | What actually fixes it |
|---|---|
| Monorepo: `no app at the repo root, and multiple candidate app folders found (…)` · `root_directory not found in source` · `no package.json at the build root` | **The app root is a project setting, not a file key.** `npx layero@latest deploy --root apps/web` (saved on the project) or the app folder field in the dashboard. There is no `rootDirectory` key. |
| `branch 'cli' has no app to build: no package.json / layero.json / requirements.txt found at the deploy root` | `deploy` was run from the wrong folder. `cd` into the app or pass `--root`. Ready-made static output — `--prebuilt <dir>`. |
| Next.js: `"/app/.next/standalone": not found` · `project is configured for SSR, can't deploy as static` | The Next mode is set in **`next.config`**, not in the file: `output: 'export'` means static, no `output` means server. Never write `outputDirectory: ".next"`. |
| `error TS…` · `Type error:` · `Module not found: Can't resolve '@/…'` · `Failed to compile` | The code. Reproduce locally with the same command and the same Node major. A common cause is file-name case: macOS forgives it, Linux does not. |
| `launch/probe: container bound but not servable (5xx)` | Environment, database, code: `GET /` must answer without a 5xx. Variables go to the dashboard or `npx layero@latest env set`, not into the file. |
| `supabaseUrl is required` · `Failed to collect page data` | Build-time environment variables of the project. Secrets never go into the file. |
| `builder did not pick up the job after N retries` · `auth.docker.io … TLS handshake` | A platform failure. Retry **once**; if it repeats, contact support — do not touch the code or the file. |
| `docker-build: timeout after …s` · `Reached heap limit` · `ENOSPC` | Build limits of the plan. `memory_mb` is the memory of the container, not of the build. |
| `хост '…' не в списке разрешённых источников` | The source connection in the dashboard. |

## What beats what

For each field independently:

```
layero.json → project settings → CLI hint (--type) → found in the repository → framework default
```

The first one that is set wins. For example, with this `package.json`:

```json
{ "scripts": { "build": "vite build" } }
```

and this `layero.json`:

```json
{ "buildCommand": "npm run build:production" }
```

the build runs `npm run build:production`.

For `nodeVersion` the repository itself can declare a version too:

```
layero.json → project settings → .nvmrc → .node-version → engines.node → Layero default
```

When the file overrides a version from the repository, Layero names it in the
build log rather than applying it silently.

**File or project settings?** The file — when the value has to travel with the
code: into every branch and every clone. Project settings (`--type`, `--root`,
the dashboard) — for a one-off fix and for anything the file has no key for.

## How to verify in the log

There is no dry run: the only proof that Layero understood the project is the
log of a real build. After every change, find two things in it.

**1. The applied value, marked with its source.** A static build:

```
[config] framework=vite (from layero.json)
[config] build=`npm run build:production` (from layero.json)
[config] install=`pnpm install` (from layero.json)
[config] output=dist/client (from layero.json)
[config] node=22.18.0 (layero.json)
```

The Node line has no `from`. Any other source means your field was not
applied: `(from dashboard)`, `(from hint)`, `(auto-detected)`,
`(from package.json scripts)`, `(from lockfile)`, `(default for vite)`,
`(project settings)`, `(.nvmrc)`, `(engines.node)`, `(default)`.

A container build:

```
runtime build started (kind=node_web)
start command: node dist/server.js
env: 3 from project, 1 from layero.json
```

`start command` is printed without a source — compare the text with your
`startCommand`. Python also prints
`install command: … (источник: layero.json)`.

**2. No warnings from the file.** Any of these lines means the file did not do
what you think:

```
[config] layero.json: unknown keys ignored: …
[config] layero.json: invalid JSON at line N col N
[config] layero.json: `build` must be a non-empty string — ignored
[config] layero.json: `buildCommand` и `build` — одно и то же поле; применяется `buildCommand`
[config] WARNING: unknown framework '…' (layero.json). Known: …. Auto-detected as '…'.
layero.json requests runtime '…' while the project is set to '…' — the file wins
[config] в layero.json объявлен бэкенд «…», но проект настроен как «…» — собираем по настройке проекта
[config] layero.json: объявлен `layout: "fullstack"`, но `backend` не описан — раскладка не применится
[output] в '…' нет index.html. Платформа не подменяет заданный каталог
[config] предупреждение: `…` слушает только localhost — контейнер будет недоступен
Фронтенд указан в каталоге …, но такого каталога в репозитории нет
```

The last line (or the same one about the backend, `Бэкенд …`) fails the build.
The line `[config] node: layero.json перекрыл .nvmrc=…` is informational: the
version now has two sources.

Then check the result, not the build: open the address from the `ready` event.
A green build with a failed launch is still a failure. For an app in a
container the first request after `ready` may get a 404 placeholder for up to
a minute while the container starts; a 404 that outlives a minute is a real
failure — read `logs --runtime`.

## A field from the file is not editable in the dashboard

When a field is declared in `layero.json`, the dashboard shows its value and a
badge with the file name — instead of an edit button. Click the badge to open
the file in the repository.

This is deliberate. An editable field is a promise that your change will take
effect, and a change made in the dashboard would be undone by the very next
build: the file is stronger. Change such a value in the repository — where it
is set.

Such a field is not part of saving either: the dashboard will not write into
the project settings a value that would lose to the file anyway.

## Where the file goes

- **A regular project** — at the root of the repository.
- **A monorepo** — in the app folder, not at the repository root. If you set
  `apps/web` (with `--root` or in the project settings), Layero reads
  `apps/web/layero.json`. The exception is full-stack: the halves set their
  own folders with `frontend.root` and `backend.root`.

## Mistakes inside the file

Layero almost never refuses to build a project because of `layero.json`: only
a missing folder in `frontend.root` or `backend.root` fails the build. The flip
side: a mistake in the file does not stop the build, and it is easy to believe
the setting worked. Notes show up in the build log, in the setup wizard and on
the deploy page — but not all of them, and not always.

| what's in the file | what Layero does |
|---|---|
| invalid JSON (a trailing comma, a comment) | the file is disabled **entirely**, and the build proceeds as if there were no file. A static build prints a note, a container build prints nothing |
| an unknown field name | skips it with an `unknown keys ignored` note — and the build stays green. Lost unnoticed this way: `static`, `headers`, `type`, `dir`, `build_cmd`, `output_dir`, `start_cmd`, `install_cmd`, `rootDirectory` |
| an empty value | reports it, skips the field |
| an unknown name in `framework` (for example `"node"`) | warns and detects the framework itself |
| a `framework` that isn't in the repository | warns and applies it anyway |

Validate the JSON before committing. And five more mistakes Layero will most
often say nothing about:

1. **A questionnaire instead of a fix.** Every field filled with a default:
   `npm ci`, `npm run build`, `dist`. This is the most common file and the
   most useless one: it changes nothing but locks the fields in the dashboard.
2. **A locked wrong value.** `"output": "."` on a project that builds,
   `"output": ".next"`, `"install": "true"` — executed literally, nothing gets
   installed. Layero does what is written.
3. **`outputDirectory` on an app in a container** and **`startCommand` or
   `port` without `runtime`**: accepted, stored, never used — no warning.
4. **The `frontend` and `backend` blocks cancel the dashboard's full-stack
   settings** — even with invented keys inside. See
   [Full-stack](#full-stack-frontend-and-backend-in-one-repository).
5. **The file in the wrong folder** of a monorepo, and **secrets in `env`**.

## Schema URL

```
https://layero.ru/schema/layero-v2.json
```

The previous URL keeps working and will not be removed:

```
https://layero.ru/schema/layero-v1.json
```

If your repositories reference `v1`, there is no need to change it — the file
is read the same way. In new projects use `v2`: it describes the primary field
names, so your editor does not flag as an error something Layero accepts.
