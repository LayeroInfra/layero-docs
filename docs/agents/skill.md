---
sidebar_position: 4
title: Навык layero
description: Что лежит в навыке LayeroInfra/layero-agents, как его ставить через npx skills или плагины и что npx layero@latest init пишет в AGENTS.md.
---

# Навык `layero`

Навык (Agent Skill) — это файл `SKILL.md` с инструкциями, который агент
читает, когда задача касается Layero. Он один, лежит в публичном
репозитории [`LayeroInfra/layero-agents`](https://github.com/LayeroInfra/layero-agents)
и это **источник правды**: с ним сверяются инструкции MCP-сервера,
`llms.txt`, эти страницы и блок, который CLI пишет в `AGENTS.md`. Если
где-то написано иначе, чем в навыке, ошибка там, а не в навыке.

## Что внутри

```
skills/layero/
├── SKILL.md            ← три пути (репозиторий / папка / сайт), когда какой,
│                          вход и токен, JSON-события CLI, что не делать
└── references/
    ├── json-events.md  ← схема событий и кодов ошибок CLI
    ├── layero-json.md  ← файл layero.json: фреймворк, команды, папка результата
    └── providers.md    ← GitHub, GitVerse, GitLab, GitFlic, SourceCraft
```

`SKILL.md` короткий и отвечает на вопрос «что делать»; подробности лежат в
`references/`, и агент открывает их только по необходимости.

## Как ставится

Способ зависит от клиента. Команды — из
[таблицы установки](./install.md); здесь — что за ними стоит.

**Любой агент со стандартом `.agents/skills`:**

```bash
npx skills add LayeroInfra/layero-agents
```

Команда копирует навык в `.agents/skills/layero/` проекта. Так его
подхватывают Claude Code, Cursor, Codex и другие клиенты, которые читают
этот каталог.

**Claude Code — плагин.** В плагин `layero` входят и навык, и подключение
MCP-сервера:

```bash
claude plugin marketplace add LayeroInfra/layero-agents && claude plugin install layero@layero
```

**Cursor — плагин `layero-cursor`** из того же репозитория: MCP, правила и
навык.

Плагины собираются из навыка скриптом `build-adapters.py` в репозитории
`layero-agents`; руками их не правят.

## `npx layero@latest init` и `AGENTS.md`

```bash
npx layero@latest init
```

Команда определяет фреймворк, создаёт `.layero/project.json` и дописывает в
`AGENTS.md` проекта (или в `CLAUDE.md` / `.cursorrules`, если они есть)
**короткий указатель**: где лежит навык, как его поставить и адрес
`https://layero.ru/llms.txt`. Полного текста инструкций там нет намеренно —
у одного факта должно быть одно место, и это навык. Агент, прочитавший
`AGENTS.md`, идёт за подробностями в навык, а не в устаревшую копию.

Если навык уже установлен в `.agents/skills/`, указатель ведёт на него.

## Как проверить, что навык работает

Спросите агента: «Как задеплоить этот проект на Layero?» Правильный ответ
начинается с вопроса, есть ли подключённый репозиторий, и не содержит
`git init` и `npm i -g`. Если агент предлагает создать репозиторий на
GitHub — навык не подхвачен.
