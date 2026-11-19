---
slug: /deploys/runtime-versions
sidebar_position: 3
title: Node.js and Python versions
description: Which Node.js and Python versions Layero supports, which one is the default, how to pin your own and what happens if you set an unsupported one.
---

# Node.js and Python versions

**Layero builds on Node.js 22 and Python 3.12 unless a version is set
somewhere.** Need another one — pin it in the repository; the Node.js version can also be set in the project settings.

## Supported versions

| Node.js | Status |
|---|---|
| 24 | supported |
| 22 | supported, **default** |
| 20 | supported |
| 18 | deprecated, builds still work |

| Python | Status |
|---|---|
| 3.13 | supported |
| 3.12 | supported, **default** |
| 3.11 | supported |
| 3.10 | supported |

The version the project was built on, and where it came from, are shown in
the build log:

```
[config] node=22.18.0 (.nvmrc)
```

A Next.js site with server rendering runs on the version it was built on if
that's Node.js 20, 22 or 24. One built on Node.js 18 runs on Node.js 22.

## Pinning the Node.js version

The first source found wins, in this order:

1. **`nodeVersion` in [`layero.json`](./layero-json.md):**

   ```json
   { "nodeVersion": "22" }
   ```

2. **The project setting** — project → «Настройки» (Settings) → «Версия
   Node.js» (Node.js version). It can also be chosen when creating the
   project.
3. **A `.nvmrc` file** at the repository root — for example, `22`.
4. **A `.node-version` file** — the same format.
5. **The `engines.node` field** in `package.json`:

   ```json
   { "engines": { "node": ">=22" } }
   ```

If the version is set in several places, the log names the one that lost:

```
[config] node=24.18.0 (project settings)
[config] node: project settings перекрыл .nvmrc=22
```

(«перекрыл» means "overrode".) If you want the repository to decide the
version, leave the project setting on «Авто» (Auto).

Only the major version counts: `"22"` and `"22.14.0"` give the same Node.js
22 build, and we apply security fixes within it ourselves. Words like
`"lts"` don't work: they contain no version number, and the build falls
back to the default.

## Pinning the Python version

The first file found wins:

1. **A `runtime.txt` file**, for example `python-3.12`.
2. **A `.python-version` file**, for example `3.12`.

`requires-python` in `pyproject.toml` isn't read. There's no Python setting
in the dashboard or in `layero.json`.

## If the version isn't supported

The build doesn't fail: Layero builds on the default version and says so in
the log:

```
[config] WARNING: Requested Node.js 16 is not supported (supported: 18, 20, 22, 24). Using 22.18.0.
```

This way a typo in `.nvmrc` doesn't block publishing. But do check the
warning: the default version may differ from the one you build on locally.

## When a version is retired

1. **A warning** in the build log and in the dashboard. Everything keeps
   working.
2. **Closed for new builds.** A new build on that version won't start, and the error says what to fix. We'll tell you about it by email.

What's already published keeps working: we never rebuild your site without you.

Node.js 18 is at step one: builds on it work, and no closing date has been
set yet.

:::tip[Upgrade early]
Modern frontends often no longer build on Node.js 18. For example, Vite
fails with `ReferenceError: CustomEvent is not defined`. Moving to Node.js
22 usually needs no code changes.
:::
