---
sidebar_position: 2
title: Подключить агента
description: Команды установки навыка и MCP-сервера Layero для Claude Code, Cursor, Codex и любого агента. Вход через браузер, токен LAYERO_TOKEN для CI и плагина Claude Code, проверка подключения.
---

# Подключить агента

**Одна команда для вашего клиента — и агент умеет публиковать и обслуживать
сайты на Layero.** Команды ниже — из файла
[`agents-install.json`](https://github.com/LayeroInfra/layero-docs/blob/main/agents-install.json),
того же, что читают сайт и панель.

{/* Таблица ниже генерируется из agents-install.json скриптом
    scripts/check-agents-install.py --write и сверяется гейтом в make check.
    Руками не править — правится файл. */}

{/* agents-install:begin */}
MCP-сервер: `https://mcp.layero.ru/mcp` (транспорт `http`, имя `layero`).
Репозиторий навыка: [`LayeroInfra/layero-agents`](https://github.com/LayeroInfra/layero-agents).

| Клиент | Команда |
|---|---|
| CLI | `npx layero@latest deploy` |
| Agent Skill | `npx skills add LayeroInfra/layero-agents` |
| Agent MCP | `npx -y add-mcp https://mcp.layero.ru/mcp` |
| Claude Code | `claude plugin marketplace add LayeroInfra/layero-agents && claude plugin install layero@layero` |
| Cursor | `npx -y add-mcp https://mcp.layero.ru/mcp` — или [кнопка установки](https://cursor.com/en/install-mcp?name=layero&config=eyJ1cmwiOiJodHRwczovL21jcC5sYXllcm8ucnUvbWNwIn0%3D) |
| Codex CLI | `codex mcp add layero --url https://mcp.layero.ru/mcp` |

В CI: `LAYERO_TOKEN=… npx layero@latest deploy --project <slug> --json --yes`
{/* agents-install:end */}

## Что ставить

- **Только CLI** — если агенту нужно опубликовать папку с кодом. Ставить
  ничего не нужно: `npx` каждый раз берёт свежую версию.
- **Навык** (строка «Agent Skill») — инструкции для агента: три пути, события
  CLI, чего не делать. Вместе с ним ставится навык `layero-content-rules` — он проверяет сайт по правилам Layero против фишинга.
  Подробнее — [Навык layero](./skill.md).
- **MCP** (строка «Agent MCP») — если агент должен видеть состояние сайта,
  логи, домены, базу. Команда добавляет сервер во все установленные клиенты.
  Что он умеет — [Инструменты MCP](./mcp-tools.md).
- **Плагин Claude Code** ставит оба навыка и MCP одной командой. Плагин для
  Cursor ставится из панели Cursor: **«Customize» → «Plugins» → «Add»**, репозиторий
  `LayeroInfra/layero-agents`.

## Вход

Без входа работают четыре инструмента: `search_docs`, `report_docs_issue`, `check_copy` и `refactor_site`. Остальным нужен аккаунт
Layero.

**Через браузер.** Если клиент умеет входить по OAuth, при первом вызове
инструмента, которому нужен аккаунт, клиент сам откроет браузер. Подтвердите
вход — и подключение заработает. Токен и правка настроек не нужны.

Клиент показывает «Authenticating…», но браузер не открывает — значит, входа
по OAuth у него нет. Тогда нужен токен.

:::warning[Плагин Claude Code работает только с токеном]

Плагин передаёт серверу токен из переменной окружения `LAYERO_TOKEN`. Задайте
её до запуска Claude Code — иначе инструменты, которым нужен аккаунт, ответят,
что токена нет, и браузер не откроется. Чтобы входить через браузер без токена, подключите MCP командой из строки «Agent MCP».

:::

## `LAYERO_TOKEN` для CI

В CI и везде, где некому подтвердить вход в браузере, нужен токен в переменной
`LAYERO_TOKEN`. Выпустите его командой:

```bash
npx layero@latest token create ci
```

или в панели: [app.layero.ru/settings/cli](https://app.layero.ru/settings/cli),
раздел «Токены CLI и CI». Токен показывается один раз.

Такой токен может читать и публиковать, но не может удалить проект или
создать бакет для файлов базы. Для этого нужен токен с правом `admin`:
`--scope read,deploy,admin`. Храните токен в секретах CI, а не в репозитории.
Отозвать — там же в панели или командой `layero token revoke`.

Как используют токен:

- **CLI** читает переменную сам. Флаг `--yes` отключает вопросы, `--json`
  включает построчные события. Готовый пример — [GitHub Actions](../cli/github-actions.md).
- **MCP** принимает тот же токен в заголовке
  `Authorization: Bearer $LAYERO_TOKEN`. В Codex добавьте к команде из
  таблицы флаг `--bearer-token-env-var LAYERO_TOKEN`.

## Проверить подключение

Попросите агента вызвать `whoami`. В ответе будут имя аккаунта, почта и число проектов. Если инструмента нет в списке клиента, MCP не подключён. Если ответ «не авторизован», вы не вошли или токен не задан.
