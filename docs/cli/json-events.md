---
sidebar_position: 6
title: JSON-events схема
description: Полный список событий и кодов ошибок, которые Layero CLI эмитит на stdout в JSON-режиме. Канонический справочник для AI-агентов и CI.
---

# JSON-events схема

CLI переключается в JSON-lines режим автоматически когда запущен внутри AI-агента (Cursor, Claude Code) или с не-TTY stdout. Также можно включить явно: флаг `--json` или env `LAYERO_JSON=1`.

В этом режиме CLI:

- **Не задаёт вопросов** — все интерактивные подтверждения пропускаются (для `--prod` всё равно нужен `--yes`)
- На stdout печатает по одной строке `{"event":"...", ...}` за действие
- Ошибки приходят со стабильным `code` и `next_action`
- Каждое событие также содержит поле `ts` (ISO-8601 timestamp)

## События

Каждая строка — самостоятельный JSON-объект. Парсите по `event` полю.

### `auth_required`

CLI начал device-flow логин. Покажите URL пользователю как кликабельную ссылку.

| поле | тип | примечание |
|---|---|---|
| `url` | string | например `https://app.layero.ru/cli?code=ABCD-1234` |
| `user_code` | string | например `ABCD-1234` — также видно на странице подтверждения |

CLI продолжит поллить каждые 2 секунды. Когда пользователь подтвердит — последует `authorized`. Истечение — `error{code: "auth_expired" | "auth_timeout"}`.

### `authorized`

Логин успешен.

| поле | тип |
|---|---|
| `user` | string — username, email или user id |

### `detected`

Авто-детект фреймворка отработал.

| поле | тип |
|---|---|
| `framework` | string — `next`/`vite`/`astro`/`sveltekit`/`nuxt`/`gatsby`/`cra`/`docusaurus`/`static` |
| `build_cmd` | string |
| `output_dir` | string |
| `confident` | boolean — `false` для static-fallback |

### `project_created`

Первый деплой в этой папке. Создан новый проект.

| поле | тип |
|---|---|
| `project_id` | string |
| `slug` | string |
| `organization` | string — slug организации |

### `project_linked`

Деплой в существующий проект (cwd привязан через `.layero/project.json`).

| поле | тип |
|---|---|
| `project_id` | string |
| `slug` | string |

### `packing`

CLI упаковал директорию в tar.gz.

| поле | тип |
|---|---|
| `files` | number |
| `bytes` | number |
| `sha256` | string |

### `uploading`

Заливка архива в S3 началась. Без дополнительных полей.

### `uploaded`

Заливка успешна.

| поле | тип |
|---|---|
| `archive_key` | string |

### `setup_applied`

Применили настройки проекта (`framework_hint` / `build_cmd` / `output_dir`) на первом деплое. Без полей.

### `deploy_started`

Бэкенд принял задачу.

| поле | тип |
|---|---|
| `deploy_id` | string |

### `stage`

Сменилась стадия сборки.

| поле | тип |
|---|---|
| `name` | `clone`/`install`/`build`/`upload`/`activate` |

### `build_log`

Строка лога сборки. Форвардить пользователю стоит только если содержит ошибку — в успешных билдах их много и они шумные.

| поле | тип |
|---|---|
| `line` | string |
| `stream` | `stdout`/`stderr` |

### `ready`

**Финальное событие.** Деплой жив. Покажите `url` пользователю и завершите выполнение.

| поле | тип | примечание |
|---|---|---|
| `url` | string | канонический URL: `https://<org>-<project>.layero.ru` (или с веткой/`-cli` для preview) |
| `preview_url` | string? | прямой preview-URL через builder VM, минуя CDN; доступен через ~30 секунд после сборки даже если CDN ещё прогревается (5–15 минут). Полезно показывать когда `url` пока 404'ит. |
| `deploy_id` | string | |

### `error`

| поле | тип |
|---|---|
| `code` | string — см. таблицу ниже |
| `next_action` | string — конкретная команда / URL для разрешения |
| `message` | string — человекочитаемое описание |

## Коды ошибок

| `code` | Когда происходит | Что делать (`next_action`) |
|---|---|---|
| `not_logged_in` | Нет токена в `~/.layero/config.json` | `run: layero login` |
| `auth_expired` | `user_code` истёк (15 мин TTL), пользователь не подтвердил | Запустить `layero login` ещё раз |
| `auth_timeout` | CLI поллил 15 минут, юзер так и не подтвердил | Запустить `layero login` ещё раз |
| `invalid_type` | `--type` с неизвестным значением | Убрать флаг (полагаемся на авто-детект) или передать валидный пресет |
| `invalid_choice` | Интерактивный prompt получил невалидный выбор в non-TTY режиме | Передать значение явным флагом (`--org`, `--project`) |
| `project_not_found` | `--project` указывает на несуществующий проект | `run: layero projects list` |
| `project_unlinked` | Linked-проект удалён на сервере | Удалить `.layero/project.json` и запустить deploy заново |
| `username_missing` | OAuth прошёл, но username не выбран | Открыть `https://app.layero.ru/onboarding` |
| `org_membership_missing` | `--org` указывает на не-вашу организацию | Передать корректный slug или убрать флаг |
| `no_organization` | На аккаунте нет ни одной организации | Завершить onboarding в дашборде |
| `cli_deploys_disabled` | Админ выключил CLI-деплои в проекте | Включить в Project Settings → CLI deploys |
| `deploy_failed` | Билд упал | Открыть deploy URL из `message`, посмотреть логи |
| `deploy_error` / `deploy_canceled` / `deploy_timed_out` | Билд не дошёл до `ready` по разным причинам | См. сообщение |
| `internal` | Непредвиденная ошибка CLI | Запустить с `--debug`, открыть issue |

## Cold-start template для агента

Минимальный поведенческий блок (положите в системный промпт):

```text
If user asks to deploy via Layero:
  1. Run: npx layero@latest deploy --json
  2. Parse each stdout line as JSON, route on .event:
     - "auth_required" → render .url as clickable link, keep waiting
     - "ready" → show .url to user, stop
     - "error" → follow .next_action verbatim
  3. Never run `git init`. Never run `npm install -g layero`.
```

Полный пример — [Деплой из AI-агентов](./agents.md).
