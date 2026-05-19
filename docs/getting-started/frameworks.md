---
sidebar_position: 3
title: Поддерживаемые фреймворки
description: Vite, Next.js, Astro, CRA, Nuxt, SvelteKit, Gatsby — что Layero определяет автоматически и как задать пресет вручную.
---

# Поддерживаемые фреймворки

Layero определяет фреймворк автоматически по содержимому `package.json`,
конфиг-файлам в корне и lock-файлу. Если автодетект ошибся — переопределите
выбор через [`layero.json`](../deploys/layero-json.md), флаг
`layero deploy --type` или настройки проекта в панели.

## Автодетект (статика)

Порядок проверки важен — побеждает первый совпавший:

| Фреймворк | Признак | Output dir |
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
| **Vite** | dep `vite` | `dist` (из `vite.config` — если есть `outDir`, оттуда) |
| **Angular** | dep `@angular/core` или `angular.json` | `dist/{project}/browser` |
| **Create React App** | dep `react-scripts` | `build` |
| **Eleventy (11ty)** | dep `@11ty/eleventy` или `eleventy.config.*` | `_site` |
| **Hugo** | `hugo.toml` или `config.toml` | `public` |
| **Static** | только HTML в корне, нет `package.json` | `.` |
| **Generic** | fallback (Manual Mode) | `dist` |

Команда сборки по умолчанию — `npm run build` (или `yarn build` /
`pnpm build` в зависимости от lock-файла). Для Hugo вызывается
`hugo --gc --minify`, для Nuxt — `nuxt generate`.

## Явный пресет

Через CLI:

```bash
layero deploy --type vite
```

Доступные значения: `nextjs`, `nuxt`, `remix`, `sveltekit`, `gatsby`,
`astro`, `docusaurus`, `storybook`, `vitepress`, `vite`, `angular`,
`cra`, `eleventy`, `hugo`, `static`, `generic`. Принимаются также
популярные алиасы — `next`, `react-router`, `rr7`, `ng`, `11ty`.

Через [`layero.json`](../deploys/layero-json.md) в корне репозитория:

```json
{
  "$schema": "https://layero.ru/schema/layero-v1.json",
  "framework": "vite",
  "build": "pnpm build:prod",
  "output": "bundle"
}
```

`static` — без сборки, в S3 уезжает то, что лежит в корне (минус
правила игнорирования). Удобно для готового HTML.

## Runtime-приложения

SSR Next.js (без `output: 'export'`), Streamlit, Gradio, Flask и т. п.
запускаются как контейнеры — это отдельный режим, см. [Runtime](../runtime/overview.md).

## Версия Node

Приоритет источников:

1. `.nvmrc`
2. `.node-version`
3. `package.json` → `engines.node`
4. По умолчанию — Node 20

## Пакетный менеджер

Определяется по lock-файлу:

| Lock-файл | Менеджер |
|---|---|
| `yarn.lock` | yarn |
| `pnpm-lock.yaml` | pnpm |
| `package-lock.json` или ничего | npm |

:::caution npm и optional dependencies
Если ваш `package-lock.json` сгенерирован на macOS, а билд-окружение —
Linux, `npm ci` может надолго зависнуть на платформо-специфичных
optional-зависимостях. Если столкнулись — опубликуйте lockfile,
сгенерированный на Linux, либо переключитесь на pnpm/yarn.
:::
