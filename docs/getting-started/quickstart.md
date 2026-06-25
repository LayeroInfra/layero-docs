---
sidebar_position: 1
title: Быстрый старт
description: Установите CLI, залогиньтесь и опубликуйте первый сайт за одну команду. Git не нужен.
---

# Быстрый старт

За 30 секунд опубликуем локальный фронтенд через CLI. **Git и GitHub не требуются** — Layero заливает локальную директорию напрямую. Если хочется автодеплой по `git push` — это уже Day-N апгрейд, см. [Деплой из GitHub](../deploys/github.md).

## 1. Запустите CLI

Установка не нужна — используйте `npx`:

```bash
cd my-site
npx layero@latest init
```

Команда определит ваш фреймворк (Next / Vite / Astro / SvelteKit / Nuxt / Gatsby / CRA / Docusaurus / static HTML) и создаст `.layero/project.json`.

Требуется **Node.js ≥ 20**. Если предпочитаете локальную установку:

```bash
npm install -D layero
```

## 2. Залогиньтесь

```bash
npx layero login
```

Команда напечатает URL вида `https://app.layero.ru/cli?code=ABCD-1234` и (если запущена в обычном терминале) откроет его в браузере. В браузере выбираете провайдера — **GitHub** или **Яндекс ID**, аккаунт в Layero создаётся автоматически при первом OAuth — и жмёте «Разрешить доступ». CLI получит токен в течение пары секунд и сохранит его в `~/.layero/config.json` (chmod 600).

:::tip CLI на одной машине, браузер на другой
Это device-flow (как `gh auth login` или AppleTV). CLI не открывает локальный HTTP-сервер — обмен идёт через `api.layero.ru`. Поэтому логин работает из SSH, Docker-контейнера, песочницы Cursor и где угодно ещё — лишь бы был интернет.
:::

## 3. Задеплойте

```bash
npx layero deploy
```

CLI:

1. Авто-детектит фреймворк и заполняет `build_cmd` / `output_dir` (если они ещё не заданы).
2. Упакует папку в tar.gz, уважая `.gitignore` и `.layeroignore` (см. [`layero deploy`](../cli/deploy.md)).
3. Зальёт архив в Yandex Object Storage.
4. Запустит сборку на стороне платформы.
5. Стримит логи в терминал, в конце печатает preview URL.

Первый деплой создаст проект и сохранит ссылку на него в `./.layero/project.json` — последующие `layero deploy` уйдут в тот же проект.

## 4. Откройте сайт

После завершения сборки сайт будет доступен на `https://<organization>-<project>.layero.ru`. Например, для пользователя `vasya` (его персональная организация — `vasya`) и проекта `my-site` — `https://vasya-my-site.layero.ru`.

:::tip Apex прогревается 5–15 мин — preview работает сразу
При **первом** деплое в новом проекте apex `<org>-<project>.layero.ru` прогревается 5–15 минут (YC CDN выпускает per-host LE-сертификат). Пока он ещё не готов, шерьте **preview-URL** вида `https://<org>-<project>-cli.preview.layero.ru` — доступен через ~30 секунд после успешной сборки. Все последующие promote'ы apex'а — моментальные. Подробнее — в [Окружения, preview и production](../deploys/environments.md).
:::

## 5. Поменяли код — снова `layero deploy`

```bash
# отредактировали что-то в редакторе (или AI-агент это сделал)
npx layero deploy
# → новая сборка снова публикуется на apex <org>-<project>.layero.ru
```

Для CLI-проекта (без подключённого репозитория) каждый `layero deploy`
**публикуется в apex автоматически** — прямые загрузки авто-промоутятся, отдельный
`--prod` или `promote` не нужен. На первом деплое apex прогревается несколько минут;
пока он не готов (`edge_ready=false` в событии `ready`), шерьте `preview_url` — он
доступен сразу.

Нужен изолированный preview, который **не** трогает production? Деплойте в
именованную ветку:

```bash
npx layero deploy --branch=staging
# → https://<org>-<project>-staging.preview.layero.ru  (24 ч TTL, apex нетронут)
```

См. [`layero promote`](../cli/promote.md) и [Окружения](../deploys/environments.md) для production-флоу git-проектов.

## Что дальше

- Используете Cursor, Claude Code или другой AI-агент? — [Деплой из AI-агентов](../cli/agents.md).
- Поднимите проект из GitHub: [Деплой из GitHub](../deploys/github.md).
- Добавьте переменные окружения: [Env vars](../deploys/env-vars.md).
- Подключите свой домен: [Custom domains](../deploys/custom-domains.md).
