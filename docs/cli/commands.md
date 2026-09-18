---
sidebar_position: 2
title: Команды
description: Полный список команд layero — init, login, projects, deploy, rollback, deploys list, link, token.
---

# Команды CLI

| Команда | Что делает |
|---|---|
| `layero init` | Дописать блок для AI-агентов в `AGENTS.md` / `CLAUDE.md` / `.cursorrules` и создать заготовку `.layero/project.json`. Запускать необязательно: `deploy` привязывает папку сам. |
| `layero login` | Авторизоваться через браузер (по коду на почту или через Яндекс ID) — device-flow. |
| `layero logout` | Удалить сохранённый токен. |
| `layero whoami` | Показать текущий аккаунт. |
| `layero orgs list` | Список Layero-организаций (личная + команды). |
| `layero projects list` | Список ваших проектов. |
| `layero projects create --repo <provider>:<owner/repo>` | Создать проект из репозитория подключённого провайдера — push в ветку = превью, push в main = прод. |
| `layero projects delete <slug> --yes` | Удалить проект. Необратимо; нужен токен со scope `admin`. |
| `layero sources list` | Git-провайдеры платформы и подключения организации. |
| `layero sources connect <provider> --token-stdin` | Подключить провайдера по персональному токену (токен — из stdin, чтобы не попал в историю). |
| `layero sources repos <connection_id>` | Репозитории, видимые подключению. |
| `layero envs list` | Окружения (ветки) проекта с адресами. |
| `layero link <id_or_slug>` | Привязать cwd к существующему проекту. |
| `layero deploy` | Упаковать cwd и задеплоить: платформа соберёт и опубликует. У проекта без репозитория каждый деплой заменяет живой сайт. |
| `layero deploy --dry-run` | Показать план сборки и выйти: ничего не загружает, вход не нужен. |
| `layero deploy --prod` | Проект с подключённым репозиторием: выложить загрузку на живой адрес (с подтверждением). |
| `layero deploy --org <slug>` | Создать новый проект в указанной команде вместо личной. |
| `layero deploy --json` | Machine-readable стрим событий — для агентов и CI. |
| `layero deploy --claim` | Деплой без аккаунта: временный проект на 72 часа и ссылка, по которой человек заберёт сайт. |
| `layero claim status` / `claim accept <code>` | Состояние заявки claimable-проекта; открыть страницу, где человек её принимает. |
| `layero deploys list` | Показать недавние деплои текущего проекта. |
| `layero promote` | Переключить production apex на конкретный ready-деплой. |
| `layero promote <sha>` | Вернуть апекс на конкретный деплой по `commit_sha` — рабочий способ отката, см. [Rollback](./rollback.md). |
| `layero hooks list/create/delete` | Deploy-хуки — URL-токены, по POST на которые запускается сборка (CMS, cron, внешний CI). |
| `layero db list` | Базы организации: имя, слаг, включён ли Data API, объём. |
| `layero db create <имя>` | Завести базу. Строка подключения печатается один раз. |
| `layero db connect <база>` | Подключить проект к базе — строка подключения приедет в его переменные. |
| `layero db sql <база> -c "SQL"` | Выполнить запрос или скрипт в базе. |
| `layero data env` | Адрес и публичный ключ [Data API](/data-api) для фронтенда. |
| `layero token create <имя>` | Выпустить долгоживущий токен для CI и агентов. |
| `layero token list` / `revoke <id>` | Посмотреть и отозвать выпущенные токены. |
| `layero token set <jwt>` | Сохранить токен, полученный иначе. |

Полный список флагов конкретной команды:

```bash
npx layero@latest <cmd> --help
```

Глобальный флаг `--json` переключает CLI в режим JSON-lines на stdout — это для AI-агентов (Cursor, Claude Code) и CI-пайплайнов. Подробнее — [Деплой из AI-агентов](./agents.md).

## `layero init`

Запустите один раз внутри директории сайта:

```bash
cd my-site
npx layero@latest init
```

