---
sidebar_position: 3
title: Supported frameworks
description: Vite, Next.js, Astro, CRA, Nuxt, SvelteKit, Gatsby — what Layero detects automatically and how to set the preset by hand.
---

# Supported frameworks

Layero detects the framework automatically from the contents of
`package.json`, the config files in the root and the lockfile. When
auto-detection gets it wrong, override the choice through
[`layero.json`](../deploys/layero-json), the `layero deploy --type` flag, or
the project settings in the dashboard.

## Auto-detection (static)

The order of checks matters — the first match wins:

| Framework | Signal | Output dir |
|---|---|---|
| **Next.js** (export) | dep `next` | `out` |
| **Nuxt** | dep `nuxt` | `.output/public` |
| **Remix / React Router v7** | dep `@remix-run/*` / `@react-router/*` | `build/client` |
| **SvelteKit** | dep `@sveltejs/kit` + `svelte.config.*` | `build` |
| **Gatsby** | dep `gatsby` | `public` |
| **Astro** | dep `astro` | `dist` |
| **Docusaurus** | dep `@docusaurus/core` | `build` |
| **Storybook** | dep `@storybook/*` | `storybook-static` |
| **VitePress** | dep `vitepress` | `.vitepress/dist` |
| **Vite** | dep `vite` | `dist` (or `outDir` from `vite.config`, if set) |
| **Angular** | dep `@angular/core` or `angular.json` | `dist/{project}/browser` |
| **Create React App** | dep `react-scripts` | `build` |
| **Eleventy (11ty)** | dep `@11ty/eleventy` or `eleventy.config.*` | `_site` |
| **Hugo** | `hugo.toml` or `config.toml` | `public` |
| **Static** | only HTML in the root, no `package.json`. **No build runs at all** | `.` |
| **Generic** | your own build script: no known framework, your `buildCommand` and `outputDirectory` are executed | `dist` |

The default build command is `npm run build` (or `yarn build` / `pnpm build`,
depending on the lockfile). Hugo is built with `hugo --gc --minify`, Nuxt with
`nuxt generate`.

## Setting the preset explicitly

Through the CLI:

```bash
layero deploy --type vite
```

Static presets of the flag: `vite`, `vitepress`, `next` (`nextjs`), `astro`,
`cra`, `sveltekit`, `nuxt`, `gatsby`, `docusaurus`, `storybook`, `eleventy`
(`11ty`), `hugo`, `static`, `generic`. The same flag accepts a runtime kind —
`node_web`, `python_web`, `ssr_next` — for apps that Layero runs rather than
serves as files; see [`layero deploy`](../cli/deploy.md). The other frameworks
from the table are set with the `framework` field in `layero.json`.

Through [`layero.json`](../deploys/layero-json) in the repository root:

```json
{
  "$schema": "https://layero.ru/schema/layero-v2.json",
  "framework": "vite",
  "buildCommand": "pnpm build:prod",
  "outputDirectory": "bundle"
}
```

Two values are easy to mix up:

- **`static` — no build runs at all.** No install and no build:
  `buildCommand` is ignored with it, and whatever sits in the root is
  published (minus the ignore rules). Handy for ready-made HTML.
- **`generic` — your own build script.** There is no known framework, but the
  project has to be built: Layero executes `buildCommand` and takes the result
  from `outputDirectory`.

```json title="layero.json — your own build script"
{ "framework": "generic", "buildCommand": "node build.mjs", "outputDirectory": "public" }
```

If the build log says `static framework: skipping install/build` and the site
is empty, the project needs `generic`, not a different output path. Since
18.09.2026 the platform says so itself: with `static` and a `buildCommand` in
`layero.json` the log shows `[config] ВНИМАНИЕ: buildCommand из layero.json …
НЕ выполняется` ("is NOT run"), and if the output is missing the failure starts
with «Сборка НЕ запускалась» ("the build did NOT run") and names the command
that was not run.

## Runtime applications

Next.js in server mode (without `output: 'export'`), Streamlit, Gradio, Flask
and the like run as containers — a separate mode, see
[Runtime](../runtime/overview).

## Node version

Sources, in priority order:

1. Project settings (**Project → Settings → Node.js version**)
2. `.nvmrc`
3. `.node-version`
4. `package.json` → `engines.node`
5. Node 22 by default

For overrides and version retirement, see
[Runtime versions](../deploys/runtime-versions).

## Package manager

Determined by the lockfile:

| Lockfile | Manager |
|---|---|
| `yarn.lock` | yarn |
| `pnpm-lock.yaml` | pnpm |
| `package-lock.json`, or none | npm |

:::caution[npm and optional dependencies]
If your `package-lock.json` was generated on macOS while the build environment
is Linux, `npm ci` can hang for a long time on platform-specific optional
dependencies. If you hit this, commit a lockfile generated on Linux, or switch
to pnpm or yarn.
:::
