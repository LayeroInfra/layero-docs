---
sidebar_position: 3
title: layero deploy
description: Что делает layero deploy, какие у него флаги, как работают авто-детект, .layeroignore и лимиты архива.
---

# `layero deploy`

Упаковывает cwd и публикует его как новый деплой проекта. **Git и GitHub не требуются** — CLI заливает локальную директорию напрямую.

## Базовое использование

```bash
cd my-site
npx layero deploy
```

Что происходит:

1. CLI авто-детектит фреймворк (`package.json`, конфиги типа `vite.config.ts`/`next.config.js`) — заполняет `framework_hint` / `build_cmd` / `output_dir` если они ещё не заданы в `.layero/project.json`.
2. Обходит cwd, применяет правила игнорирования (см. ниже), пакует в tar.gz во временной директории и считает sha256 на лету.
3. Архив заливается в Yandex Object Storage по presigned URL.
4. Бэкенд создаёт деплой и запускает сборку.
5. CLI поллит логи деплоя (`/deploys/{id}/logs`) до статуса `ready` или `failed`, выводя их в терминал.
6. По окончании печатается ссылка — preview или production URL.

Первый `layero deploy` в новой папке создаст проект и запишет `./.layero/project.json`. Последующие запуски используют тот же проект — никакого визарда в браузере, никакой ручной привязки.

## Авто-детект фреймворка

CLI читает `package.json` и характерные конфиги:

| Сигнал | Фреймворк | `build_cmd` | `output_dir` |
|---|---|---|---|
| `next` в deps / `next.config.*` | nextjs | `npm run build` (или `npx next build`) | `out` |
| `nuxt` в deps / `nuxt.config.*` | nuxt | `npm run generate` если есть, иначе `npm run build` | `.output/public` |
| `@sveltejs/kit` / `svelte.config.js` | sveltekit | `npm run build` | `build` |
| `gatsby` в deps | gatsby | `npm run build` | `public` |
| `astro` в deps / `astro.config.*` | astro | `npm run build` | `dist` |
| `@docusaurus/core` / `docusaurus.config.*` | docusaurus | `npm run build` | `build` |
| `vite` в deps / `vite.config.*` | vite | `npm run build` | `dist` |
| `react-scripts` в deps | cra | `npm run build` | `build` |
| `.html` в корне, нет `package.json` | static | `true` (no-op) | `.` |

Если детект ошибся — отредактируйте `.layero/project.json` вручную или передайте `--type` явно.

Эти значения хранятся в `.layero/project.json` после первого деплоя. Они переживают повторные запуски и редактируются вручную.

## Флаги

| Флаг | Описание |
|---|---|
| `--prod` | Деплой приземляется в default-ветку проекта (то же что push в main). Если у проекта включён auto-promote — apex переключится на свежий билд автоматически. |
| `--promote` | После успешного билда **сразу** двигает `production_deploy_id` на этот деплой. Работает для любой ветки — удобно чтобы выкатить feature-ветку в production одной командой. |
| `--branch <name>` | Деплой в конкретную ветку (создаст окружение, если не было). Без флага CLI кладёт в псевдо-ветку `cli`. |
| `--type <preset>` | Оверрайд авто-детекта: `vite`, `next`, `astro`, `cra`, `sveltekit`, `nuxt`, `gatsby`, `docusaurus`, `static`. |
| `--name <name>` | Имя проекта. Только при первом деплое. |
| `--project <id_or_slug>` | Деплоить в конкретный проект, игнорируя `./.layero/project.json`. Удобно для CI. |
| `--org <slug>` | Создать проект в указанной Layero-организации (при первом деплое). |
| `--yes`, `-y` | Пропустить подтверждение `--prod` / `--promote` и интерактивные вопросы. |
| `--json` | JSON-lines на stdout (для AI-агентов и CI). |
| `--config` | Legacy alias текущего поведения (авто-детект + `.layero/project.json`). |

## Куда приземляется деплой

