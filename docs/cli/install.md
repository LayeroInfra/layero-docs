---
sidebar_position: 1
title: Установка и логин
description: Как поставить Layero CLI (npx / project-local / глобально), залогиниться через device-flow и где хранится токен.
---

# Установка и логин

## Установка

Layero CLI публикуется как npm-пакет [`layero`](https://www.npmjs.com/package/layero). Рекомендуем `npx` или локально в проект — **без `-g`**:

```bash
# Без установки, всегда последняя версия (рекомендуется):
npx layero@latest deploy

# Локально в проект:
npm install -D layero
npx layero deploy

# Глобально (если очень хочется; в Cursor/Claude Code часто фейлится из-за прав):
npm install -g layero
```

Требуется **Node.js ≥ 20**.

:::tip Почему не `-g`
Глобальная установка фейлится в песочницах AI-агентов (Cursor, Claude Code) из-за прав на `/usr/local`. `npx` и локальная установка работают везде, и `npx layero@latest` всегда тянет свежий релиз — никаких ручных апдейтов.
:::

## Логин

```bash
npx layero login
```

CLI:

1. Делает один HTTP-запрос на `api.layero.ru` и получает короткий код вида `5NFW-K2NG`.
2. Печатает URL `https://app.layero.ru/cli?code=5NFW-K2NG` (и пытается открыть его в браузере, если запущен в интерактивном терминале).
3. Молча поллит каждые 2 секунды до подтверждения или истечения 15-минутного TTL.

В браузере вы выбираете провайдера (**GitHub** или **Яндекс ID**) — если аккаунта в Layero ещё нет, он создаётся автоматически на первом OAuth. После «Разрешить доступ» CLI получает JWT и сохраняет его в `~/.layero/config.json` (chmod 600).

:::info Браузер и CLI могут быть на разных машинах
Это device-flow (как `gh auth login`, `aws sso login`, AppleTV). CLI не открывает локальный сервер на 127.0.0.1 — обмен идёт **через backend**. Поэтому логин работает даже когда CLI запущен на удалённой машине (SSH, Docker, headless CI), а ваш браузер на ноутбуке.
:::

Проверьте, под каким аккаунтом вы залогинены:

```bash
npx layero whoami
```

### Если код истёк

Каждый `user_code` живёт **15 минут**. Если не успели подтвердить — CLI завершится с `auth_expired` или `auth_timeout`. Просто запустите `npx layero login` ещё раз.

### Аккаунта в Layero нет

Не нужно регистрироваться отдельно. Первый OAuth через GitHub или Яндекс создаёт ваш Layero-аккаунт и личную организацию автоматически. После логина вас могут попросить выбрать username (один раз) — это будет префиксом ваших hostname'ов: `<username>-<project>.layero.ru`.

## Инициализация проекта

Внутри директории сайта запустите:

```bash
npx layero init
```

Команда:

- Авто-детектит фреймворк (Next / Vite / Astro / SvelteKit / Nuxt / Gatsby / CRA / Docusaurus / static)
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
  "user": { "id": 42, "username": "alice", "email": "alice@example.com" }
}
```

`./.layero/project.json` после `init`:

```json
{
  "framework_hint": "vite",
  "build_cmd": "npm run build",
  "output_dir": "dist",
  "analytics_enabled": false,
  "env_vars": {}
}
```

После первого `deploy` к нему добавятся `project_id`, `slug`, `organization_slug`, `apex_hostname` — CLI пишет их сам, не трогайте.

## Сброс токена

```bash
npx layero logout
```

Удалит токен из `~/.layero/config.json`. На сервере ничего не отзовёт — JWT валиден до истечения TTL (7 дней). Если хотите отозвать сессию на сервере — `Settings → Active sessions` в дашборде.

## CI / non-interactive

В CI обычно нет браузера. Получите JWT через `layero login` на dev-машине, скопируйте из `~/.layero/config.json` и передайте в CI как секрет:

```bash
# В CI
echo "LAYERO_TOKEN=$LAYERO_TOKEN" >&2
npx layero token set "$LAYERO_TOKEN"
npx layero deploy --prod --yes --project alice-my-site
```

`layero token set` — это «ручное окно» для CI и dev-сценариев. В обычной работе используйте `login`.

## Что дальше

- [Команды CLI](./commands.md)
- [`layero deploy`: автодетект, флаги, лимиты](./deploy.md)
- [Деплой из AI-агентов (Cursor, Claude Code, Aider)](./agents.md)
- [JSON-events: полная схема событий и кодов ошибок](./json-events.md)
