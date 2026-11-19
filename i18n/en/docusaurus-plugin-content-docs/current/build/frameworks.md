---
slug: /getting-started/frameworks
sidebar_position: 1
title: Frameworks
description: Which frameworks Layero detects by itself and where it takes the build output from, how it tells a static site from an app with a server, which package manager it uses and how to set the framework by hand.
---

# Frameworks

**Layero detects the framework from the dependencies in `package.json` and
from config files, installs dependencies and builds the project by itself.**
There's nothing to set up. If the platform guessed wrong, fix one field in
[`layero.json`](./layero-json.md) or in the project settings.

You can check what will be detected before publishing, without signing in:

```bash
npx layero@latest deploy --dry-run
```

## What Layero detects

| Framework | Marker | Output folder |
|---|---|---|
| Next.js | the `next` dependency | `out` (static) or an app with a server |
| Nuxt | `nuxt` | `.output/public` |
| Remix, React Router 7 | `@remix-run/*`, `@react-router/*` | `build/client` |
| SvelteKit | `@sveltejs/kit` or `svelte.config.*` | `build` |
| Svelte without Kit | `svelte` | `public` |
| Astro | `astro` | `dist` or the folder from the Astro config |
| Gatsby | `gatsby` | `public` |
| Docusaurus | `@docusaurus/core` | `build` |
| VitePress | `vitepress` | `.vitepress/dist` |
| VuePress | `vuepress` | `docs/.vuepress/dist` |
| Storybook | `@storybook/*` | `storybook-static` |
| Vite | `vite` | `dist` or the folder from `vite.config` |
| Angular | `@angular/core` or `angular.json` | the folder from `angular.json` |
| Vue CLI | `@vue/cli-service` | `dist` |
| Create React App | `react-scripts` | `build` |
| Preact CLI | `preact-cli` | `build` |
| Eleventy | `@11ty/eleventy` or `eleventy.config.*` | `_site` |
| Hugo | `hugo.*` or a `config.*` with Hugo settings | `public` |
| Hexo | `hexo` | `public` |
| Parcel | `parcel` | `dist` |

SolidStart, Analog, Hydrogen, RedwoodJS, Blitz, Gridsome, Ember, Umi, Scully,
TanStack Start and Vinxi are detected too. When several markers match, an
installed package wins over a config file left behind in the repository.

**The build command** is the `build` script from `package.json`, run through
the project's package manager: `npm run build`, `pnpm run build`,
`yarn build`, `bun run build`. Hugo runs `hugo --gc --minify` without
installing dependencies, Nuxt runs the `generate` script or `nuxt generate`.

## Static site or app with a server

Most frameworks produce files, and Layero serves them as a static site. Some
can also work with a server — then the project runs as an
[app with a server](../runtime/overview.md):

- **Next.js** — a server unless `next.config` has `output: 'export'`;
- **Remix and React Router 7** — a server unless `ssr: false` is set;
- **Nuxt, SvelteKit, Astro** — a server if a Node adapter is installed:
  `@nuxtjs/node` or `nitropack`, `@sveltejs/adapter-node`, `@astrojs/node`;
- **TanStack Start, Vinxi** — always a server.

Node.js and Python servers without a framework from the table (Express,
Fastify, FastAPI, Django, Flask, Streamlit, Gradio) also run as apps with a
server.

## Ready-made HTML and your own build script

Two special values that are easy to mix up:

- **`static` — ready-made HTML, no build at all.** Layero picks it by itself
  when the project has HTML files and no dependencies like `next`, `vite`,
  `astro`, `react-scripts`; a `package.json` may be present. What's in the
  folder is published.
- **`generic` — your own build script.** No framework was detected, but the
  project needs building: Layero runs the `build` script or the command from
  `buildCommand` and takes the result from `outputDirectory`. If there's no
  command in either place, the build refuses and says why instead of
  guessing.

```json title="layero.json — your own build script"
{ "framework": "generic", "buildCommand": "node build.mjs", "outputDirectory": "public" }
```

If the log says `static framework: skipping install/build` and the site is
empty, the project needs `generic`, not a different folder path. If `layero.json` sets `buildCommand` with the `static` framework, the log warns with `[config] ВНИМАНИЕ: buildCommand из layero.json … НЕ выполняется` ("buildCommand from layero.json is NOT run"). When no output is found after such a "build", the error starts with «сборка НЕ запускалась» ("the build did NOT run").

Projects in Java, Go, Rust and other languages Layero doesn't run (with
`pom.xml`, `go.mod`, `Cargo.toml` at the root) are refused before
dependencies are installed.

## Package manager

Detected by the lock file:

| Lock file | Manager |
|---|---|
| `bun.lockb` or `bun.lock` | bun |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `package-lock.json`, `npm-shrinkwrap.json` or none | npm |

The `packageManager` field in `package.json` is honoured too. With a lock
file, dependencies are installed strictly from it (`npm ci`,
`--frozen-lockfile`).

The platform appends its own flags, such as `--ignore-scripts`, to the
install command, even one you set. A command made of several parts (with
`&&`, `;` or `|`) is left as it is.

## Setting the framework by hand

In [`layero.json`](./layero-json.md) at the repository root:

```json
{
  "$schema": "https://layero.ru/schema/layero-v2.json",
  "framework": "vite",
  "buildCommand": "pnpm run build:prod",
  "outputDirectory": "bundle"
}
```

Or with a CLI flag — the value is saved in the project settings:

```bash
npx layero@latest deploy --type vite
```

The flag takes `vite`, `next`, `astro`, `cra`, `sveltekit`, `svelte`,
`nuxt`, `gatsby`, `docusaurus`, `vitepress`, `storybook`, `eleventy`,
`hugo`, `static`, `generic`, and for apps with a server `node_web`,
`python_web`, `ssr_next`, `flask`, `streamlit`, `gradio`. The other
frameworks in the table are set with the `framework` field in `layero.json`.

What wins: `layero.json` beats the project settings, and the settings beat
what the platform detected. A value you set runs exactly as written, even
if it's wrong.

## Node.js version

Layero builds on Node.js 22 unless a version is set somewhere. You can pin
another one in `layero.json`, in the project settings, with `.nvmrc` and
`.node-version` files or with the `engines.node` field — in that order of
precedence. Details — [Node.js and Python versions](./runtime-versions.md).
