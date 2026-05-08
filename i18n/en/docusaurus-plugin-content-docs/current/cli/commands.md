---
sidebar_position: 2
title: Команды
description: Полный список команд layero — login, projects, deploy, rollback, deploys list, link, token.
---

# Команды CLI

| Команда | Что делает |
|---|---|
| `layero login` | Авторизоваться через браузер (OAuth). |
| `layero logout` | Удалить сохранённый токен. |
| `layero whoami` | Показать текущий аккаунт. |
| `layero projects list` | Список ваших проектов. |
| `layero link <id_or_slug>` | Привязать cwd к существующему проекту. |
| `layero deploy` | Упаковать cwd и задеплоить (preview по умолчанию). |
| `layero deploy --prod` | Задеплоить в production (с подтверждением). |
| `layero deploys list` | Показать недавние деплои текущего проекта. |
| `layero rollback` | Откатить активный деплой на предыдущий ready. |
| `layero token set <jwt>` | Задать токен вручную (для CI). |

Полный список флагов конкретной команды:

```bash
layero <cmd> --help
```

## `layero projects list`

Показывает все проекты, к которым у вас есть доступ.

## `layero link`

Привязать текущую директорию к существующему проекту:

```bash
layero link 123          # по id
layero link alice-blog   # по slug
```

Создаст `./.layero/project.json` со ссылкой на проект. Полезно, когда
вы клонировали чужой репо и хотите деплоить в свой проект, или
переехали из другой папки.

## `layero deploy`

Упаковать cwd и запустить деплой. Подробно — [`layero deploy`](./deploy.md).

## `layero deploys list`

Показать последние деплои проекта (по умолчанию — default-ветка):

```bash
layero deploys list                       # текущая default-ветка
layero deploys list --branch=staging      # другая ветка
layero deploys list --limit 50            # больше истории
```

Каждая строка содержит статус (`ready`/`building`/`failed`), commit SHA,
время и **источник** деплоя:

| Бейдж | Что значит |
|---|---|
| `(push)` | Пришёл от webhook'а GitHub после push |
| `(cli)` | Загружен через `layero deploy` |
| `(manual)` | Запущен вручную через дашборд (Redeploy) |

## `layero rollback`

Откатить активный деплой ветки на предыдущий successful — без пересборки.
Подробно — [`layero rollback`](./rollback.md).

```bash
layero rollback                       # default-ветка → previous ready
layero rollback --branch=staging      # конкретная ветка
layero rollback --deploy=a3f9c2b      # на конкретный commit/deploy
layero rollback --yes                 # без подтверждения (CI)
```
