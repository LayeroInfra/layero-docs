---
sidebar_position: 3
title: Поддерживаемые фреймворки
description: Vite, Next.js, Astro, CRA, Nuxt, SvelteKit, Gatsby — что Layero определяет автоматически и как задать пресет вручную.
---

# Поддерживаемые фреймворки

Layero определяет фреймворк автоматически по содержимому `package.json`,
конфиг-файлам в корне и lock-файлу. Если автодетект ошибся — переопределите
выбор через [`layero.json`](../deploys/layero-json), флаг
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
| **Static** | только HTML в корне, нет `package.json`. **Сборка не запускается вовсе** | `.` |
| **Generic** | свой build-скрипт: известного фреймворка нет, исполняются ваши `buildCommand` и `outputDirectory` | `dist` |

Команда сборки по умолчанию — `npm run build` (или `yarn build` /
`pnpm build` в зависимости от lock-файла). Для Hugo вызывается
`hugo --gc --minify`, для Nuxt — `nuxt generate`.

## Явный пресет

Через CLI:

```bash
layero deploy --type vite
```

Статические пресеты флага: `vite`, `vitepress`, `next` (`nextjs`), `astro`,
`cra`, `sveltekit`, `nuxt`, `gatsby`, `docusaurus`, `storybook`, `eleventy`
(`11ty`), `hugo`, `static`, `generic`. Тот же флаг принимает тип рантайма —
`node_web`, `python_web`, `ssr_next` — для приложений, которые Layero
запускает, а не раздаёт файлами; см. [`layero deploy`](../cli/deploy.md).
Остальные фреймворки из таблицы задаются полем `framework` в `layero.json`.

Через [`layero.json`](../deploys/layero-json) в корне репозитория:

```json
{
  "$schema": "https://layero.ru/schema/layero-v2.json",
  "framework": "vite",
  "buildCommand": "pnpm build:prod",
  "outputDirectory": "bundle"
}
```

Два значения легко перепутать:

- **`static` — сборка не запускается вовсе.** Ни установки, ни сборки:
  `buildCommand` с ним игнорируется, публикуется то, что лежит в корне (минус
  правила игнорирования). Удобно для готового HTML.
- **`generic` — свой build-скрипт.** Известного фреймворка нет, но проект
  надо собрать: Layero исполнит `buildCommand` и возьмёт результат из
  `outputDirectory`.

```json title="layero.json — свой скрипт сборки"
{ "framework": "generic", "buildCommand": "node build.mjs", "outputDirectory": "public" }
```

Если в логе сборки стоит `static framework: skipping install/build`, а сайт
пустой, — проекту нужен `generic`, а не другой путь к папке. С 18 сентября
2026 года платформа говорит это сама: если фреймворк — `static`, а в
`layero.json` задан `buildCommand`, в логе появляется `[config] ВНИМАНИЕ:
buildCommand из layero.json … НЕ выполняется`, а если результат не нашёлся,
отказ начинается словами «Сборка НЕ запускалась» и называет команду, которая
не выполнилась.

## Runtime-приложения

SSR Next.js (без `output: 'export'`), Streamlit, Gradio, Flask и т. п.
запускаются как контейнеры — это отдельный режим, см. [Runtime](../runtime/overview.md).

## Версия Node

Приоритет источников:

1. Настройка проекта (**Проект → Настройки → Версия Node.js**)
2. `.nvmrc`
3. `.node-version`
4. `package.json` → `engines.node`
5. По умолчанию — Node 22

Подробнее, включая перекрытия и снятие версий с поддержки, —
[Версии рантайма](../deploys/runtime-versions.md).

## Пакетный менеджер

Определяется по lock-файлу:

| Lock-файл | Менеджер |
|---|---|
| `yarn.lock` | yarn |
| `pnpm-lock.yaml` | pnpm |
| `package-lock.json` или ничего | npm |

:::caution[npm и optional dependencies]
Если ваш `package-lock.json` сгенерирован на macOS, а билд-окружение —
Linux, `npm ci` может надолго зависнуть на платформо-специфичных
optional-зависимостях. Если столкнулись — опубликуйте lockfile,
сгенерированный на Linux, либо переключитесь на pnpm/yarn.
:::
