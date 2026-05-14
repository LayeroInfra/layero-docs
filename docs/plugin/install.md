---
sidebar_position: 2
title: Установка
description: Один клик в Cursor через deeplink, copy-paste команды в Claude Code и Codex. Что происходит после клика, какие настройки IDE нужны.
---

# Установка `@layero`

## Cursor (one-click)

Открой [land.layero.ru](https://land.layero.ru), нажми **Add to Cursor**. Браузер выкинет deeplink — IDE откроется и покажет диалог:

```
Install MCP Server
  Name:      layero
  Transport: http
  URL:       https://mcp.preview.layero.ru/mcp

  [Cancel]   [Install]
```

После `Install` Cursor сам пишет запись в `~/.cursor/mcp.json`. Файл редактировать не надо. В чате становится доступен `@layero`.

### Что внутри deeplink

Если интересно, кнопка строит:

```
cursor://anysphere.cursor-deeplink/mcp/install
  ?name=layero
  &config=<base64({"url":"https://mcp.preview.layero.ru/mcp","type":"http"})>
```

Cursor парсит base64, валидирует и применяет.

## Claude Code

В Claude Code нет URL-протокола, поэтому установка идёт через две slash-команды внутри IDE:

```
/plugin marketplace add LayeroInfra/layero-claude
/plugin install layero@layero-claude
```

После — в чате доступен `@layero`.

## Codex

В Codex нет URL-протокола И нет встроенного маркетплейса. Установка — одна команда в терминале:

```bash
codex mcp add layero --url https://mcp.preview.layero.ru/mcp --transport http
```

Перезапусти Codex, чтобы он перечитал `~/.codex/config.toml`.

## Ручной путь (Cursor)

Если хочешь добавить вручную (например, для отладки локального сервера), открой `~/.cursor/mcp.json` и добавь:

```json
{
  "mcpServers": {
    "layero": {
      "url": "https://mcp.preview.layero.ru/mcp",
      "transport": "http"
    }
  }
}
```

Перезапусти Cursor. Готово.

## Проверка установки

В чате IDE напиши:

```
@layero привет
```

Плагин должен ответить приветствием и предложить начать. Если ничего не происходит — проверь:

1. **Cursor**: нижняя левая шестерёнка → MCP → видишь ли `layero` в списке серверов и статус «connected»?
2. **Claude Code**: `/plugin list` — есть ли `layero@layero-claude`?
3. **Codex**: `/mcp` в TUI — показывает ли `layero` среди подключённых?

## Удаление

| IDE | Команда |
|---|---|
| Cursor | удалить запись `layero` из `~/.cursor/mcp.json` |
| Claude Code | `/plugin uninstall layero` |
| Codex | удалить блок `[mcp_servers.layero]` из `~/.codex/config.toml` |
