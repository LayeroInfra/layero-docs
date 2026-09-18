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
- **Каждая команда** печатает события — с 0.10.0 и `whoami`, `projects`, `orgs`, `link`, `hooks`, `logout`, `init`
- Код выхода различает классы ошибок — см. [Коды выхода](#коды-выхода)

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

### `prebuilt`

Деплой идёт с готовой сборкой (`--prebuilt <dir>`) — установка зависимостей
и сборка на стороне платформы пропускаются.

| поле | тип |
|---|---|
| `dir` | string — папка с артефактом |

### `runtime_type_applied`

Проект определён как runtime-приложение, и тип проставлен автоматически.

| поле | тип |
|---|---|
| `project_type` | `ssr_next` · `node_web` · `python_web` · `streamlit` · `gradio` · `flask` |

### `runtime_type_apply_failed`

Тип определился, но проставить его не удалось. Деплой продолжается с прежним
типом проекта.

| поле | тип |
|---|---|
| `error` | string |

### `setup_applied`

Применили настройки проекта (`framework_hint` / `build_cmd` / `output_dir`) на первом деплое. Без полей.

### `repeated_failure_guard`

Подряд идущие сборки упали с **одной и той же** ошибкой, и платформа
остановилась, не запустив следующую. Событие несёт сам текст ошибки: агент,
дошедший до повтора, её обычно не читал — она приходит в конце длинного лога
сборки, а он смотрит на код возврата.

Дальше CLI либо спросит подтверждение (интерактивный терминал), либо завершится
с кодом `repeated_failure`. Продолжить автоматически нельзя — это ровно тот
цикл, который правило разрывает.

| поле | тип |
|---|---|
| `streak` | number — сколько отказов с этой ошибкой насчитано |
| `threshold` | number — порог, на котором срабатывает стоп |
| `scope` | `"project"` \| `"owner"` — где насчитано: в этом проекте или суммой по всем вашим проектам |
| `failure_stage` | string, опционально — стадия сборки |
| `error` | string, опционально — текст ошибки |

`scope: "owner"` отвечает на вопрос, который возникает первым: «я собирал здесь
три раза, откуда десять?». Одна и та же ошибка считается и по всем проектам
владельца сразу — перенос приложения в новый проект правило не обходит, потому
что причина не в проекте.

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
| `url` | string | **Живой публичный адрес сайта** — НЕ дашборд. Для обычного `layero deploy` CLI-проекта это production-адрес проекта (CLI-загрузки авто-промоутятся в apex). Для проекта с репозиторием, где CLI-загрузка не промоутится, — адрес окружения `cli` (`--branch` у `deploy` отклоняется, см. `branch_unsupported`). Адрес живой сразу; открывайте и показывайте пользователю именно его. |
| `dashboard_url` | string? | Страница управления проектом в дашборде (`https://app.layero.ru/projects/<id>`). Это НЕ сайт — не выдавайте её как ссылку на готовый сайт. |
| `preview_url` | string? | **Legacy, больше не приходит.** Отдельный per-deploy preview-хост в зоне `*.preview.layero.ru`. Существовал, чтобы дать ссылку, пока apex прогревался на CDN. Отдельной preview-зоны у `layero.app` нет, а на `layero.ru` пользовательских сайтов не осталось — поле не заполняется ни для одного проекта. |
| `edge_ready` | bool? | Отвечает ли адрес на момент завершения деплоя. Раньше поле означало «apex прогрелся на CDN» и у новых хостов навсегда оставалось `false`; теперь берётся из реальной пробы. Как гейт всё равно не нужно: адрес живой сразу. |
| `edge_eta_seconds` | number? | **Legacy, больше не приходит.** Оценка остатка прогрева CDN. Распространять нечего — CDN перед пользовательскими сайтами нет. |
| `deploy_id` | string | |

### `promoted`

Апекс переведён на указанный деплой. Приходит от `layero promote` и от
`layero deploy --promote`.

| поле | тип |
|---|---|
| `url` | string — публичный адрес |
| `deploy_id` | string |

### `data_api_enabled`

Итог `layero data enable`: у базы включён Data API.

| поле | тип | примечание |
|---|---|---|
| `org` | string | slug организации |
| `database` | string | слаг или id базы |
| `slug` | string | адрес базы в Data API: `https://data.layero.ru/<slug>` |
| `public_key` | string \| null | публичный ключ для сайта — полное значение, приходит один раз |
| `secret_key` | string \| null | секретный ключ — только с `--with-secret`; хранить на сервере, в код сайта не класть |
| `reapplied` | boolean | `true` — Data API у базы уже был включён и переприменён через `--repair` |

### `data_keys`

Итог `layero data keys list`. Значений ключей в событии нет никогда — только префиксы.

| поле | тип | примечание |
|---|---|---|
| `org` | string | slug организации |
| `database` | string | слаг или id базы |
| `keys` | array | ключи: `id`, `kind` (`public` \| `secret`), `prefix`, `label`, `created_at`, `last_used_at`, `expires_at` (string \| null), `in_build` (boolean — ключ подставляется в сборку сайта), `service` (boolean) |

### `data_key_issued`

Итог `layero data keys issue`. Полное значение ключа приходит один раз — сохраните его сразу.

| поле | тип | примечание |
|---|---|---|
| `org` | string | slug организации |
| `database` | string | слаг или id базы |
| `id` | string | id ключа — им ключ отзывают |
| `kind` | string | `public` или `secret` |
| `prefix` | string | начало ключа, по нему ключ узнают в списке |
| `key` | string | полное значение ключа |
| `expires_at` | string \| null | когда ключ перестанет действовать; `null` — бессрочный |

### `data_key_revoked`

Итог `layero data keys revoke`.

| поле | тип |
|---|---|
| `org` | string — slug организации |
| `database` | string — слаг или id базы |
| `id` | string — id отозванного ключа |

### `data_origins`

Итог `layero data origins list`: сайты, с которых браузер может обращаться к Data API.

| поле | тип | примечание |
|---|---|---|
| `org` | string | slug организации |
| `database` | string | слаг или id базы |
| `origins` | array | добавленные вручную: `origin`, `note` (string \| null) |
| `from_projects` | string[] | адреса проектов организации — разрешены без добавления |
| `localhost_allowed` | boolean | разрешены ли запросы с `localhost` |

### `data_origin_added` и `data_origin_removed`

Итог `layero data origins add` и `layero data origins remove`.

| поле | тип |
|---|---|
| `org` | string — slug организации |
| `database` | string — слаг или id базы |
| `origin` | string — адрес сайта |

### `data_methods`

Итог `layero data methods`: таблицы и функции базы с уровнем доступа по каждому методу. Уровни: `closed` — закрыто, `visitor` — любой посетитель, `user` — вошедшие, `server` — только сервер.

| поле | тип | примечание |
|---|---|---|
| `org` | string | slug организации |
| `database` | string | слаг или id базы |
| `tables` | array | `schema`, `name`, `kind` (`table` \| `view`), `rls` (boolean \| null), `path`, `profile` (string \| null), `shadowed_by` (string \| null), `levels` (`GET`, `POST`, `PATCH`, `DELETE` → уровень), `writable` (какие из `POST`, `PATCH`, `DELETE` таблица принимает) |
| `functions` | array | `schema`, `name`, `args`, `kind` (`function` \| `procedure`), `signature`, `path` (string \| null — `null`, если по HTTP не вызывается), `overloaded` (boolean), `level`, `public_only` (boolean) |
| `warnings` | string[] | всегда есть; по строке на таблицу, право на которую не работает: у роли нет USAGE на её схему, и шлюз таблицы не видит. В строке — что сделать. Пусто — предупреждений нет |

### `data_grant`

Показ и итог `layero data grant`. Без `--yes` вне терминала событие приходит с `applied: false`, а следом — `error` с кодом `confirmation_required` или `data_levels_blocked`. После применения — `applied: true`, и `current` описывает состояние после.

| поле | тип | примечание |
|---|---|---|
| `org` | string | slug организации |
| `database` | string | слаг или id базы |
| `object` | object | `kind` (`table` \| `view` \| `function` \| `procedure`), `schema`, `name`, `args` — только у функций |
| `current` | object | метод → уровень сейчас; у функции — только `POST` |
| `next` | object | метод → уровень после применения |
| `sql` | string[] | команды, которые выполнит применение |
| `warnings` | string[] | предупреждения, включая причины из `blocked` |
| `blocked` | string[] | почему применить нельзя; пусто — можно |
| `applied` | boolean | применено ли |
| `next_action` | string | только когда нужно подтверждение — готовая команда повтора |

### `data_probe`

Итог `layero data probe`: ответ шлюза на пробу метода Data API. Запрос настоящий, запись откатывается. Не откатываются номера последовательностей, внешние вызовы из базы, сессионные блокировки и суточная квота вызовов.

Событие приходит всегда, когда шлюз ответил. Код выхода — по одному правилу, по порядку:

1. откат записи не подтверждён — ошибка `data_probe_not_rolled_back`;
2. статус совпал с `--expect` — 0;
3. шлюз ответил `5xx` — ошибка `data_probe_gateway_failed`;
4. статус не совпал с `--expect` — ошибка `data_probe_unexpected_status`;
5. иначе 0, в том числе на отказ `4xx`: `401`, `403`, `404` — ответ пробы, а не сбой.

Ошибка приходит событием `error` следом за `data_probe`.

| поле | тип | примечание |
|---|---|---|
| `org` | string | slug организации |
| `database` | string | слаг или id базы |
| `request` | object | `method`, `path`, `as`, `user_id`, `query`, `schema` — что ушло в пробу; `schema` в нижнем регистре, у функций и `/whoami` — `null`; тело не повторяется |
| `status` | number | HTTP-статус ответа шлюза |
| `elapsed_ms` | number | время запроса к шлюзу |
| `caller` | string \| null | кем шлюз посчитал запрос: `visitor`, `user`, `server`; `null` — ключ или токен не приняты |
| `rows` | number \| null | строк в ответе |
| `total` | number \| null | строк, видимых роли, — из `Content-Range` |
| `owner_total` | number \| null | строк в таблице у владельца — знаменатель «N из M». `null` — не посчитали; `total` вместо него не подставляйте: это счёт самой роли |
| `rollback_expected` | boolean | откат ожидался — у всего, кроме `/whoami` |
| `rolled_back` | boolean | шлюз подтвердил откат |
| `not_rolled_back` | boolean | `true` — откат ожидался, ответ 200–399, а подтверждения нет: данные могли измениться. Следом придёт `error` с кодом `data_probe_not_rolled_back` |
| `body_truncated` | boolean | ответ длиннее 64 КБ, в `body` только его начало |
| `headers` | object | только `content-type`, `content-range`, `x-layero-caller`, `x-layero-key` (префикс ключа), `x-layero-user`, `x-layero-rolled-back` |
| `body` | any | тело ответа: JSON или строка |

### `claimable`

Деплой без аккаунта (`layero deploy --claim`, либо автоматически: нет токена,
среда агентская — не терминал и не CI, — передан `--yes` и проект новый). Платформа
завела временный проект и выдала токен на него; сайт живёт 72 часа. Событие
приходит **до** `ready`: после `ready` агент не читает, а без ссылки сайт
исчезнет вместе со сроком.

| поле | тип | примечание |
|---|---|---|
| `project_id` | string | |
| `slug` | string | |
| `url` | string | живой адрес сайта — тот же, что в `ready` |
| `claim_url` | string | ссылка, по которой человек забирает проект в свой аккаунт. Принять заявку может только человек в панели — CLI и агент этого не делают |
| `expires_at` | string | ISO-8601 — когда сайт и токен перестанут действовать |

Код заявки сохраняется в `.layero/project.json` (`claim`), токен — в
`~/.layero/config.json`; повторный `layero deploy` в той же папке обновляет
тот же сайт до истечения срока. В CI автоматически не включается: раннер без
`LAYERO_TOKEN` получает `auth_required`.

Песочница создаёт только **новый** проект. Если передан `--project` или папка
привязана к проекту аккаунта (`.layero/project.json` без поля `claim`), а
токена нет, CLI начинает вход: событие `auth_required` с `url` и `user_code`.
До 0.10.5 в агентской среде с `--yes` здесь включалась песочница, и платформа
отвечала `username_required`. Токен песочницы из `~/.layero/config.json`
идёт только в свой проект.

### `claim_status`

Итог `layero claim status [code]`. Без кода — из `.layero/project.json`.

| поле | тип |
|---|---|
| `code` | string |
| `status` | string — состояние заявки на сервере (`unclaimed`, `claimed`, `expired`) |
| `claimed` | boolean |
| `expires_at` | string \| null |
| `url` | string \| null — адрес сайта |
| `claim_url` | string \| null |

### `claim_accept`

Итог `layero claim accept [code]`. В терминале CLI открывает `claim_url` в
браузере, в агентском режиме — только печатает: подтвердить заявку должен
человек, вошедший в панель.

| поле | тип |
|---|---|
| `code` | string |
| `claim_url` | string |
| `opened` | boolean — открыт ли браузер |

### `me`

Итог `layero whoami`.

| поле | тип |
|---|---|
| `id` | string |
| `username` | string \| null |
| `email` | string \| null |
| `github_login` | string \| null |

### `logged_out`

Итог `layero logout`.

| поле | тип |
|---|---|
| `config_path` | string — удалённый файл с токеном |

### `projects`

Итог `layero projects list`.

| поле | тип |
|---|---|
| `projects` | array — `id`, `slug`, `name`, `organization`, `url` (живой адрес), `source_type` (`cli` \| `github` \| `git`), `repo` (string \| null — `owner/repo` подключённого репозитория), `status` |

### `organizations`

Итог `layero orgs list`.

| поле | тип |
|---|---|
| `organizations` | array — `id`, `slug`, `kind` (`personal` \| `team`), `role` (`admin` \| `member`) |

### `init_done`

Итог `layero init` (после `detected`).

| поле | тип |
|---|---|
| `framework` | string |
| `agent_docs` | array — `file` (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`), `result` (`created` \| `updated` \| `unchanged`) |
| `project_json` | `created` \| `unchanged` |

### `hooks`, `hook_created`, `hook_deleted`

Итоги `layero hooks list`, `hooks create`, `hooks delete`. Адрес хука —
секрет: кто угодно с ним запускает сборку.

| поле | тип | событие |
|---|---|---|
| `project` | string — id проекта | все три |
| `hooks` | array — `id`, `name`, `branch` (string \| null), `target` (`preview` \| `production`), `url`, `last_triggered_at` (string \| null) | `hooks` |
| `id`, `name`, `branch`, `target`, `url` | как в списке | `hook_created` |
| `id` | string | `hook_deleted` |

### `sources`

Итог `layero sources list`: провайдеры, которые платформа умеет, и
подключения организации. Токенов в событии нет — платформа их не отдаёт.

| поле | тип |
|---|---|
| `org` | string — slug организации |
| `providers` | array — `id` (`gitverse`, `gitlab`, `gitflic`, `sourcecraft`, …), `title`, `self_hosted` (boolean — принимает `--base-url`), `webhook_supported` (boolean — `false` у SourceCraft: автосборки на push там не будет), `token_hint` (string \| null — где выпустить токен и с какими правами) |
| `connections` | array — `id`, `provider`, `account` (string \| null — логин владельца токена), `status` (`active` \| `invalid`), `projects_count`, `token_expiry_state` (`ok` \| `soon` \| `today` \| `expired` \| `unknown`), `last_error` (string \| null) |

### `source_connected`

Итог `layero sources connect <provider>` и шаг `layero projects create --repo`.

| поле | тип |
|---|---|
| `org` | string |
| `connection_id` | string — id подключения (у GitHub App — ключ аккаунта `github:<installation>`) |
| `provider` | string |
| `account` | string \| null |

### `source_repos`

Итог `layero sources repos <connection_id>`.

| поле | тип |
|---|---|
| `org` | string |
| `connection_id` | string |
| `repos` | array — `path` (`owner/repo`, у GitLab — `group/sub/project`), `name`, `default_branch`, `private`, `can_admin` (boolean — хватит ли прав завести вебхук), `updated_at` (string \| null) |

### `webhook_installed` и `webhook_unavailable`

Шаг `layero projects create --repo`. Отдельным событием, а не полем: без
вебхука push в репозиторий не собирается, и агент обязан сказать это
человеку словами. Репозиторий при `webhook_unavailable` **уже привязан** —
деплой по кнопке и по `layero deploy` работает, автосборка включится после
ручной настройки вебхука по `url`.

| поле | тип | событие |
|---|---|---|
| `project` | string — slug | оба |
| `url` | string — адрес вебхука; у GitHub App поля нет: там вебхук — часть установки, своего адреса у него нет | оба |
| `hint` | string — почему не вышло и что сделать | `webhook_unavailable` |

### `setup_applied`, `deploy_started`, `setup_pending`, `setup_failed`

Завершение мастера в `layero projects create --repo` (с 0.10.2). Раньше
команда останавливалась на привязке: проект оставался в `pending_setup`, и
первая сборка ждала клика «Начать деплой» в панели. Теперь команда делает то
же, что кнопка: берёт подсказку детекта, применяет её и запускает сборку.

| событие | поля | смысл |
|---|---|---|
| `setup_applied` | `project`, `framework`, `build_cmd` (string \| null), `output_dir` (string \| null), `layero_found` (boolean) | Настройки применены. Пустые поля не заглушка: чем собирать, решит сборщик по репозиторию |
| `deploy_started` | `project`, `deploy_id`, `url` | Первая сборка запущена; следить — `layero deploys list --project <slug>` |
| `setup_pending` | `project`, `url`, `hint` | `--no-deploy`: проект оставлен в мастере, сборок не будет, пока настройку не завершат по `url` |
| `setup_failed` | `project`, `reason`, `url`, `hint` | Детект, настройка или запуск сборки не удались. Проект **создан**, выход 0 — сказать человеку завершить в панели по `url` |

### `environments`

Итог `layero envs list`. Окружение и ветка — одна сущность: у CLI-проекта
оно одно (`cli`), у проекта с репозиторием — по ветке. Архивные и снятые с
раздачи не входят.

| поле | тип |
|---|---|
| `project` | string — slug |
| `environments` | array — `id`, `branch`, `url` (адрес окружения), `hostname`, `active_deploy_id` (string \| null), `active_deploy_at` (string \| null), `production` (boolean — это production-ветка) |

### `project_deleted`

Итог `layero projects delete <slug> --yes`. Очистка ресурсов (CDN, S3,
сертификаты, вебхук) идёт в фоне; адрес и слаг освобождены сразу.

| поле | тип |
|---|---|
| `project_id` | string |
| `slug` | string |

### `error`

| поле | тип |
|---|---|
| `code` | string — см. таблицу ниже |
| `next_action` | string — конкретная команда / URL для разрешения |
| `message` | string — человекочитаемое описание |

## Коды ошибок

Список сверен с исходниками CLI: это все коды, которые он действительно
выдаёт. Не изобретайте обработку кодов, которых здесь нет.

| `code` | Когда происходит | Что делать (`next_action`) |
|---|---|---|
| `auth_required` | Нет токена ни в `~/.layero/config.json`, ни в `LAYERO_TOKEN` | `layero login`, либо задать `LAYERO_TOKEN` |
| `auth_expired` | Вход больше не действует: либо `user_code` истёк (15 мин TTL) и пользователь не подтвердил, либо сохранённый токен протух (TTL 7 дней) или сессия отозвана — API ответил `401` | Запустить `layero login` ещё раз |
| `auth_timeout` | CLI поллил 15 минут, юзер так и не подтвердил | Запустить `layero login` ещё раз |
| `plan_limit` | Лимит тарифа: API ответил `402` (например, проектов на free-тарифе больше, чем разрешено) | Сменить тариф на `app.layero.ru/billing` или удалить ненужное |
| `username_required` | У аккаунта не выбрано имя (оно же адрес личной организации) — API отвечает `412`. В интерактивном терминале `login` и `deploy` спрашивают имя сами, в агентском режиме спрашивать некого | `layero username <имя>` |
| `username_rejected` | Имя занято, зарезервировано или не проходит по формату | Выбрать другое: строчные латинские буквы, цифры и дефис, 2–32 символа |
| `oauth_unavailable` | Провайдер входа недоступен | Это на нашей стороне — попробовать позже |
| `project_unknown` | Команда вызвана вне каталога проекта и без `--project` | Запустить из каталога проекта или передать `--project <id\|slug>` |
| `project_not_found` | `--project` указывает на несуществующий проект | `layero projects list` |
| `cli_deploys_disabled` | Админ выключил CLI-деплои в проекте | Включить в Project Settings → CLI deploys, либо деплоить в другой проект |
| `invalid_type` | `--type` с неизвестным значением | Убрать флаг (авто-детект) или передать валидный пресет — список в сообщении |
| `invalid_choice` | Интерактивный prompt получил невалидный выбор в non-TTY | Передать значение явным флагом |
| `prebuilt_no_dir` | Каталог из `--prebuilt` не найден | Указать явно: `--prebuilt ./dist` |
| `prebuilt_no_index` | В каталоге `--prebuilt` нет `index.html` | Указать папку со собранным `index.html` |
| `deploy_not_started` | Сборка не стартовала | Повторить `layero deploy`; если повторяется — смотреть проект в дашборде |
| `deploy_failed` | Билд не дошёл до `ready` | Открыть логи по ссылке из `next_action` |
| `repeated_failure` | Подряд идущие сборки падают с **одной и той же** ошибкой, и платформа отказалась выкатывать следующую вслепую. Текст ошибки — в `message` и в событии `repeated_failure_guard` | Прочитать ошибку и устранить причину. Повтор без изменений даст тот же результат. Если причина уже устранена — `layero deploy --confirm-repeated-failure` |
| `repeated_failure_declined` | То же, но в интерактивном терминале на вопрос «Всё равно выкатить?» ответили «нет» | Исправить ошибку и запустить `layero deploy` заново |
| `no_deploy` / `no_deploys` | У проекта ещё нет деплоев | Сначала `layero deploy` |
| `rollback_unsupported` | У деплоя нет раздаваемого артефакта: runtime-проект либо вычищенная по ретенции статика | Пересобрать нужный коммит через `layero deploy` |
| `rollback_noop` | Цель отката уже на живом адресе — например, второй `layero rollback` подряд. Ничего не изменено, выход `4` | Точечно — `layero promote <sha>`; список — `layero deploys list` |
| `env_not_found` | Переменной нет | `layero env list` |
| `nothing_to_set` | `layero env set` вызван без пары `KEY=value` | `layero env set KEY=value` |
| `bad_format` | Аргумент не разобран | Формат — в сообщении |
| `domain_not_found` | Домена нет у проекта | `layero domains list` |
| `domain_rejected` | Платформа отклонила домен | Причина — в сообщении |
| `forbidden` | Операции не хватает scope у токена CI (`layero_ci_*`) | Выпустить токен с нужным scope |
| `org_unknown` | У аккаунта несколько организаций, а команда не знает, в какой работать | Передать `--org <slug>`; список — `layero orgs list` |
| `database_unknown` | В организации нет базы с таким именем, слагом или id. У `layero data enable --repair` — база не указана через `--db`: переприменение снимает у ролей API права на схему `public`, и базу не угадываем | `layero db list`; завести — `layero db create <имя>`. Для `--repair` — `layero data enable --db <база> --repair` |
| `sql_missing` | `layero db sql` вызван без запроса | Передать запрос следом за именем базы: `layero db sql моя-база "select 1"` |
| `gb_not_supported` | `layero db create --gb` — объём базы так не выбирается. Флаг остался ради этого отказа: раньше он молча ничего не делал | У базы из тарифа объём задан тарифом, у выделенного инстанса — диском ступени |
| `dedicated_needs_panel` | `layero db create --cpu/--ram/--dedicated` — выделенный инстанс из терминала не заказывается: у него есть цена и заморозка денег на карте, а подтвердить сумму в терминале негде | Заказать в панели: адрес приходит в `next_action` |
| `branch_without_env` | Для ветки ещё нет окружения | Сначала задеплоить эту ветку |
| `analytics_not_connected` | Аналитика не подключена | `layero analytics connect` |
| `no_runs` | Нет прогонов замера скорости | `layero perf check` |
| `data_api_disabled` | `layero data …` вызван для базы, у которой Data API не включён | `layero data enable --db <база>` |
| `data_key_kind` | `layero data keys issue --kind` с неизвестным видом ключа | `--kind public` — ключ для сайта, `--kind secret` — для сервера |
| `data_key_expiry` | `--expires-in` с неподдерживаемым сроком | Допустимые сроки — в `next_action`, либо `never` |
| `data_key_unknown` | У базы нет действующего ключа с таким id или префиксом | `layero data keys list --db <база>` |
| `data_key_ambiguous` | Префикс совпал с несколькими ключами базы | Передать id ключа — список id в `next_action` |
| `data_levels_missing` | `layero data grant` вызван без единого уровня | Таблица: `--get visitor --post server …`; функция: `--call visitor` |
| `data_level_unknown` | Уровень доступа не из списка | `closed` — закрыто, `visitor` — любой посетитель, `user` — вошедшие, `server` — только сервер |
| `data_levels_blocked` | Платформа отказалась применять уровни: например, права выданы на отдельные колонки или схема принадлежит чужой роли. Причина — в `message`, изменения не отправлялись | Изменить запрос по тексту отказа; текущие уровни — `layero data methods --db <база>` |
| `data_api_already_enabled` | `layero data enable --db <база>` у базы, где Data API уже включён. Ничего не изменено: повторное включение сняло бы у ролей API права на схему `public` | Ключи — `layero data keys list --db <база>`, методы — `layero data methods --db <база>`; при `--with-secret` — выпуск секретного ключа `layero data keys issue --db <база> --kind secret`. Если роли или права на схему `api` испорчены вручную — `layero data enable --db <база> --repair`: вне терминала и с `--json` следом придёт `confirmation_required` с готовой командой `--repair --yes` |
| `confirmation_required` | Команда меняет доступ (отзыв ключа, удаление сайта, применение уровней, переприменение Data API — `layero data enable --repair`), а подтвердить её в агентском режиме некому. Ничего не изменено; план команд пришёл отдельным событием | Показать план человеку и повторить с `--yes` — готовая команда в `next_action` |
| `data_probe_method` | Метод не из `GET`, `POST`, `PATCH`, `DELETE`; `/whoami` не методом `GET`; функция (`/rest/v1/rpc/…`) не методом `GET` или `POST`. Запрос не отправлялся | Подходящий метод — в `next_action`, для `/whoami` и функции — готовой командой |
| `data_probe_path` | В пути пробы есть `?`, косая черта в конце или нет имени таблицы или функции (`/rest/v1/`, `/rest/v1/rpc/`). Запрос не отправлялся | Готовая команда со всеми переданными флагами — в `next_action`: параметры из `?` стали флагами `--query`, путь без косой черты. Для пути без имени — `layero data methods --db <база>` |
| `data_probe_query` | `--query` не в виде `имя=значение`, имя пустое, одно имя указано дважды или задано и в пути после `?`, и флагом `--query` | `--query select=id,title --query price=gt.100`; несколько условий на одну колонку — одним параметром `or=(…)` |
| `data_probe_body` | Тело пробы не разобрано: не JSON, не объект и не массив, файл не читается, заданы и `--body`, и `--body-file`, тело у `GET` и `DELETE`, или число в теле не передаётся точно — например, `9007199254740993` ушло бы как `9007199254740992` | Объект или массив JSON в `--body` либо `--body-file`, только для `POST` и `PATCH`; большое число — строкой в кавычках |
| `data_probe_as` | `--as` не из `visitor`, `user`, `server` либо `--user` без `--as user` | `--as visitor`, `--as user --user <id>` или `--as server` |
| `data_probe_user_required` | `--as user` без `--user`: не указано, от имени какого пользователя пробовать | `--user <id пользователя приложения>` |
| `data_probe_user_invalid` | `--user` — не UUID: платформа ждёт id пользователя приложения | Взять id в панели базы, в списке пользователей приложения |
| `data_probe_schema` | `--schema` у таблицы не из `api`, `public`, `app` или у функции не `api`: функции шлюз зовёт только из `api`. Без этой проверки платформа молча проигнорировала бы флаг. У `/whoami` схема отбрасывается без отказа, пустая — как без флага | У таблицы — `--schema api`, `public` или `app`; у функции — `api` или без флага. Без флага шлюз ищет таблицу в `api`, затем в `public`, затем в `app` |
| `data_probe_expect` | `--expect` не разобран: нужен статус (`200`), класс (`2xx`) или список через запятую | `--expect 200`, `--expect 2xx`, `--expect 201,204` |
| `data_probe_rejected` | Платформа отказала в пробе до запроса к шлюзу: путь не метод базы, у базы не включён вход, тело больше 64 КБ, больше 50 параметров, шлюз ещё не умеет пробу с откатом. Причина — в `message`, запрос не выполнялся. Отказ самого шлюза (`4xx`) приходит не этим кодом, а событием `data_probe` | Подсказка по случаю — в `next_action` |
| `data_probe_gateway_failed` | Шлюз не дал ответа: ответил `5xx` (например, `503` с `too_busy`) или не ответил платформе вовсе. Если шлюз ответил, событие `data_probe` пришло перед ошибкой. Статус, указанный в `--expect`, этой ошибкой не бывает | Повторить пробу позже |
| `data_probe_unexpected_status` | Статус ответа шлюза не совпал с `--expect`. Событие `data_probe` пришло перед ошибкой | Сверить ответ пробы с уровнями доступа: `layero data methods --db <база>` |
| `data_probe_not_rolled_back` | Проба записи прошла (ответ 200–399), а шлюз не подтвердил откат: данные могли измениться. Событие `data_probe` пришло перед ошибкой; `--expect` эту ошибку не снимает | Проверить данные базы; пробу записи не повторять, пока причина не найдена |
| `branch_unsupported` | `layero deploy --branch`: архивная загрузка не попадает в ветку — платформа кладёт каждый архив в окружение `cli`, что бы ни передали. До 0.10.0 флаг принимался и молча игнорировался. Ничего не упаковано и не загружено | Превью-ветки есть только у проектов с репозиторием: подключить его — `layero projects create --repo <provider>:<owner/repo>` — и пушить в ветку. У проекта с репозиторием в `next_action` — имя репозитория, куда пушить |
| `repo_format` | `--repo` не в виде `<provider>:<owner/repo>` или не передан | `layero projects create --repo github:acme/site`; провайдеры — `layero sources list` |
| `account_not_found` | В организации нет подключения к этому провайдеру, либо оно не активно (токен отозван, установка App приостановлена) | `layero sources connect <provider> --token-stdin`; GitHub — установить App в панели; адрес — в `next_action` |
| `repo_not_found` | Репозиторий не виден подключению: опечатка в пути или токену не хватает прав | Доступные пути — в `next_action`; полный список — `layero sources repos <connection_id>` |
| `repo_already_imported` | Репозиторий уже привязан к проекту организации | `layero link <id>` — привязать папку к нему |
| `source_connect_failed` | Проект создан, а репозиторий к нему не привязался (провайдер не ответил или отказал). Проект удалён, если у токена хватило прав; иначе остался без репозитория — сказано в `next_action` | Проверить подключение (`layero sources list`) и повторить; лишний проект — `layero projects delete <slug> --yes` |
| `provider_unknown` | `layero sources connect` с провайдером не из списка | Список — в `next_action` и в `layero sources list`; GitHub подключается установкой App |
| `token_missing` | `layero sources connect` без `--token` и без `--token-stdin` (или stdin пуст) | `echo "$PAT" \| layero sources connect <provider> --token-stdin` |
| `source_rejected` | Провайдер не принял токен (API ответил 502): неверный, отозван или без нужных прав | Где выпустить и с какими правами — в `next_action` (`token_hint` провайдера) |
| `connection_not_found` | `layero sources repos` с id, которого нет в организации | `layero sources list` |
| `hook_not_found` | `layero hooks delete` с id, которого у проекта нет (уже удалён?) | `layero hooks list` |
| `claimable_unavailable` | Деплой без аккаунта на платформе не включён (API ответил 404/501/503), исчерпан лимит заявок (429) либо платформа не вернула код заявки | Войти: `layero login` — или `LAYERO_TOKEN` |
| `claim_with_project` | `layero deploy --claim --project <проект>`: песочница создаёт новый проект и в существующий не выкатывает. Ничего не создано и не загружено | Для существующего проекта войти: `layero login` — и повторить без `--claim`; новый сайт без аккаунта — `--claim` без `--project` |
| `claim_unknown` | `layero claim status`/`accept` без кода и без заявки в `.layero/project.json`, либо заявка с таким кодом истекла или код неверный | Передать код; новый проект без аккаунта — `layero deploy --claim` |
| `internal` | Непредвиденная ошибка CLI (сеть, неожиданное исключение) | Перезапустить с `--debug` |

:::note[Код деплоя собирается из статуса]
Код неуспешного деплоя формируется как `deploy_<status>` по статусу сборки, а
статусов у деплоя четыре: `ready`, `building`, `failed`, `cancelled`. Значит на
практике встречаются ровно `deploy_failed` и `deploy_cancelled` — кодов
`deploy_error` и `deploy_timed_out` не существует, не закладывайтесь на них.
:::

## Коды выхода

С 0.10.0 код выхода различает классы ошибок — скрипту не нужно разбирать
событие `error`, чтобы понять, кто виноват. Класс берётся из кода ошибки.

| Код выхода | Класс | Коды `error` |
|---|---|---|
| `0` | успех | — |
| `1` | прочее | `plan_limit`, `forbidden`, `confirmation_required`, `repeated_failure`, `cli_deploys_disabled`, `username_required` и всё, что не попало в классы ниже |
| `2` | нужен вход | `auth_required`, `auth_expired`, `auth_timeout` |
| `3` | не найдено | `project_unknown`, `project_not_found`, `org_unknown`, `database_unknown`, `env_not_found`, `domain_not_found`, `hook_not_found`, `connection_not_found`, `account_not_found`, `repo_not_found`, `claim_unknown`, `branch_without_env`, `no_deploy`, `no_deploys`, `no_runs`, `data_key_unknown` |
| `4` | неверный ввод | `invalid_type`, `invalid_choice`, `prebuilt_no_dir`, `prebuilt_no_index`, `bad_format`, `nothing_to_set`, `rollback_noop`, `sql_missing`, `branch_unsupported`, `claim_with_project`, `provider_unknown`, `repo_format`, `token_missing`, `username_rejected`, `gb_not_supported`, `dedicated_needs_panel`, `data_key_kind`, `data_key_expiry`, `data_key_ambiguous`, `data_levels_missing`, `data_level_unknown`, `data_probe_method`, `data_probe_path`, `data_probe_query`, `data_probe_body`, `data_probe_as`, `data_probe_user_required`, `data_probe_user_invalid`, `data_probe_schema`, `data_probe_expect` |
| `5` | удалённая ошибка | `deploy_failed`, `deploy_cancelled`, `deploy_not_started`, `internal`, `oauth_unavailable`, `claimable_unavailable`, `data_probe_gateway_failed`, любой `deploy_<status>` и `http_5xx` |

## Cold-start template для агента

Минимальный поведенческий блок (положите в системный промпт):

```text
If user asks to deploy via Layero:
  1. Run: npx layero@latest deploy --json
  2. Parse each stdout line as JSON, route on .event:
     - "auth_required" → render .url as clickable link, keep waiting
     - "ready" → show .url (the live site) to user. It is reachable right
                 away — do NOT gate on .edge_ready. Then stop.
     - "error" → follow .next_action verbatim
  3. Never run `git init`. Never run `npm install -g layero`.
```

Полный пример — [Деплой из AI-агентов](./agents.md).
