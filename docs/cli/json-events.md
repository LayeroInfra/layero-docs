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
| `url` | string | **Живой публичный адрес сайта** — НЕ дашборд. Для обычного `layero deploy` CLI-проекта это production-адрес проекта (CLI-загрузки авто-промоутятся в apex). Для деплоя в конкретную ветку (`--branch`) — preview-адрес ветки. Адрес живой сразу; открывайте и показывайте пользователю именно его. |
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

### `data_keys`

Итог `layero data keys list`. Значений ключей в событии нет никогда — только префиксы.

| поле | тип | примечание |
|---|---|---|
| `org` | string | slug организации |
| `database` | string | слаг или id базы |
| `keys` | array | ключи: `id`, `kind` (`public` \| `secret`), `prefix`, `label`, `created_at`, `last_used_at`, `expires_at` (string \| null), `in_build` (boolean — ключ подставляется в сборку сайта), `service` (boolean) |

### `data_key_issued`

Итог `layero data keys create`. Полное значение ключа приходит один раз — сохраните его сразу.

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
| `warnings` | string[] | всегда есть; почему часть методов не работает так, как показано: право в схеме без доступа к ней, права, которые платформа снимет. Пусто — предупреждений нет |

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
| `request` | object | `method`, `path`, `as`, `user_id`, `query`, `schema` — что ушло в пробу; `schema` в нижнем регистре, тело не повторяется |
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
| `env_not_found` | Переменной нет | `layero env list` |
| `nothing_to_set` | `layero env set` вызван без пары `KEY=value` | `layero env set KEY=value` |
| `bad_format` | Аргумент не разобран | Формат — в сообщении |
| `domain_not_found` | Домена нет у проекта | `layero domains list` |
| `domain_rejected` | Платформа отклонила домен | Причина — в сообщении |
| `forbidden` | Операции не хватает scope у токена CI (`layero_ci_*`) | Выпустить токен с нужным scope |
| `org_unknown` | У аккаунта несколько организаций, а команда не знает, в какой работать | Передать `--org <slug>`; список — `layero orgs list` |
| `database_unknown` | В организации нет базы с таким именем, слагом или id | `layero db list`; завести — `layero db create <имя>` |
| `sql_missing` | `layero db sql` вызван без запроса | Передать запрос следом за именем базы: `layero db sql моя-база "select 1"` |
| `gb_not_supported` | `layero db create --gb` — объём базы так не выбирается. Флаг остался ради этого отказа: раньше он молча ничего не делал | У базы из тарифа объём задан тарифом, у выделенного инстанса — диском ступени |
| `dedicated_needs_panel` | `layero db create --cpu/--ram/--dedicated` — выделенный инстанс из терминала не заказывается: у него есть цена и заморозка денег на карте, а подтвердить сумму в терминале негде | Заказать в панели: адрес приходит в `next_action` |
| `branch_without_env` | Для ветки ещё нет окружения | Сначала задеплоить эту ветку |
| `analytics_not_connected` | Аналитика не подключена | `layero analytics connect` |
| `no_runs` | Нет прогонов замера скорости | `layero perf check` |
| `data_api_disabled` | `layero data …` вызван для базы, у которой Data API не включён | `layero data enable --db <база>` |
| `data_key_kind` | `layero data keys create --kind` с неизвестным видом ключа | `--kind public` — ключ для сайта, `--kind secret` — для сервера |
| `data_key_expiry` | `--expires-in` с неподдерживаемым сроком | Допустимые сроки — в `next_action`, либо `never` |
| `data_key_unknown` | У базы нет действующего ключа с таким id или префиксом | `layero data keys list --db <база>` |
| `data_key_ambiguous` | Префикс совпал с несколькими ключами базы | Передать id ключа — список id в `next_action` |
| `data_levels_missing` | `layero data grant` вызван без единого уровня | Таблица: `--get visitor --post server …`; функция: `--call visitor` |
| `data_level_unknown` | Уровень доступа не из списка | `closed` — закрыто, `visitor` — любой посетитель, `user` — вошедшие, `server` — только сервер |
| `data_levels_blocked` | Платформа отказалась применять уровни: например, права выданы на отдельные колонки или схема принадлежит чужой роли. Причина — в `message`, изменения не отправлялись | Изменить запрос по тексту отказа; текущие уровни — `layero data methods --db <база>` |
| `confirmation_required` | Команда меняет доступ (отзыв ключа, удаление сайта, применение уровней), а подтвердить её в агентском режиме некому. Ничего не изменено; план команд пришёл отдельным событием | Показать план человеку и повторить с `--yes` — готовая команда в `next_action` |
| `data_probe_method` | Метод не из `GET`, `POST`, `PATCH`, `DELETE`; `/whoami` не методом `GET`; функция (`/rest/v1/rpc/…`) не методом `GET` или `POST`. Запрос не отправлялся | Подходящий метод — в `next_action`, для `/whoami` и функции — готовой командой |
| `data_probe_path` | В пути пробы есть `?` или косая черта в конце. Запрос не отправлялся | Готовая команда со всеми переданными флагами — в `next_action`: параметры из `?` стали флагами `--query`, путь без косой черты |
| `data_probe_query` | `--query` не в виде `имя=значение`, имя пустое или одно имя указано дважды | `--query select=id,title --query price=gt.100`; несколько условий на одну колонку — одним параметром `or=(…)` |
| `data_probe_body` | Тело пробы не разобрано: не JSON, не объект и не массив, файл не читается, заданы и `--body`, и `--body-file`, тело у `GET` и `DELETE`, или число в теле не передаётся точно — например, `9007199254740993` ушло бы как `9007199254740992` | Объект или массив JSON в `--body` либо `--body-file`, только для `POST` и `PATCH`; большое число — строкой в кавычках |
| `data_probe_as` | `--as` не из `visitor`, `user`, `server` либо `--user` без `--as user` | `--as visitor`, `--as user --user <id>` или `--as server` |
| `data_probe_user_required` | `--as user` без `--user`: не указано, от имени какого пользователя пробовать | `--user <id пользователя приложения>` |
| `data_probe_user_invalid` | `--user` — не UUID: платформа ждёт id пользователя приложения | Взять id в панели базы, в списке пользователей приложения |
| `data_probe_schema` | `--schema` не из `api`, `public`, `app` либо указан у функции или `/whoami`, где схемы нет. Без этой проверки платформа молча проигнорировала бы флаг | `--schema api`, `public` или `app` — только у таблицы; без флага шлюз ищет таблицу в `api`, затем в `public`, затем в `app` |
| `data_probe_expect` | `--expect` не разобран: нужен статус (`200`), класс (`2xx`) или список через запятую | `--expect 200`, `--expect 2xx`, `--expect 201,204` |
| `data_probe_rejected` | Платформа отказала в пробе до запроса к шлюзу: путь не метод базы, у базы не включён вход, тело больше 64 КБ, больше 50 параметров, шлюз ещё не умеет пробу с откатом. Причина — в `message`, запрос не выполнялся. Отказ самого шлюза (`4xx`) приходит не этим кодом, а событием `data_probe` | Подсказка по случаю — в `next_action` |
| `data_probe_gateway_failed` | Шлюз не дал ответа: ответил `5xx` (например, `503` с `too_busy`) или не ответил платформе вовсе. Если шлюз ответил, событие `data_probe` пришло перед ошибкой. Статус, указанный в `--expect`, этой ошибкой не бывает | Повторить пробу позже |
| `data_probe_unexpected_status` | Статус ответа шлюза не совпал с `--expect`. Событие `data_probe` пришло перед ошибкой | Сверить ответ пробы с уровнями доступа: `layero data methods --db <база>` |
| `data_probe_not_rolled_back` | Проба записи прошла (ответ 200–399), а шлюз не подтвердил откат: данные могли измениться. Событие `data_probe` пришло перед ошибкой; `--expect` эту ошибку не снимает | Проверить данные базы; пробу записи не повторять, пока причина не найдена |
| `internal` | Непредвиденная ошибка CLI (сеть, неожиданное исключение) | Перезапустить с `--debug` |

:::note[Код деплоя собирается из статуса]
Код неуспешного деплоя формируется как `deploy_<status>` по статусу сборки, а
статусов у деплоя четыре: `ready`, `building`, `failed`, `cancelled`. Значит на
практике встречаются ровно `deploy_failed` и `deploy_cancelled` — кодов
`deploy_error` и `deploy_timed_out` не существует, не закладывайтесь на них.
:::

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
