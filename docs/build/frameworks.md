---
slug: /getting-started/frameworks
sidebar_position: 1
title: Фреймворки
description: Какие фреймворки Layero определяет сам и где ищет результат сборки, как отличает статический сайт от приложения с сервером, какой пакетный менеджер берёт и как задать фреймворк вручную.
---

# Фреймворки

**Layero сам определяет фреймворк по зависимостям в `package.json` и файлам
настроек, ставит зависимости и собирает проект.** Задавать ничего не нужно.
Если платформа ошиблась, поправьте одно поле в
[`layero.json`](./layero-json.md) или в настройках проекта.

Проверить, какой фреймворк определится, можно до публикации и без входа:

```bash
npx layero@latest deploy --dry-run
```

## Что Layero определяет сам

| Фреймворк | Признак | Папка с результатом |
|---|---|---|
| Next.js | зависимость `next` | `out`; с сервером — см. ниже |
| Nuxt | `nuxt` | `.output/public` |
| Remix, React Router 7 | `@remix-run/*`, `@react-router/*` | `build/client` |
| SvelteKit | `@sveltejs/kit` или `svelte.config.*` | `build` |
| Svelte без Kit | `svelte` | `public` |
| Astro | `astro` | `dist` или папка из настроек Astro |
| Gatsby | `gatsby` | `public` |
| Docusaurus | `@docusaurus/core` | `build` |
| VitePress | `vitepress` | `.vitepress/dist` |
| VuePress | `vuepress` | `docs/.vuepress/dist` |
| Storybook | `@storybook/*` | `storybook-static` |
| Vite | `vite` | `dist` или папка из `vite.config` |
| Angular | `@angular/core` или `angular.json` | папка из `angular.json` |
| Vue CLI | `@vue/cli-service` | `dist` |
| Create React App | `react-scripts` | `build` |
| Preact CLI | `preact-cli` | `build` |
| Eleventy | `@11ty/eleventy` или `eleventy.config.*` | `_site` |
| Hugo | `hugo.*` или `config.*` с настройками Hugo | `public` |
| Hexo | `hexo` | `public` |
| Parcel | `parcel` | `dist` |

Ещё определяются SolidStart, Analog, Hydrogen, RedwoodJS, Blitz, Gridsome,
Ember, Umi, Scully, TanStack Start и Vinxi. Если подходят несколько
признаков, побеждает установленный пакет, а не забытый в репозитории
файл настроек.

**Команда сборки** — скрипт `build` из `package.json` через пакетный
менеджер проекта: `npm run build`, `pnpm run build`, `yarn build`,
`bun run build`. У Hugo — `hugo --gc --minify` без установки зависимостей,
у Nuxt — скрипт `generate` или `nuxt generate`.

## Статический сайт или приложение с сервером

Большинство фреймворков после сборки дают файлы, и Layero раздаёт их как
статический сайт. Некоторые умеют работать и с сервером — тогда проект
запускается как [приложение с сервером](../runtime/overview.md):

- **Next.js** — сервер, если в `next.config` нет `output: 'export'`;
- **Remix и React Router 7** — сервер, если не задано `ssr: false`;
- **Nuxt, SvelteKit, Astro** — сервер, если подключён адаптер для Node:
  `@nuxtjs/node` или `nitropack`, `@sveltejs/adapter-node`, `@astrojs/node`;
- **TanStack Start, Vinxi** — всегда сервер.

Приложения на Node.js и Python без фреймворка из таблицы (Express, Fastify, FastAPI, Django, Flask, Streamlit, Gradio) тоже запускаются с сервером.

## Готовый HTML и свой скрипт сборки

Два особых значения поля `framework`, которые легко перепутать:

- **`static` — готовый HTML, сборка не запускается вовсе.** Так Layero
  поступает сам, если в проекте есть HTML-файлы, а зависимостей вроде
  `next`, `vite`, `astro`, `react-scripts` нет; `package.json` при этом может
  быть. Публикуется то, что лежит в папке.
- **`generic` — свой скрипт сборки.** Фреймворк не определился, но проект
  нужно собрать: Layero запустит скрипт `build` или команду из
  `buildCommand` и возьмёт результат из `outputDirectory`. Если команды нет ни там, ни там, сборка остановится с ошибкой и объяснит почему.

```json title="layero.json — свой скрипт сборки"
{ "framework": "generic", "buildCommand": "node build.mjs", "outputDirectory": "public" }
```

Если в логе стоит `static framework: skipping install/build`, а сайт
пустой, проекту нужен `generic`, а не другой путь к папке. Если в `layero.json` задан `buildCommand` при фреймворке `static`, лог предупредит строкой `[config] ВНИМАНИЕ: buildCommand из layero.json … НЕ выполняется`. Когда после такой «сборки» не нашлось результата, ошибка начнётся словами «сборка НЕ запускалась».

Проекты на Java, Go, Rust и других языках, которые Layero не запускает
(в корне `pom.xml`, `go.mod`, `Cargo.toml`), получают отказ ещё до
установки зависимостей.

## Пакетный менеджер

Определяется по lock-файлу:

| Lock-файл | Менеджер |
|---|---|
| `bun.lockb` или `bun.lock` | bun |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `package-lock.json`, `npm-shrinkwrap.json` или ничего | npm |

Поле `packageManager` в `package.json` тоже учитывается. С lock-файлом
зависимости ставятся строго по нему (`npm ci`, `--frozen-lockfile`).

К команде установки, даже заданной вами, платформа добавляет свои флаги,
например `--ignore-scripts`. Команду из нескольких частей (с `&&`, `;`
или `|`) она оставляет как есть.

## Задать фреймворк вручную

В [`layero.json`](./layero-json.md) в корне репозитория:

```json
{
  "$schema": "https://layero.ru/schema/layero-v2.json",
  "framework": "vite",
  "buildCommand": "pnpm run build:prod",
  "outputDirectory": "bundle"
}
```

Или флагом CLI — значение запомнится в настройках проекта:

```bash
npx layero@latest deploy --type vite
```

Флаг принимает `vite`, `next`, `astro`, `cra`, `sveltekit`, `svelte`,
`nuxt`, `gatsby`, `docusaurus`, `vitepress`, `storybook`, `eleventy`,
`hugo`, `static`, `generic`, а для приложений с сервером — `node_web`,
`python_web`, `ssr_next`, `flask`, `streamlit`, `gradio`. Остальные
фреймворки из таблицы задаются полем `framework` в `layero.json`.

Что сильнее чего: `layero.json` важнее настроек проекта, настройки —
важнее того, что определила платформа. Заданное значение применяется как есть, даже если оно неверное.

## Версия Node.js

Layero собирает на Node.js 22, если версия нигде не задана. Закрепить
другую можно в `layero.json`, в настройках проекта, файлами `.nvmrc`
и `.node-version` или полем `engines.node` — именно в таком порядке
старшинства. Подробно — [«Версии Node.js и Python»](./runtime-versions.md).
