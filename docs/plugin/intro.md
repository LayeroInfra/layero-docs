---
sidebar_position: 1
title: Что такое @layero
description: MCP-плагин для Cursor, Claude Code и Codex, который собирает лендинг из 2-3 коротких квизов прямо в чате IDE и деплоит результат на Layero.
---

# @layero

**`@layero`** — это [MCP](https://modelcontextprotocol.io/)-плагин для AI-IDE, который позволяет собрать готовый лендинг прямо в чате Cursor / Claude Code / Codex. Никакого редактора, никакого терминала: одна кнопка установки → диалог `@layero ...` → задеплоенная страница.

В отличие от [CLI-flow](/cli/install), который деплоит **существующий** проект, `@layero` создаёт лендинг **с нуля** по короткому брифу.

## Что внутри

- **5 дизайн-систем** — minimal, editorial, terminal, warm, bold. Каждая — палитра + типографика + набор готовых компонентов на vanilla HTML+CSS.
- **6 структур** — masterclass, portfolio-dev, portfolio-designer, portfolio-mentor, event, saas. Семантический HTML без inline-стилей.
- **Композиция** — любая структура × любая дизайн-система = готовый лендинг. Из 11 артефактов получается до 30 уникальных страниц.
- **Серия квизов** — IDE рендерит нативные формы (через MCP elicitation), плагин задаёт мотивацию, vibe, интеграцию и сам подбирает 3 ближайших варианта дизайна.
- **Деплой на Layero** — встроен в флоу: после генерации файлов плагин сам запускает `npx layero deploy --json` через bash-tool агента.

## Быстрый старт

1. Открой [land.layero.ru](https://land.layero.ru) (страница установки)
2. Нажми **Add to Cursor** — IDE откроется и предложит установить MCP-сервер
3. В чате IDE напиши:
   ```
   @layero хочу лендинг для воркшопа по гончарке, тёплый винтажный стиль
   ```
4. Заполни 3 коротких формы (вкус, тон, куда уходят заявки)
5. Готово — файлы в воркспейсе, лендинг задеплоен

## Как это работает технически

Плагин — это remote MCP-сервер по адресу `https://mcp.preview.layero.ru/mcp`, работающий по транспорту [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http).

```
[ Cursor / Claude Code ]
         │ JSON-RPC over HTTPS
         ▼
[ mcp.preview.layero.ru ]   ← MCP-сервер на Python (FastMCP)
         │
         ├── tools: compose_landing, add_integration, deploy, list_design_systems, list_structures
         ├── prompts: welcome, make_premium, make_friendly, integrate_telegram, ...
         └── resources: layero://soul, layero://playbook/deploy, layero://catalogue
```

## SOUL — философия плагина

Плагин действует по фиксированным правилам поведения, описанным в [SOUL.md](https://github.com/LayeroInfra/layero/blob/main/SOUL.md):

- **Beautiful landings should take zero effort.** Пользователь думает о чём, плагин — о всём остальном.
- **Asking is a tax. Acting is a gift.** Каждый вопрос юзеру стоит ему внимания. Если можно решить самостоятельно — решаем.
- **Confidence over options.** Уверенный дефолт лучше пяти вариантов на выбор.
- **Static is a feature.** HTML + CSS по умолчанию. React + Vite — только когда нужна реальная интерактивность. Никакого SSR.

## Куда дальше

- [Установка плагина](./install.md) — кнопки для трёх IDE + ручной путь
- [Каталог дизайнов и структур](./catalogue.md) — что доступно прямо сейчас
- [Интеграции форм](./integrations.md) — Telegram, Google Sheets, custom webhook
