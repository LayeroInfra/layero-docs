---
sidebar_position: 5
title: Деплой из AI-агентов
description: Как Cursor, Claude Code, Aider и другие AI-агенты могут задеплоить сайт через Layero без git-репозитория и без визарда в браузере.
---

# Деплой из AI-агентов

Layero CLI задизайнен так, чтобы AI-агент (Cursor, Claude Code, Aider, Continue и т.д.) мог задеплоить сайт **за один разговор**, без git-инициализации, без push'а в GitHub и без визарда в дашборде. Единственное действие от пользователя — один клик по URL для логина.

:::tip Хочешь собрать лендинг с нуля прямо из чата IDE?

CLI деплоит **существующий** проект. Если задача наоборот — собрать лендинг
с нуля по описанию — посмотри [`@layero` MCP-плагин](../plugin/intro.md):
один клик установки, серия квизов в чате, готовая страница на Layero.

:::

## Целевой сценарий

```
Пользователь: задеплой этот лендинг через layero
Агент:        Сейчас. Открой https://app.layero.ru/cli?code=ABCD-1234 и подтверди.
              (юзер открывает ссылку, кликает «Authorize», возвращается в чат)
Агент:        ✓ Live at https://my-landing-abc123.layero.app
```

Никаких `git init`, никаких `gh repo create`, никаких походов в дашборд. После этого юзер может попросить агента «поменяй кнопку на красную» и снова «задеплой» — каждый раз новый preview-URL.

## Чтобы агент знал что делать

### Способ 1 — проектный файл (главный)

В директории проекта запустите один раз:

```bash
npx layero init
```

