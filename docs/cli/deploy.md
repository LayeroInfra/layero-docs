---
sidebar_position: 3
title: layero deploy
description: Что делает layero deploy, какие у него флаги, как работают .layeroignore и лимиты архива.
---

# `layero deploy`

Упаковывает cwd и публикует его как новый деплой проекта.

## Базовое использование

```bash
cd my-site
layero deploy
```

Что происходит:

1. CLI обходит cwd, применяет правила игнорирования (см. ниже),
   пакует в tar.gz во временной директории и считает sha256 на лету.
2. Архив заливается в Yandex Object Storage по presigned URL.
3. Бэкенд создаёт деплой и запускает сборку.
4. CLI поллит логи деплоя (`/deploys/{id}/logs`) до статуса
   `ready` или `failed`, выводя их в терминал.
5. По окончании печатается ссылка на дашборд проекта.

Первый `layero deploy` в новой папке создаст проект и запишет
`./.layero/project.json`. Последующие запуски используют тот же проект.

## Флаги

| Флаг | Описание |
|---|---|
| `--prod` | Задеплоить в production (apex-домен). Без флага — preview. |
| `--branch <name>` | Задеплоить в конкретную ветку. Имеет приоритет над `--prod`. |
| `--type <preset>` | Пресет фреймворка: `vite`, `next`, `astro`, `cra`, `sveltekit`, `nuxt`, `gatsby`, `static`. См. [Фреймворки](../getting-started/frameworks.md). |
| `--name <name>` | Имя проекта. Только при первом деплое. |
| `--project <id_or_slug>` | Деплоить в конкретный проект, игнорируя `./.layero/project.json`. Удобно для CI. |
| `--config` | Прогнать setup из `./.layero/project.json` без браузера (CI-friendly). |
| `--yes`, `-y` | Пропустить подтверждение `--prod` и интерактивные вопросы. |

## Куда приземляется деплой

CLI разделяет **preview** и **production** — по образцу Vercel:

```bash
# preview на CLI-pseudo-ветку, отдельный hostname
# никогда не перетирает production
layero deploy
# → https://<org>-<project>-cli.layero.ru

# preview на конкретную ветку (создаст environment если её нет)
layero deploy --branch=staging
# → https://<org>-<project>-staging.layero.ru

# production: apex-домен, нужно подтверждение
layero deploy --prod
# → https://<org>-<project>.layero.ru
# CLI спросит: deploy to production? [y/N]

# CI-режим: без подтверждения
layero deploy --prod --yes
```

**Зачем псевдо-ветка `cli`:** локальные эксперименты не должны случайно
заменить production. По умолчанию `layero deploy` приземляется на
изолированный hostname `<org>-<project>-cli.layero.ru`. Чтобы пропихнуть
в production, нужно явное `--prod`.

## Mixed-mode: GitHub + CLI на одном проекте

Один и тот же проект может одновременно принимать:

* **push в GitHub** → автоматический деплой (webhook)
* **`layero deploy`** → CLI-загрузка тарбола

Это удобно когда:

* GitHub-build долгий или нестабильный, и нужен быстрый локальный hot-fix:
  `layero deploy --prod --yes` поднимет ваш локальный код в production
  за секунды без коммита.
* В CI после успешного теста хочется явно зафиксировать релиз:
  `layero deploy --prod --yes` после `git push`.

Артефакты в дашборде помечаются источником:

| Бейдж | Что значит |
|---|---|
| `push` | Webhook от GitHub push |
| `cli` | Загружен через `layero deploy` |
| `manual` | Запущен через дашборд (Redeploy) |

Пример CI-сборки:

```bash
LAYERO_TOKEN=$LAYERO_DEPLOY_TOKEN layero deploy --prod --yes \
  --project alice-my-site
```

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
Артефакты сборки (`dist`, `build`, `.next`) **не нужно** заливать —
сборка запускается на стороне Layero после распаковки.
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

Если ваш билд не укладывается — напишите в поддержку, лимиты повышаются
индивидуально.

## Окружение сборки

Каждая сборка запускается в **изолированной песочнице** на выделенной builder-VM:

- **CPU / память**: 2 vCPU, 4 GB RAM, swap до 4 GB, лимит процессов — 1024.
- **Диск**: writable scratch (`/mnt/scratch`, ~40 GB на одну сборку), tmpfs `/tmp` 256 MB.
  Кэши `npm`/`yarn`/`pnpm` автоматически перенаправляются на scratch — большие
  бинарники (`rolldown`, `swc`, `sharp`) скачиваются без ENOSPC.
- **Сеть**: разрешён исходящий HTTPS к npm-зеркалу, GitHub, реестрам пакетов
  (npm, yarn) и S3. Произвольные внешние эндпоинты с этапа сборки недоступны
  — это защищает чужие билды от случайного или вредоносного трафика. Если
  вашему билду нужен доступ к закрытому реестру или CDN, напишите в поддержку.
- **Изоляция**: gVisor (`runsc`) + seccomp + drop-all capabilities + read-only
  rootfs. Сборки разных проектов не видят друг друга и не имеют доступа к
  инфраструктуре Layero.

Среда не персистентна между билдами: всё, что вы записали в `/tmp` или
`/mnt/scratch`, исчезает после завершения. Артефакты в `output_dir`
(`dist` по умолчанию) загружаются в S3 и попадают в CDN.

## После деплоя

После `ready` сайт доступен на `https://<organization>-<project>.layero.ru` и
preview-URL `https://<project>-<sha7>.preview.layero.ru` (см.
[Окружения](../deploys/environments.md)). Для канонического hostname
после **первого** деплоя нужно подождать ~30–60 секунд, пока CDN
прогреется.

## Postinstall-баннер

После `npm install -g layero` CLI пишет краткую инструкцию в `/dev/tty`.
В CI-окружениях баннер не выводится. Чтобы выключить вручную:

```bash
LAYERO_SKIP_POSTINSTALL=1 npm install -g layero
```
