---
sidebar_position: 1
title: Установка и логин
description: Как поставить CLI (npx / project-local / глобально), залогиниться через браузер и где хранится токен.
---

# Установка и логин

## Установка

Layero CLI публикуется как npm-пакет [`layero`](https://www.npmjs.com/package/layero). Рекомендуемый путь — **локально в проект** или **через `npx`** без установки:

```bash
# Локально в проект (рекомендуется):
npm install -D layero
npx layero deploy

# Без установки, всегда последняя версия:
npx layero@latest deploy

# Глобально (требует sudo на большинстве систем):
npm install -g layero
```

Требуется **Node.js ≥ 20**.

:::tip Почему не `-g`
Глобальная установка часто фейлится в песочницах AI-агентов (Cursor, Claude Code) из-за прав на `/usr/local`. Локальная установка или `npx` работает везде.
:::

После установки команда `layero` доступна:

```bash
npx layero --version
```

## Логин

```bash
npx layero login
```

CLI поднимет локальный HTTP-сервер на `127.0.0.1`, откроет браузер и проведёт через OAuth (**GitHub / Google / Яндекс ID**). После подтверждения токен сохраняется в `~/.layero/config.json` (chmod 600).

Проверьте, под каким аккаунтом вы залогинены:

```bash
npx layero whoami
```

## Инициализация проекта

Внутри директории сайта запустите:

```bash
npx layero init
```

Команда:

- Авто-детектит фреймворк (Next, Vite, Astro, SvelteKit, Nuxt, Gatsby, CRA, Docusaurus, static)
- Создаёт `.layero/project.json` со скаффолдом `framework_hint` / `build_cmd` / `output_dir`
- Дописывает блок «Deploying with Layero» в `AGENTS.md` / `CLAUDE.md` / `.cursorrules` (если они есть) — чтобы AI-агенты в следующих чат-сессиях знали как деплоить без подсказок.

Идемпотентно: повторный запуск обновляет существующий блок, не дублируя.

## Где лежит конфиг

| Файл | Назначение |
|---|---|
| `~/.layero/config.json` | Auth-токен и URL API. Создаётся `layero login`. |
| `./.layero/project.json` | Связка cwd с конкретным проектом + framework/build/output. Создаётся `layero init` или первым `layero deploy`. |

`~/.layero/config.json` выглядит примерно так:

```json
{
  "apiUrl": "https://api.layero.ru",
  "token": "eyJhbGciOi...",
  "user": { "id": 42, "handle": "alice", "email": "alice@example.com" }
}
```

`./.layero/project.json` после `init`:

```json
{
  "project_id": "...",
  "slug": "...",
  "organization_slug": "...",
  "apex_hostname": "...",
  "framework_hint": "vite",
  "build_cmd": "npm run build",
  "output_dir": "dist",
  "analytics_enabled": false,
  "env_vars": {}
}
```

`project_id`/`slug`/`organization_slug`/`apex_hostname` пишутся самим CLI — не трогайте. Остальное — ваше, можно редактировать.

## Сброс токена

```bash
npx layero logout
```

Удалит токен из `~/.layero/config.json`. На сервере ничего не отзовёт — JWT валиден до истечения TTL (7 дней).

Если нужно вручную задать токен (например, в CI):

```bash
npx layero token set <jwt>
```

## Что дальше

- [Команды CLI](./commands.md)
- [`layero deploy`: автодетект, флаги, лимиты](./deploy.md)
- [Деплой из AI-агентов (Cursor, Claude Code, Aider)](./agents.md)