Команда дописывает блок в существующие `AGENTS.md` / `CLAUDE.md` / `.cursorrules` (или создаёт `AGENTS.md`). Блок содержит: device-flow рецепт логина (`auth_required` → клик → poll), таблицу JSON-событий с пояснениями (`detected` / `project_created` / `build_log` / `ready` / `error`), список кодов ошибок с remediation (`not_logged_in`, `auth_expired`, `cli_deploys_disabled`, ...), правила для `--prod`. Актуальный текст шаблона — в [`agentDocBlock()` в init.ts](https://github.com/LayeroInfra/core/blob/main/cli/src/commands/init.ts).

Любой современный агент читает эти файлы в начале сессии и точно знает что делать без подсказок.

### Способ 2 — cold-start (агент видит Layero впервые)

Если в проекте нет `AGENTS.md`, агент догадывается из контекста запроса юзера. Когда пользователь говорит «задеплой через layero», агент:

1. Делает WebFetch на `https://layero.ru/llms.txt` — каноническая страница для AI-агентов с готовым рецептом.
2. Или WebSearch «layero deploy» — попадает в эту страницу документации.

Оба пути ведут к одной команде: `npx layero deploy`.

## JSON-режим

Когда CLI запущен внутри AI-агента, он **автоматически** переключается в JSON-lines режим. Триггеры:

- Не-TTY stdout (всегда так в Cursor / Claude Code / любом subprocess)
- Env vars: `CURSOR_AGENT`, `CLAUDECODE`, `LAYERO_AGENT`, `LAYERO_JSON=1`
- Явный флаг `--json`

В этом режиме CLI:

- Не задаёт никаких вопросов
- Печатает на stdout строки вида `{"event":"...","..."}` — по одной на действие
- Ошибки приходят со стабильным `code` и `next_action` — агент знает что делать без парсинга prose

### Стрим событий

```jsonl
{"event":"auth_required","url":"https://app.layero.ru/cli?code=ABCD-1234","user_code":"ABCD-1234"}
{"event":"authorized","user":"alice"}
{"event":"detected","framework":"vite","build_cmd":"npm run build","output_dir":"dist","confident":true}
{"event":"project_created","project_id":"...","slug":"my-site","organization":"alice"}
{"event":"packing","files":124,"bytes":2401234,"sha256":"abc123..."}
{"event":"uploading"}
{"event":"uploaded","archive_key":"..."}
{"event":"setup_applied"}
{"event":"deploy_started","deploy_id":"..."}
{"event":"stage","name":"install"}
{"event":"build_log","line":"npm install ...","stream":"stdout"}
{"event":"stage","name":"build"}
{"event":"build_log","line":"vite v5.0.0 building...","stream":"stdout"}
{"event":"ready","url":"https://alice-my-site.layero.ru/","preview_url":"https://alice-my-site-cli-3dc414d.preview.layero.ru/","dashboard_url":"https://app.layero.ru/projects/...","edge_ready":false,"edge_eta_seconds":592,"deploy_id":"..."}
```

`url` — живой публичный сайт (apex; CLI-загрузки авто-промоутятся в него).
`preview_url` доступен сразу — выдавайте его, если `edge_ready=false` (apex ещё
прогревается на первом деплое). `dashboard_url` — страница управления, не сайт.

### Коды ошибок

Полный канонический список — [JSON-events схема](./json-events.md). Кратко:

| `code` | `next_action` | Когда |
|---|---|---|
| `not_logged_in` | run: layero login | Токена нет в `~/.layero/config.json` |
| `auth_expired` / `auth_timeout` | run: layero login | Пользователь не подтвердил код за 15 минут |
| `invalid_type` | valid types: vite, next, ... | `--type` с неизвестным значением |
| `project_not_found` | run `layero projects list` | `--project` указывает на несуществующий проект |
| `project_unlinked` | delete .layero/project.json and re-run | Linked project удалён на сервере |
| `username_missing` | open https://app.layero.ru/onboarding | OAuth прошёл, но username не выбран |
| `no_organization` / `org_membership_missing` | available: foo, bar, ... | На аккаунте нет нужной организации |
| `cli_deploys_disabled` | enable in project settings | Админ выключил CLI-деплои |
| `deploy_failed` / `deploy_error` / `deploy_timed_out` | inspect logs at ... | Сборка не дошла до `ready` |

## Cold-start: что ваш агент должен делать

Если вы пишете системный промпт для агента (Cursor rules, Claude Code skills, CLAUDE.md), включите примерно такое:

```markdown
## Deployment

If the user asks to deploy a site to Layero:

1. Do NOT create a git repository or push to GitHub. Layero deploys local
   files directly.
2. Run `npx layero deploy --json` from the project root.
3. If output contains `{"event":"auth_required","url":"..."}` — render the
   URL as a clickable link in chat and wait. The user will click it once.
4. Continue waiting for additional JSON events. When you see
   `{"event":"ready","url":"..."}` — show `url` (the live site) to the user.
   If `edge_ready` is false, also give `preview_url` (reachable right away
   while the apex CDN edge warms up). Then stop.
5. If you see `{"event":"error","code":"...","next_action":"..."}` —
   follow next_action verbatim.
```

## Что НЕ делать

- ❌ `git init` + `gh repo create` перед деплоем — это лишний путь, агент часто туда сваливается по аналогии с Vercel/Netlify
- ❌ `npm install -g layero` — глобальная установка часто фейлится в песочнице агента. Используйте `npx layero` или `npm install -D layero`
- ❌ Открывать дашборд для «дописать setup» — `layero deploy` сейчас полностью inline, никакой ручной настройки в браузере между «upload» и «build» нет
- ❌ Просить пользователя запустить `layero login` отдельно — `layero deploy` сам стартует device-flow (`auth_required`), если токена нет
- ❌ Добавлять `--prod` / отдельный `promote` для CLI-проекта — прямая загрузка и так публикуется в apex автоматически; `--prod` тут избыточен. Изолированный preview, не трогающий apex, — это `--branch=<name>`

## Полная цепочка для агента

Самодостаточный рецепт, который работает с нуля (полностью cold-start, ничего не настроено):

```bash
# 1. Создать .layero/project.json + AGENTS.md (опционально, но удобно для будущих сессий)
npx layero init

# 2. Авторизоваться (один раз на машину; токен в ~/.layero/config.json)
npx layero login

# 3. Задеплоить
npx layero deploy --json
```

После `ready` показать юзеру URL и закончить. Дальнейшие правки → снова `npx layero deploy` → новый URL.
