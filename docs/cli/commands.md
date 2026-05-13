---
sidebar_position: 2
title: Команды
description: Полный список команд layero — init, login, projects, deploy, rollback, deploys list, link, token.
---

# Команды CLI

| Команда | Что делает |
|---|---|
| `layero init` | Авто-детект фреймворка, скаффолд `.layero/project.json` + блок для AI-агентов в `AGENTS.md` / `CLAUDE.md` / `.cursorrules`. |
| `layero login` | Авторизоваться через браузер (GitHub / Яндекс ID) — device-flow. |
| `layero logout` | Удалить сохранённый токен. |
| `layero whoami` | Показать текущий аккаунт. |
| `layero orgs list` | Список Layero-организаций (личная + команды). |
| `layero projects list` | Список ваших проектов. |
| `layero link <id_or_slug>` | Привязать cwd к существующему проекту. |
| `layero deploy` | Авто-детект фреймворка, упаковать cwd, задеплоить (preview по умолчанию). |
| `layero deploy --prod` | Задеплоить в production (с подтверждением). |
| `layero deploy --org <slug>` | Создать новый проект в указанной команде вместо личной. |
| `layero deploy --json` | Machine-readable стрим событий — для агентов и CI. |
| `layero deploys list` | Показать недавние деплои текущего проекта. |
| `layero rollback` | Откатить активный деплой на предыдущий ready. |
| `layero token set <jwt>` | Задать токен вручную (для CI). |

Полный список флагов конкретной команды:

```bash
npx layero <cmd> --help
```

Глобальный флаг `--json` переключает CLI в режим JSON-lines на stdout — это для AI-агентов (Cursor, Claude Code) и CI-пайплайнов. Подробнее — [Деплой из AI-агентов](./agents.md).

## `layero init`

Запустите один раз внутри директории сайта:

```bash
cd my-site
npx layero init
```

Что делает:

1. Читает `package.json` и характерные конфиги (`next.config.*`, `vite.config.*`, `astro.config.*` и т.д.) — определяет фреймворк.
2. Создаёт `.layero/project.json` со значениями `framework_hint` / `build_cmd` / `output_dir`. Если файл уже есть — не трогает.
3. Дописывает блок «Deploying with Layero» в `AGENTS.md`, `CLAUDE.md` и/или `.cursorrules` (выбирает существующие; если ни одного нет — создаёт `AGENTS.md`).

Блок огорожен маркерами `<!-- layero:start -->` / `<!-- layero:end -->` — повторный `init` обновит его в месте, не дублируя.

Флаги:

- `--skip-agent-docs` — не трогать `AGENTS.md` / `CLAUDE.md` / `.cursorrules`.
- `-y`, `--yes` — non-interactive (все умолчания применяются молча).

## `layero orgs list`

Показывает Layero-организации, в которых вы состоите:

```
borisowvalia        personal  (admin)
acme-team           team      (admin)
client-x            team      (member)
```

* **personal** — ваш личный аккаунт, создаётся при регистрации
* **team** — команда, создаётся вручную (на дашборде или при `layero deploy --org=...`)

Slug используется как префикс в hostname'ах: `<org>-<project>.layero.ru`.

## `layero projects list`

Показывает все проекты, к которым у вас есть доступ.

## `layero link`

Привязать текущую директорию к существующему проекту:

```bash
npx layero link 123          # по id
npx layero link alice-blog   # по slug
```

Создаст `./.layero/project.json` со ссылкой на проект. Полезно, когда вы клонировали чужой репо и хотите деплоить в свой проект, или переехали из другой папки.

## `layero deploy`

Упаковать cwd и запустить деплой. Подробно — [`layero deploy`](./deploy.md).

## `layero deploys list`

Показать последние деплои проекта (по умолчанию — default-ветка):

```bash
npx layero deploys list                       # текущая default-ветка
npx layero deploys list --branch=staging      # другая ветка
npx layero deploys list --limit 50            # больше истории
```

Каждая строка содержит статус (`ready`/`building`/`failed`), commit SHA, время и **источник** деплоя:

| Бейдж | Что значит |
|---|---|
| `(push)` | Пришёл от webhook'а GitHub после push |
| `(cli)` | Загружен через `layero deploy` |
| `(manual)` | Запущен вручную через дашборд (Redeploy) |

## `layero rollback`

Откатить активный деплой ветки на предыдущий successful — без пересборки. Подробно — [`layero rollback`](./rollback.md).

```bash
npx layero rollback                       # default-ветка → previous ready
npx layero rollback --branch=staging      # конкретная ветка
npx layero rollback --deploy=a3f9c2b      # на конкретный commit/deploy
npx layero rollback --yes                 # без подтверждения (CI)
```
