---
sidebar_position: 1
slug: /
title: Что такое Layero
---

# Layero

**Layero** — это хостинг для фронтенд-приложений с серверами в России.
Деплой за одну команду, без VPN и без замедлений.

Платформа поддерживает три сценария публикации:

- **Репозиторий** — подключите репозиторий на GitHub, GitVerse, GitLab,
  GitFlic или SourceCraft: при каждом `git push` Layero заберёт код, соберёт
  его и опубликует. Ветка — превью, production-ветка — продакшен.
  См. [Подключение репозитория](./deploys/git-providers.md).
- **CLI** — `npx layero@latest deploy` в папке проекта. CLI упакует
  исходники, зальёт их и запустит сборку на стороне платформы; git не нужен.
- **Агент** — Claude Code, Cursor, Codex или любой другой AI-агент
  публикует и обслуживает сайт сам: через навык, CLI в JSON-режиме и
  MCP-сервер. См. [Как AI-агент работает с Layero](./agents/index.md).

Помимо статики Layero умеет запускать **runtime-приложения** — SSR Next.js,
Streamlit, Gradio и любые контейнеры с долгоживущим процессом. Контейнер
поднимается по первому запросу и останавливается при простое.

## Что лежит в основе

| | |
|---|---|
| Где хостится | Yandex Cloud, регион `ru-central1` |
| Раздача сайтов | Собственный edge (nginx) в `ru-central1`; пользовательская зона `*.layero.app` резолвится прямо в балансировщик платформы |
| Сертификаты | Let's Encrypt через YC Certificate Manager |
| Хранилище артефактов | Yandex Object Storage |
| Билд-окружение | Node.js 20 / 22 / 24 (по умолчанию 22), Python 3.10–3.13 (по умолчанию 3.12), git — см. [Версии Node.js и Python](./deploys/runtime-versions.md) |

## Куда дальше

- [Быстрый старт](./getting-started/quickstart.md) — задеплоить первый сайт
  за 30 секунд.
- [Основные концепции](./getting-started/concepts.md) — проект,
  окружение, деплой, runtime.
- [CLI: установка и команды](./cli/install.md) — `layero` в терминале.
- [Как AI-агент работает с Layero](./agents/index.md) — навык, MCP и CLI
  для Claude Code, Cursor, Codex.
- [Поддерживаемые фреймворки](./getting-started/frameworks.md) — что
  определяется автоматически.

## Полезные ссылки

- Сайт: [layero.ru](https://layero.ru)
- Панель: [app.layero.ru](https://app.layero.ru)
- API: [api.layero.ru](https://api.layero.ru)