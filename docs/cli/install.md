---
sidebar_position: 1
title: Установка и логин
description: Как поставить Layero CLI (npx / project-local / глобально), залогиниться через device-flow и где хранится токен.
---

# Установка и логин

## Установка

Layero CLI публикуется как npm-пакет [`layero`](https://www.npmjs.com/package/layero). Рекомендуем `npx layero@latest` — **с версией и без `-g`**:

```bash
# Рекомендуется: без установки, всегда последняя версия
npx layero@latest deploy

# Локально в проект — версия ПРИКРЕПЛЯЕТСЯ, обновлять руками
npm install -D layero && npx layero deploy

# Глобально (в Cursor/Claude Code часто фейлится из-за прав на /usr/local)
npm install -g layero@latest
```

Требуется **Node.js ≥ 20**.

:::tip[Пишите `@latest` — иначе версия прикрепится]
`npx layero` без версии берёт **уже установленную** копию: локальную из
`node_modules`, а если её нет — глобальную. В реестр он при этом не ходит, и
вы годами запускаете то, что поставили однажды. Так у нас нашёлся ноутбук с
`layero@0.8.11` при опубликованном 0.8.20 — и до 0.8.22 CLI даже не мог об
этом предупредить (запрос к npm был сломан).

`npx layero@latest` тянет свежий релиз каждый раз. Локальную установку
обновляйте сами: `npm i -D layero@latest`.
:::

## Логин

```bash
npx layero@latest login
```

CLI:

1. Делает один HTTP-запрос на `api.layero.ru` и получает короткий код вида `5NFW-K2NG`.
2. Печатает URL `https://app.layero.ru/cli?code=5NFW-K2NG` (и пытается открыть его в браузере, если запущен в интерактивном терминале).
3. Молча поллит каждые 2 секунды до подтверждения или истечения 15-минутного TTL.

В браузере вы выбираете способ входа — **код на почту** или **Яндекс ID**. Если аккаунта в Layero ещё нет, он создаётся автоматически при первом входе. Страница называет аккаунт, которому выдаёт доступ: если он не тот, там же есть «войти другим». После «Разрешить доступ» CLI получает JWT и сохраняет его в `~/.layero/config.json` (chmod 600).

:::info[Браузер и CLI могут быть на разных машинах]
Это device-flow (как `gh auth login`, `aws sso login`, AppleTV). CLI не открывает локальный сервер на 127.0.0.1 — обмен идёт **через backend**. Поэтому логин работает даже когда CLI запущен на удалённой машине (SSH, Docker, headless CI), а ваш браузер на ноутбуке.
:::

Проверьте, под каким аккаунтом вы залогинены:

```bash
npx layero@latest whoami
```

### Если код истёк

Каждый `user_code` живёт **15 минут**. Если не успели подтвердить — CLI завершится с `auth_expired` или `auth_timeout`. Просто запустите `npx layero@latest login` ещё раз.

### Аккаунта в Layero нет

Не нужно регистрироваться отдельно. Первый вход — по коду на почту или через Яндекс ID — создаёт ваш Layero-аккаунт и личную организацию автоматически. После логина вас могут попросить выбрать username (один раз) — он становится слагом вашей персональной организации. У проектов, созданных до переезда на `layero.app` (26 июля 2026), он попал и в адрес сайта — `<username>-<project>.layero.app`. У новых адрес состоит из одного слага проекта.

## Инициализация проекта

Внутри директории сайта запустите:

```bash
npx layero@latest init
```

Команда:

- Смотрит на папку и печатает, как её понял (Next / Vite / Astro / SvelteKit / Nuxt / Gatsby / CRA / Docusaurus / static…), а если приложение не узнано — подсказку, что сделать
- Создаёт `.layero/project.json` с `analytics_enabled` и `env_vars` — догадку детекта туда не пишет
- Дописывает блок «Deploying with Layero» в `AGENTS.md` / `CLAUDE.md` / `.cursorrules` (если они есть) — чтобы AI-агенты в следующих чат-сессиях знали как деплоить без подсказок.

Идемпотентно: повторный запуск обновляет существующий блок, не дублируя.

## Где лежит конфиг

| Файл | Назначение |
|---|---|
| `~/.layero/config.json` | Auth-токен и URL API. Создаётся `layero login`. |
| `./.layero/project.json` | Связка cwd с конкретным проектом. Создаётся `layero init` или первым `layero deploy`. Поля `framework_hint`, `build_cmd`, `output_dir` CLI туда не пишет — впишите их сами, если хотите закрепить выбор. |

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
  "analytics_enabled": false,
  "env_vars": {}
}
```

Поля `framework_hint`, `build_cmd`, `output_dir` можно вписать руками — новый
проект получит их как ваш выбор. Сам CLI их не заполняет: догадка детекта,
записанная как настройка, перебивала бы определение по файлам на каждой сборке.

После первого `deploy` к нему добавятся `project_id`, `slug`, `organization_slug`, `apex_hostname` — CLI пишет их сам, не трогайте.

## Сброс токена

```bash
npx layero@latest logout
```

Удалит токен из `~/.layero/config.json`. На сервере ничего не отзовёт — JWT валиден до истечения TTL (7 дней). Если хотите отозвать сессию на сервере — `Settings → Active sessions` в дашборде.

## CI / non-interactive

В CI обычно нет браузера. Получите JWT через `layero login` на dev-машине, скопируйте из `~/.layero/config.json` и передайте в CI как секрет:

```bash
# В CI. Токен не печатаем: всё, что попало в лог сборки, видно всем,
# у кого есть доступ к раннам, и остаётся там после ротации секрета.
npx layero@latest token set "$LAYERO_TOKEN"
npx layero@latest deploy --prod --yes --project alice-my-site
```

`layero token set` — это «ручное окно» для CI и dev-сценариев. В обычной работе используйте `login`.

## Что дальше

- [Команды CLI](./commands.md)
- [`layero deploy`: автодетект, флаги, лимиты](./deploy.md)
- [Деплой из AI-агентов (Cursor, Claude Code, Aider)](./agents.md)
- [JSON-events: полная схема событий и кодов ошибок](./json-events.md)
