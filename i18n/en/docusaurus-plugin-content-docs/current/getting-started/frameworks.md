---
sidebar_position: 3
title: Поддерживаемые фреймворки
description: Vite, Next.js, Astro, CRA, Nuxt, SvelteKit, Gatsby — что Layero определяет автоматически и как задать пресет вручную.
---

# Поддерживаемые фреймворки

Layero определяет фреймворк автоматически по содержимому `package.json`.
Если автодетект ошибся — задайте пресет явно через флаг `layero deploy --type`
или в настройках проекта в панели.

## Автодетект (статика)

Порядок проверки важен — побеждает первый совпавший:

| Фреймворк | Признак | Output dir |
|---|---|---|
| **Next.js (export)** | dep `next` без `react-scripts` | `out` |
| **Create React App** | dep `react-scripts` | `build` |
| **Vite** | dep `vite` | `dist` |
| **Astro** | dep `astro` | `dist` |
| **Nuxt** | dep `nuxt` | `.output/public` |
| **SvelteKit** | dep `@sveltejs/kit` | `build` |
| **Gatsby** | dep `gatsby` | `public` |
| **Generic** | fallback | `dist` |

Команда сборки по умолчанию — `npm run build` (или `yarn build` /
`pnpm build` в зависимости от lock-файла).

## Явный пресет

Через CLI:

```bash
layero deploy --type vite
```

Доступные значения: `vite`, `next`, `astro`, `cra`, `sveltekit`,
`nuxt`, `gatsby`, `static`.

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