Что делает:

1. Смотрит на папку тем же детектом, что `deploy --dry-run`, и печатает событие `detected` — с `hint` и `next_action`, если приложение не узнано (подпапка монорепо, фронт и бэк рядом, свой скрипт сборки, сервер без известного фреймворка).
2. Создаёт `.layero/project.json` с `analytics_enabled` и `env_vars`. Догадку детекта (`framework_hint` / `build_cmd` / `output_dir`) **не записывает**: поля этого файла CLI читает как ваш выбор. Если файл уже есть, не трогает его.
3. Дописывает блок «Deploying with Layero» в `AGENTS.md`, `CLAUDE.md` и/или `.cursorrules` (выбирает существующие, а если нет ни одного, создаёт `AGENTS.md`). Фреймворк назван в блоке, только если детект в нём уверен.

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

В прежней схеме имён slug организации был префиксом hostname'а
(`<org>-<project>.layero.app`). У проектов, созданных после переезда, адрес состоит из
одного слага проекта — см. [Окружения, preview и production](../deploys/environments.md).

## `layero projects list`

Показывает все проекты, к которым у вас есть доступ.

## `layero link`

Привязать текущую директорию к существующему проекту:

```bash
npx layero@latest link 123          # по id
npx layero@latest link alice-blog   # по slug
```

Создаст `./.layero/project.json` со ссылкой на проект. Полезно, когда вы клонировали чужой репо и хотите деплоить в свой проект, или переехали из другой папки.

## `layero deploy`

Упаковать cwd и запустить деплой. Подробно — [`layero deploy`](./deploy.md).

## `layero deploys list`

Показать последние деплои проекта (по умолчанию — default-ветка):

```bash
npx layero@latest deploys list                       # текущая default-ветка
npx layero@latest deploys list --branch=staging      # другая ветка
npx layero@latest deploys list --limit 50            # больше истории
```

Каждая строка содержит статус (`ready`/`building`/`failed`), commit SHA, время и **источник** деплоя:

| Бейдж | Что значит |
|---|---|
| `(push)` | Пришёл от webhook'а GitHub после push |
| `(cli)` | Загружен через `layero deploy` |
| `(manual)` | Запущен вручную через дашборд (Redeploy) |


## `layero projects create`

Проект из репозитория без панели — путь (a) для агента и терминала:

```bash
layero sources list                                           # провайдеры и подключения
echo "$GITVERSE_TOKEN" | layero sources connect gitverse --token-stdin
layero sources repos <connection_id>
layero projects create --repo gitverse:acme/site --branch main --json
```

GitHub подключается установкой Layero GitHub App в панели, остальные
провайдеры — персональным токеном. Команда сверяет репозиторий со списком
подключения, создаёт проект и ставит вебхук. Если провайдер вебхук не дал
(не хватает прав токена; у SourceCraft исходящих вебхуков нет вовсе), CLI
скажет об этом событием `webhook_unavailable` с адресом для ручной
настройки — репозиторий при этом уже привязан, не работает только автосборка
на push.

После привязки команда сама завершает мастер: берёт подсказку детекта
(фреймворк, команда сборки, папка результата), применяет её и запускает
первую сборку — ровно то, что делает кнопка «Начать деплой» в панели.
События `setup_applied` и `deploy_started`; дальше — `layero deploys list
--project <slug>`. С флагом `--no-deploy` проект остаётся в мастере
(событие `setup_pending` с адресом панели), и сборок не будет, пока
настройку не завершат там. Если детект или настройка не удались, проект всё
равно создан (выход 0): событие `setup_failed` с причиной и адресом мастера.

```bash
layero projects create --repo github:acme/site --json              # привязать, настроить, собрать
layero projects create --repo github:acme/site --no-deploy --json  # только привязать
```

## `layero projects delete`

```bash
layero projects delete <slug> --yes
```

