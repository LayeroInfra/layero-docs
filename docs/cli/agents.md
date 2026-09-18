---
sidebar_position: 5
title: Деплой из AI-агентов
description: Как Cursor, Claude Code, Aider и другие AI-агенты могут задеплоить сайт через Layero без git-репозитория и без визарда в браузере.
---

# Деплой из AI-агентов

Layero CLI задизайнен так, чтобы AI-агент (Cursor, Claude Code, Aider, Continue и т.д.) мог задеплоить сайт **за один разговор**, без git-инициализации и без визарда в дашборде. Единственное действие от пользователя — один клик по URL для логина.

:::note[Это один из трёх путей агента]

CLI — путь для **папки с кодом**. Если у проекта уже есть подключённый
репозиторий, агенту достаточно `git push`; если сайт уже опубликован и его
надо диагностировать или настроить — это MCP. Развилка, навык и команды
установки — в разделе [AI-агенты](../agents/index.md).

:::

## Целевой сценарий

```
Пользователь: задеплой этот лендинг через layero
Агент:        Сейчас. Открой https://app.layero.ru/cli?code=ABCD-1234 и подтверди.
              (юзер открывает ссылку, кликает «Authorize», возвращается в чат)
Агент:        ✓ Live at https://my-landing-abc123.layero.app
```

Никаких `git init`, никаких `gh repo create`, никаких походов в дашборд. После этого юзер может попросить агента «поменяй кнопку на красную» и снова «задеплой» — сайт обновится на том же адресе.

## Чтобы агент знал что делать

### Способ 1 — проектный файл (главный)

В директории проекта запустите один раз:

```bash
npx layero@latest init
```

Команда дописывает блок в существующие `AGENTS.md` / `CLAUDE.md` / `.cursorrules` (или создаёт `AGENTS.md`). Блок содержит: device-flow рецепт логина (`auth_required` → клик → poll), таблицу JSON-событий с пояснениями (`detected` / `project_created` / `build_log` / `ready` / `error`), список кодов ошибок с remediation (`auth_required`, `auth_expired`, `cli_deploys_disabled`, ...), правила для `--prod`. Посмотреть точный текст проще всего по факту: запустите `npx layero@latest init` в пустой папке и откройте созданный `AGENTS.md`.

Любой современный агент читает эти файлы в начале сессии и точно знает что делать без подсказок.

### Способ 2 — cold-start (агент видит Layero впервые)

Если в проекте нет `AGENTS.md`, агент догадывается из контекста запроса юзера. Когда пользователь говорит «задеплой через layero», агент:

1. Делает WebFetch на `https://layero.ru/llms.txt` — каноническая страница для AI-агентов с готовым рецептом.
2. Или WebSearch «layero deploy» — попадает в эту страницу документации.

