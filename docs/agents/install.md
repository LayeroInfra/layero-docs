---
sidebar_position: 2
title: Подключить агента
description: Команды установки Layero для CLI, навыка, Claude Code, Cursor, Codex и любого MCP-клиента — из одного файла agents-install.json. OAuth для клиентов и LAYERO_TOKEN для CI.
---

# Подключить агента

Команды на этой странице — из файла
[`agents-install.json`](https://github.com/LayeroInfra/layero-docs/blob/main/agents-install.json),
того же, что читают лендинг и панель.

{/* Таблица ниже генерируется из agents-install.json скриптом
    scripts/check-agents-install.py --write и сверяется гейтом в make check.
    Руками не править — правится файл. */}

{/* agents-install:begin */}
MCP-сервер: `https://mcp.layero.ru/mcp` (транспорт `http`, имя `layero`).
Репозиторий навыка: [`LayeroInfra/layero-agents`](https://github.com/LayeroInfra/layero-agents).

| Клиент | Команда |
|---|---|
| CLI | `npx layero@latest deploy` |
| Agent Skill | `npx skills add LayeroInfra/layero-agents` |
| Любой агент | `npx -y add-mcp https://mcp.layero.ru/mcp` |
| Claude Code | `claude plugin marketplace add LayeroInfra/layero-agents && claude plugin install layero@layero` |
| Cursor | `npx -y add-mcp https://mcp.layero.ru/mcp` — или [кнопка установки](https://cursor.com/en/install-mcp?name=layero&config=eyJ1cmwiOiJodHRwczovL21jcC5sYXllcm8ucnUvbWNwIn0%3D) |
| Codex CLI | `codex mcp add layero --url https://mcp.layero.ru/mcp` |

В CI: `LAYERO_TOKEN=… npx layero@latest deploy --project <slug> --json --yes`
{/* agents-install:end */}

## Что ставить

- **CLI** — если агенту нужно только опубликовать папку с кодом. Ничего
  не устанавливается: `npx` берёт свежую версию при каждом запуске.
- **Agent Skill** — инструкции для агента (три пути, JSON-события, что не
  делать). Работает с любым клиентом, читающим `.agents/skills`.
  Подробнее — [Навык layero](./skill.md).
- **MCP** — если агент должен видеть состояние сайта, логи, домены, Data
  API. Для Claude Code и Cursor плагин ставит и навык, и MCP разом; для
  остальных — `add-mcp` плюс `npx skills add`.

Инструменты MCP описаны на странице [Инструменты MCP](./mcp-tools.md).

## Вход: OAuth в клиенте

MCP-сервер требует аккаунт Layero. Клиенты, поддерживающие OAuth (Claude
Code, Cursor, Codex), при первом вызове инструмента **сами откроют
браузер** — подтвердите вход, и подключение появится в клиенте
автоматически. Ни токена, ни правки конфига не нужно.

Если клиент показывает карточку «Authenticating…» и не открывает браузер —
у него нет OAuth; переходите к токену.

## `LAYERO_TOKEN` для CI

В CI и в средах без браузера входите токеном в переменной окружения
`LAYERO_TOKEN`. Выпустить токен:

```bash
npx layero@latest token create
```

или в панели: **app.layero.ru → Настройки → CLI**. Токен показывается один
раз.

Дальше:

- **CLI** читает переменную сам:
  `LAYERO_TOKEN=… npx layero@latest deploy --project <slug> --json --yes`.
  Флаг `--yes` отключает вопросы; `--json` — построчные события для
  разбора. Готовый пример — [GitHub Actions](../cli/github-actions.md).
- **MCP** принимает тот же токен заголовком
  `Authorization: Bearer $LAYERO_TOKEN`. В Codex:
  `codex mcp add layero --url https://mcp.layero.ru/mcp --bearer-token-env-var LAYERO_TOKEN`.

Токен даёт полный доступ к организации — храните его в секретах CI, а не в
репозитории.

## Проверить подключение

Попросите агента вызвать `whoami`. В ответе — ваш логин, организация и
срок действия токена. Если инструмента нет в списке клиента — MCP не
подключён; если ответ «не авторизован» — не выполнен вход.
