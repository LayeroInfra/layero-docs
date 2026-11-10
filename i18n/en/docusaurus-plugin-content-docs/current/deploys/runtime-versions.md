---
sidebar_position: 9
title: Node.js and Python versions
description: Which versions are supported, how to pin one, and what happens when a version is retired.
---

# Node.js and Python versions

Layero picks the version to build and run your project on. If you need a
specific one, you can pin it.

## Supported versions

| Node.js | Status |
|---|---|
| 24 | supported |
| 22 | supported, **default** |
| 20 | supported |
| 18 | deprecated |

| Python | Status |
|---|---|
| 3.13 | supported |
| 3.12 | supported, **default** |
| 3.11 | supported |
| 3.10 | supported |

The version your project built on — and where it came from — appears in the
build log as `[config] node=22.18.0 (.nvmrc)`.

### Runtime version for server-rendered Next.js

A server-rendered (SSR) Next.js site runs on the version it was built on when
that version is Node.js 20, 22 or 24. Sites built on Node.js 18 run on
Node.js 22. The runtime version appears in the application logs in a
line ending with `Node.js 24`.

## Pinning a Node.js version

Listed in priority order; the first one found wins.

**1. Project settings** — **Project → Settings → Node.js version** (you can also
pick it while creating the project).

**2. `.nvmrc` in the repository root**

```
22
```

**3. `.node-version`** — same format.

**4. `engines.node` in `package.json`**

```json
{
  "engines": { "node": ">=22" }
}
```

The dashboard setting takes priority over repository files: it is the last place
where you tell the platform what you want, and that choice should not lose
silently to a file. If the version is set in both places we build on the one you
picked, and name the pin we overrode in the build log:

```
[config] node=24 (project settings); project setting overrode .nvmrc=22
```

Leave the setting on "Auto" if you want the repository to decide.

A major (`22`) is enough. We update the exact build within a major ourselves,
along with security updates.

## Pinning a Python version

**1. `runtime.txt`** (Heroku format):

```
python-3.12
```

**2. `.python-version`** — just `3.12`.

There is no dashboard setting for Python yet.

## If you pin an unsupported version

The build does not fail. We build on the default version and say so in the log:

```
[config] WARNING: Requested Node.js 16 is not supported (supported: 18, 20, 22, 24). Using 22.18.0.
```

This way a typo in `.nvmrc` does not block a deploy. Do read the warning
though: the default may differ from what you build on locally.

## Retiring versions

When a version reaches end of life upstream, we go through three steps:

1. **Warning** — in the build log and in the dashboard. Everything keeps working.
2. **Closed for new builds** — roughly 3–4 months later. A new deploy on that
   version will not start, and the error says what to change.
3. **Anything already deployed keeps running, always.** We never rebuild your
   site without you: static files sit in storage, application images are
   immutable.

We email you before a version closes.

**Node.js 18** is at step one. New builds on it close on **1 September 2026**.

:::tip[Worth upgrading early]
Node.js 18 genuinely cannot build a modern frontend any more — Vite, for
instance, fails with `ReferenceError: CustomEvent is not defined`, a function
added in Node 19. If your project is pinned to 18, moving to 22 usually needs
no code changes.
:::