Оба пути ведут к одной команде: `npx layero@latest deploy`.

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
{"event":"ready","url":"https://my-site.layero.app/","dashboard_url":"https://app.layero.ru/projects/...","deploy_id":"..."}
```

`url` — живой публичный сайт (apex; CLI-загрузки авто-промоутятся в него),
доступен сразу — его и показывайте пользователю. `dashboard_url` — страница
управления, не сайт. Поля `preview_url` / `edge_ready` — legacy времён CDN,
гейтить показ ссылки на них не нужно (см. [JSON-events схема](./json-events.md)).

### Когда детект ошибся

Событие `detected` — быстрая локальная догадка: `layero.json` она не читает и
может уверенно ошибаться. `framework: "static"` у папки без `index.html` в
корне значит «ничего не узнал», а не «это статика». Сервер лечится
`-t node_web`, подпапка монорепо — `--root apps/web`, всё остальное — одним
полем в [`layero.json`](../deploys/layero-json.md): там таблица «симптом → что
править» и строки лога, по которым видно, что значение применилось.

### Коды ошибок

Полный канонический список — [JSON-events схема](./json-events.md). Кратко:

| `code` | `next_action` | Когда |
|---|---|---|
| `auth_required` | `layero login` или `LAYERO_TOKEN` | Токена нет ни в `~/.layero/config.json`, ни в переменной |
| `auth_expired` / `auth_timeout` | run: layero login | Пользователь не подтвердил код за 15 минут |
| `invalid_type` | valid types: vite, next, ... | `--type` с неизвестным значением |
| `project_unknown` | запустить из каталога проекта или `--project` | Команда вызвана вне проекта |
| `project_not_found` | run `layero projects list` | `--project` указывает на несуществующий проект |
| `cli_deploys_disabled` | enable in project settings | Админ выключил CLI-деплои |
| `prebuilt_no_dir` / `prebuilt_no_index` | указать `--prebuilt ./dist` | Каталога сборки нет или в нём нет `index.html` |
| `deploy_not_started` | повторить `layero deploy` | Сборка не стартовала |
| `deploy_failed` | inspect logs at ... | Сборка не дошла до `ready` |
| `internal` | перезапустить с `--debug` | Непредвиденная ошибка CLI |

Полный список — на странице [JSON-события](./json-events). Кодов
`not_logged_in`, `project_unlinked`, `username_missing`,
`org_membership_missing`, `no_organization`, `deploy_error` и
`deploy_timed_out` **не существует** — они были в ранних версиях CLI и удалены.

## Cold-start: что ваш агент должен делать

Если вы пишете системный промпт для агента (Cursor rules, Claude Code skills, CLAUDE.md), включите примерно такое:

```markdown
## Deployment

If the user asks to deploy a site to Layero:

1. If the project already has a repository connected to Layero, commit and
   push — that is the deploy. Otherwise do NOT create a git repository:
   Layero deploys local files directly.
2. Run `npx layero@latest deploy --json` from the project root.
3. If output contains `{"event":"auth_required","url":"..."}` — render the
   URL as a clickable link in chat and wait. The user will click it once.
4. Continue waiting for additional JSON events. When you see
   `{"event":"ready","url":"..."}` — show `url` (the live site) to the user.
   It is reachable right away; do not gate on `edge_ready`. Then stop.
5. If you see `{"event":"error","code":"...","next_action":"..."}` —
   follow next_action verbatim.
```

## Что НЕ делать

- ❌ `git init` + `gh repo create` перед деплоем — это лишний путь, агент часто туда сваливается по аналогии с Vercel/Netlify. Другое дело, если репозиторий **уже подключён** к Layero — тогда деплой это `git push`, см. [Подключение репозитория](../deploys/git-providers.md)
- ❌ `npm install -g layero` — глобальная установка часто фейлится в песочнице агента. Используйте `npx layero@latest` или `npm install -D layero`
- ❌ Открывать дашборд для «дописать setup» — `layero deploy` сейчас полностью inline, никакой ручной настройки в браузере между «upload» и «build» нет
- ❌ Просить пользователя запустить `layero login` отдельно — `layero deploy` сам стартует device-flow (`auth_required`), если токена нет
- ❌ Добавлять `--prod` / отдельный `promote` для CLI-проекта — прямая загрузка и так публикуется в apex автоматически, `--prod` тут ничего не меняет. Важнее обратное следствие: обычный `deploy` — **не** безобидное превью, он заменяет то, что видят посетители. И обойти это из CLI нечем: `--branch` для архивной загрузки отклоняется кодом `branch_unsupported` (см. [`layero deploy`](./deploy.md)). Если пользователю нужна версия «на посмотреть», не трогающая живой адрес, — это делается через подключённый репозиторий и пуш в ветку: `npx layero@latest projects create --repo <provider>:<owner/repo>`

## Полная цепочка для агента

Самодостаточный рецепт, который работает с нуля (полностью cold-start, ничего не настроено):

```bash
# 1. Создать .layero/project.json + AGENTS.md (опционально, но удобно для будущих сессий)
npx layero@latest init

# 2. Авторизоваться (один раз на машину; токен в ~/.layero/config.json)
npx layero@latest login

# 3. Задеплоить
npx layero@latest deploy --json
```

После `ready` показать юзеру URL и закончить. Дальнейшие правки → снова `npx layero@latest deploy` → новый URL.