```bash
# CLI-проект (без подключённого репозитория): публикуется в apex АВТОМАТИЧЕСКИ.
# Прямые загрузки авто-промоутятся — отдельный --prod / promote не нужен.
npx layero deploy
# → https://<org>-<project>.layero.ru   (apex — живой публичный адрес)
#   + per-deploy preview https://<org>-<project>-cli-<sha>.preview.layero.ru,
#     доступен сразу (мимо CDN), пока apex прогревается на ПЕРВОМ деплое

# изолированный preview на конкретную ветку — НЕ трогает apex
npx layero deploy --branch=staging
# → https://<org>-<project>-staging.preview.layero.ru   (24 ч TTL)

# выкатить из любой ветки сразу в production одной командой
# (промоут идёт сразу после успешного билда, без полной поездки CI)
npx layero deploy --branch=staging --promote
# → apex: https://<org>-<project>.layero.ru теперь отдаёт этот деплой

# CI-режим: без подтверждения
npx layero deploy --prod --yes
```

**Для CLI-проекта (без репозитория)** каждый `layero deploy` заменяет то, что
отдаёт apex — это и есть публикация. На первом деплое apex прогревается на YC CDN
несколько минут (выпуск per-host LE-сертификата + пропагация); пока `edge_ready`
в событии `ready` равен `false`, шерьте `preview_url` — он доступен сразу.

**Чем `--prod` отличается от `--promote`** (актуально для git-проектов; для прямых
CLI-загрузок apex двигается и так):

- `--prod` = «положи на default-ветку». Дальше за apex отвечает либо auto-promote (если включён в Settings), либо ваш ручной клик «Promote».
- `--promote` = «после того как соберётся, переведи apex на этот деплой». Работает для любой ветки — короткий путь «hot-fix из feature-ветки → production».

**Как получить изолированный preview, не трогая apex:** деплойте в именованную
ветку — `layero deploy --branch=<name>`. Такой деплой живёт на своём
preview-URL (24 ч TTL) и production не затрагивает.

## Mixed-mode: GitHub + CLI на одном проекте

Один и тот же проект может одновременно принимать:

* **push в GitHub** → автоматический деплой (webhook)
* **`layero deploy`** → CLI-загрузка тарбола

GitHub-интеграция — необязательна. Первый деплой через CLI **не требует** ни git-репозитория, ни GitHub-аккаунта. Подключить GitHub можно потом, через дашборд, если захочется auto-deploy on push.

Mixed-mode удобен, когда:

* GitHub-build долгий или нестабильный, и нужен быстрый локальный hot-fix: `layero deploy --prod --yes` поднимет ваш локальный код в production за секунды без коммита.
* В CI после успешного теста хочется явно зафиксировать релиз: `layero deploy --prod --yes` после `git push`.

Артефакты в дашборде помечаются источником:

| Бейдж | Что значит |
|---|---|
| `push` | Webhook от GitHub push |
| `cli` | Загружен через `layero deploy` |
| `manual` | Запущен через дашборд (Redeploy) |

Пример CI-сборки:

```bash
LAYERO_TOKEN=$LAYERO_DEPLOY_TOKEN npx layero deploy --prod --yes \
  --project alice-my-site
```

## JSON-режим для агентов и CI

Любая команда CLI поддерживает `--json` (или `LAYERO_JSON=1`):

```bash
npx layero deploy --json
```

Каждая строка stdout — JSON-объект с полем `event`:

```jsonl
{"event":"detected","framework":"vite","build_cmd":"npm run build","output_dir":"dist","confident":true}
{"event":"project_created","project_id":"...","slug":"my-site","organization":"alice"}
{"event":"packing","files":124,"bytes":2401234,"sha256":"..."}
{"event":"uploading"}
{"event":"deploy_started","deploy_id":"..."}
{"event":"build_log","line":"...","stream":"stdout"}
{"event":"ready","url":"https://alice-my-site.layero.ru/","preview_url":"https://alice-my-site-cli-3dc414d.preview.layero.ru/","dashboard_url":"https://app.layero.ru/projects/...","edge_ready":false,"edge_eta_seconds":592,"deploy_id":"..."}
```

`url` — живой публичный сайт (apex), `preview_url` — доступен сразу, пока
`edge_ready=false`. `dashboard_url` — страница управления, НЕ сам сайт.

Ошибки приходят со стабильным `code` и `next_action`:

