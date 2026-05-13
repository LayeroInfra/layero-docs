---
sidebar_position: 1
title: Установка и логин
description: npm install -g layero, OAuth-логин через браузер и где CLI хранит токен.
---

# Установка и логин

## Установка

```bash
npm install -g layero
```

Требуется **Node.js ≥ 20**.

После установки команда `layero` доступна глобально. Проверьте версию:

```bash
layero --version
```

## Логин

```bash
layero login
```

CLI prints a verification URL like `https://app.layero.ru/cli?code=ABCD-1234`
and polls for approval. Open the URL in any browser, pick a provider
(GitHub or Yandex — Layero creates the account on first OAuth), and
click "Authorize". The CLI receives a JWT within ~2 seconds and stores
it in `~/.layero/config.json` (chmod 600).

This is a device flow (like `gh auth login`): no local HTTP server is
involved, so login works from SSH, Docker, or AI-agent sandboxes where
loopback isn't available.

Проверьте, под каким аккаунтом вы залогинены:

```bash
layero whoami
```

## Где лежит конфиг

| Файл | Назначение |
|---|---|
| `~/.layero/config.json` | Auth-токен и URL API. Создаётся `layero login`. |
| `./.layero/project.json` | Связка cwd с конкретным проектом. Создаётся первым `layero deploy` или командой `layero link`. |

`~/.layero/config.json` выглядит примерно так:

```json
{
  "apiUrl": "https://api.layero.ru",
  "token": "eyJhbGciOi...",
  "user": { "id": 42, "handle": "alice", "email": "alice@example.com" }
}
```

Не коммитьте `.layero/` в git — `project.json` нужен только локально
(добавьте `.layero/` в `.gitignore`).

## Сброс токена

```bash
layero logout
```

Удалит токен из `~/.layero/config.json`. На сервере ничего не отзовёт —
JWT валиден до истечения TTL (7 дней).

Если нужно вручную задать токен (например, в CI):

```bash
layero token set <jwt>
```

## Что дальше

- [Команды CLI](./commands.md)
- [`layero deploy`: флаги и игнорирование](./deploy.md)
