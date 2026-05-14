---
sidebar_position: 1
slug: /
title: Что такое Layero
---

# Layero

**Layero** — это хостинг для фронтенд-приложений с серверами в России.
Деплой за одну команду, CDN в Москве, Питере и Екатеринбурге, без VPN
и без замедлений.

Платформа поддерживает три сценария публикации:

- **GitHub-flow** — подключите репозиторий, при каждом `git push` Layero
  склонирует код, соберёт его и опубликует.
- **CLI-flow** — поставьте npm-пакет `layero` и выполните `layero deploy`
  в папке проекта. CLI упакует исходники, зальёт их и запустит сборку
  на стороне платформы.
- **`@layero`-плагин** — MCP-плагин для AI-IDE (Cursor / Claude Code / Codex),
  который соберёт лендинг с нуля через серию коротких квизов в чате и сам
  задеплоит результат. См. [@layero — плагин для AI-IDE](./plugin/intro.md).

Помимо статики Layero умеет запускать **runtime-приложения** — SSR Next.js,
Streamlit, Gradio и любые контейнеры с долгоживущим процессом. Контейнер
поднимается по первому запросу и останавливается при простое.

## Что лежит в основе

| | |
|---|---|
| Где хостится | Yandex Cloud, регион `ru-central1` |
| CDN | YC CDN, edge-узлы в Москве, СПб, Екатеринбурге |
| Сертификаты | Let's Encrypt через YC Certificate Manager |
| Хранилище артефактов | Yandex Object Storage |
| Билд-окружение | Node.js 18 / 20 (через nvm), git |

## Куда дальше

- [Быстрый старт](./getting-started/quickstart.md) — задеплоить первый сайт
  за 30 секунд.
- [Основные концепции](./getting-started/concepts.md) — проект,
  окружение, деплой, runtime.
- [CLI: установка и команды](./cli/install.md) — `layero` в терминале.
- [@layero — плагин для AI-IDE](./plugin/intro.md) — лендинг с нуля прямо в
  чате Cursor / Claude Code / Codex.
- [Поддерживаемые фреймворки](./getting-started/frameworks.md) — что
  определяется автоматически.

## Полезные ссылки

- Сайт: [layero.ru](https://layero.ru)
- Панель: [app.layero.ru](https://app.layero.ru)
- API: [api.layero.ru](https://api.layero.ru)