Необратимо: адрес и слаг освобождаются сразу, ресурсы вычищаются в фоне.
Маршрут требует токена со scope `admin` — токен по умолчанию (`read` +
`deploy`) получит `forbidden`, и это правильно: агент с деплой-токеном не
должен уметь снести проект. В терминале без `--yes` команда просит ввести
слаг; вне терминала без `--yes` — отказ `confirmation_required`.

## `layero envs list`

Окружения проекта с адресами. Окружение и ветка — одно и то же: у
CLI-проекта оно одно (`cli`), у проекта с репозиторием — по ветке; production
помечена. В `--json` — событие `environments`.

## `layero claim`

Для проекта, созданного без аккаунта (`layero deploy --claim`):
`layero claim status` показывает, жива ли заявка, `layero claim accept`
открывает страницу в панели, где человек забирает сайт в свой аккаунт.
Принять заявку из терминала нельзя — только человеком в панели.

## `layero hooks`

Deploy-хук — URL, по `POST` на который запускается сборка. Нужен, когда билд
должен инициировать не человек: публикация в headless CMS, cron, внешний CI.

```bash
layero hooks create strapi-content        # хук на preview, ветка по умолчанию
layero hooks create publish --prod        # хук в production
layero hooks list
layero hooks delete <id>                  # отзывается сразу
```

Команда печатает URL вида `https://api.layero.ru/hooks/<токен>`. Проверено на
живом проекте: `POST` возвращает `202` с `deploy_id` и запускает сборку,
`GET` отдаёт `405` — то есть краулер или случайный переход в браузере сборку
не запустят.

:::warning[URL хука — это секрет]
Кто угодно с этим адресом может запустить сборку. Ротация — удалить и создать
заново; отдельного «обновить токен» нет.
:::

## `layero promote`

Перевести production apex проекта на конкретный ready-деплой. Подробно — [`layero promote`](./promote.md).

```bash
npx layero@latest promote                        # default-ветка → последний ready
npx layero@latest promote --branch=staging       # последний ready ветки staging
npx layero@latest promote a3f9c2b                # конкретный деплой по commit_sha (позиционный аргумент)
npx layero@latest promote --yes                  # без подтверждения (CI)
```

`layero deploy --promote` — короткий путь: «собери и сразу выкати в production», эквивалент `layero deploy ... && layero promote <last-sha>`.


## `layero db`

Базы организации из терминала — чтобы не уходить в браузер посреди работы и
чтобы то же самое умел агент в CI.

```bash
npx layero@latest db list                            # какие базы есть
npx layero@latest db create crm                      # завести
npx layero@latest db connect crm                     # подключить текущий проект
npx layero@latest db sql crm -c "select count(*) from entries"
```

Организация выбирается сама, если она одна; иначе — `--org <slug>`.
База адресуется именем, слагом или id.

:::warning[Строка подключения печатается один раз]
Пароль базы после создания больше не покажет никто — только ротация в панели.
Сохраните вывод `db create` сразу.
:::

`db sql` выполняет и скрипт из нескольких операторов — одной транзакцией, с
результатом по каждому оператору. Отказ называет номер оператора, а не только
текст ошибки Postgres.

## `layero token`

Вход человеком (`layero login`) требует браузера и подтверждения — в CI это
тупик. Для CI и агентов выпускается долгоживущий токен:

```bash
npx layero@latest token create ci                    # read + deploy
npx layero@latest token create ci --scope read       # только чтение
npx layero@latest token list
npx layero@latest token revoke <id>
```

Токен показывается **один раз** — в базе лежит только его хеш. Дальше он живёт
в переменной окружения:

```bash
LAYERO_TOKEN=<токен> npx layero@latest deploy
```

По умолчанию токен умеет читать и деплоить, но не умеет необратимого: удалить
проект, сменить адрес сайта, передать владение, выписать себе новый токен. Для
этого нужен `--scope admin`, и запрашивается он явно.

На машине без браузера (SSH, контейнер, среда агента) обычный вход тоже
работает — `layero login --no-browser` печатает адрес и код, открыть их можно
где угодно.
