---
sidebar_position: 2
title: Команды
description: Полный список команд layero — login, projects list, link, deploy, token.
---

# Команды CLI

| Команда | Что делает |
|---|---|
| `layero login` | Авторизоваться через браузер (OAuth). |
| `layero logout` | Удалить сохранённый токен. |
| `layero whoami` | Показать текущий аккаунт. |
| `layero projects list` | Список ваших проектов. |
| `layero link <id_or_slug>` | Привязать cwd к существующему проекту. |
| `layero deploy` | Упаковать cwd и задеплоить. |
| `layero token set <jwt>` | Задать токен вручную (для CI). |

Полный список флагов конкретной команды:

```bash
layero <cmd> --help
```

## `layero projects list`

Показывает все проекты, к которым у вас есть доступ:

```
ID    SLUG               STATUS    SOURCE  HOSTNAME
123   alice-my-site      active    cli     alice-my-site.layero.ru
124   alice-blog         active    github  alice-blog.layero.ru
```

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
