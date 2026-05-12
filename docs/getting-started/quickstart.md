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

Команда откроет браузер и предложит авторизоваться через **GitHub / Google / Яндекс ID**. После подтверждения токен сохраняется в `~/.layero/config.json` (chmod 600).

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

:::tip Preview-URL за 30 секунд
Полный канонический hostname на CDN прогревается 5–15 минут. Чтобы вы могли сразу проверить результат, Layero выдаёт **preview-URL** вида `https://<project>-<sha7>.preview.layero.ru` уже через ~30 секунд после успешной сборки. Подробнее — в [Окружения и preview-URL](../deploys/environments.md).
:::

## 5. Поменяли код — снова `layero deploy`

```bash
# отредактировали что-то в редакторе (или AI-агент это сделал)
npx layero deploy
# → новый preview URL
```

Тот же проект, новая версия. Никаких коммитов между, никакого push в GitHub.

## Что дальше

- Используете Cursor, Claude Code или другой AI-агент? — [Деплой из AI-агентов](../cli/agents.md).
- Поднимите проект из GitHub: [Деплой из GitHub](../deploys/github.md).
- Добавьте переменные окружения: [Env vars](../deploys/env-vars.md).
- Подключите свой домен: [Custom domains](../deploys/custom-domains.md).