```json
{"event":"error","code":"cli_deploys_disabled","next_action":"enable them in project settings","message":"CLI deploys are disabled on project \"my-site\""}
```

> Не залогинены? `layero deploy` сам запустит device-flow (событие `auth_required` → клик по ссылке → poll), отдельный `layero login` не нужен.

В событии `ready`: `url` — **живой публичный сайт**. Для CLI-проекта это apex `https://<org>-<project>.layero.ru` (прямые загрузки авто-промоутятся); для деплоя в именованную ветку — preview-форма. `preview_url` — per-deploy preview (`*.preview.layero.ru`), отдаётся мимо CDN и доступен **сразу**; шерьте его, пока `edge_ready=false` (apex прогревается на первом деплое, `edge_eta_seconds` — оценка остатка). `dashboard_url` — страница управления, **не** сам сайт.

JSON-режим включается автоматически когда CLI запущен внутри Cursor / Claude Code / любого процесса с не-TTY stdout. Подробнее — [Деплой из AI-агентов](./agents.md), полный список событий — [JSON-events схема](./json-events.md).

## Правила игнорирования

CLI уважает:

- `.gitignore` (как git)
- `.layeroignore` (тот же синтаксис, можно расширять/исключать)
- встроенный denylist:
  ```
  node_modules
  .git
  dist
  build
  .next
  .env*
  .DS_Store
  ```

:::tip
Артефакты сборки (`dist`, `build`, `.next`) **не нужно** заливать — сборка запускается на стороне Layero после распаковки.
:::

## Лимиты

- Максимальный размер архива — **200 MB**.
- Время `layero deploy` ограничено таймаутами на бэкенде:
  | Стадия | Лимит |
  |---|---|
  | clone / unpack | 15 мин |
  | install | 30 мин |
  | build | 15 мин |
  | upload в S3 | 10 мин |

Если ваш билд не укладывается — напишите в поддержку, лимиты повышаются индивидуально.

## Окружение сборки

Каждая сборка запускается в **изолированной песочнице** на выделенной builder-VM:

- **CPU / память**: 2 vCPU, 4 GB RAM, swap до 4 GB, лимит процессов — 1024.
- **Диск**: writable scratch (`/mnt/scratch`, ~40 GB на одну сборку), tmpfs `/tmp` 256 MB. Кэши `npm`/`yarn`/`pnpm` автоматически перенаправляются на scratch — большие бинарники (`rolldown`, `swc`, `sharp`) скачиваются без ENOSPC.
- **Сеть**: разрешён исходящий HTTPS к npm-зеркалу, GitHub, реестрам пакетов (npm, yarn) и S3. Произвольные внешние эндпоинты с этапа сборки недоступны — это защищает чужие билды от случайного или вредоносного трафика. Если вашему билду нужен доступ к закрытому реестру или CDN, напишите в поддержку.
- **Изоляция**: gVisor (`runsc`) + seccomp + drop-all capabilities + read-only rootfs. Сборки разных проектов не видят друг друга и не имеют доступа к инфраструктуре Layero.

Среда не персистентна между билдами: всё, что вы записали в `/tmp` или `/mnt/scratch`, исчезает после завершения. Артефакты в `output_dir` (`dist` по умолчанию) загружаются в S3 и попадают в CDN.

## После деплоя

После `ready`:

- **Preview-URL** `https://<org>-<project>-<...>.preview.layero.ru` доступен через ~30 сек, отдаётся мимо CDN, работает 24 часа.
- **Apex** `https://<org>-<project>.layero.ru` отдаёт этот деплой, если он стал production: для CLI-проекта (без репозитория) это происходит автоматически на каждом `layero deploy`; для git-проекта — через auto-promote default-ветки или `--promote`. Деплой в именованную `--branch` остаётся preview и apex не трогает.

См. [Окружения, preview и production](../deploys/environments.md) для полной картины.

## Postinstall-баннер

После `npm install -g layero` или `npm install -D layero` (без `--silent`) CLI пишет краткий quick-start в `/dev/tty`. В CI-окружениях баннер подавляется автоматически (`CI=1`). Чтобы выключить вручную:

```bash
LAYERO_SKIP_POSTINSTALL=1 npm install -D layero
```
