---
sidebar_position: 5
title: Отчёты агентов о документации
description: Как AI-агент сообщает Layero об ошибке в документации, что входит в отчёт и чего в нём не бывает. Правила и шаблон для агентов — на английском.
---

# Отчёты агентов о документации

Если страница документации оказалась неверной, устаревшей или в ней не нашлось
нужного, AI-агент присылает нам короткий отчёт. Мы проверяем каждый отчёт
запуском и исправляем страницу.

**Что уходит в отчёт:** адрес страницы, короткая цитата из неё и описание
проблемы: что написано и что вышло на деле. Ваш код, данные, секреты, пути
к файлам и названия проектов в отчёт не попадают никогда.

**Агент спрашивает вас перед отправкой.** Готовый отчёт он покажет в конце
ответа и спросит: «Отправить в Layero?». Отправит, только если вы согласитесь.
Если вы уже разрешили отправлять такие отчёты в этом разговоре, агент
отправит следующий без повторного вопроса.

Ниже — правила для агентов. Они на английском, как и все наши инструкции
для агентов.

---

## For AI agents

### When to report

Report when a docs.layero.ru page (or `search_docs`) was wrong, outdated, or
**missing something you needed** — including when you then found the answer
somewhere else (the CLI's source code, `--help`, trial and error) — **and** it
cost you a real detour likely to hit the next agent too. Do not report small
hiccups you solved at once, or problems in the user's own code.

Finish the user's task first, or stop where the problem blocks it.

### Ask the user first

End your final reply with the report (template below) and ask the user:
"Send this report to Layero?" Send it only after they say yes. If they have
already allowed docs reports earlier in this conversation, send the next one
without asking again. One report per problem.

### What a report contains

Plain text, at most 1000 characters in total:

```
Page: https://docs.layero.ru/cli/install#login
Quote: "Печатает URL https://app.layero.ru/cli?code=…"
Problem: what the page says vs. what actually happened
Evidence: the command you ran and what it returned
Workaround: what worked instead, or "none"
Effect: what it cost — failed commands, extra searches, minutes
```

- **Page** — the page URL with an anchor if the problem is in one section;
  `none` if no page covered what you needed.
- **Quote** — the shortest exact span that shows the problem; if no page
  covered it — `Search: <what you searched for>`.
- **Evidence** — the command or call you ran and its output. We verify every
  report by running it, so this field matters most.

**Never include** the user's code, data, secrets, tokens, file paths, project
names or anything from their environment beyond the command and its output.

### How to send it (after the user says yes)

1. **MCP.** Call `report_docs_issue` on the Layero MCP server
   (`https://mcp.layero.ru/mcp`). No sign-in is needed.
2. **HTTP**, when you have no MCP:

   ```bash
   curl -sS https://api.layero.ru/public/docs-feedback \
     -H 'content-type: application/json' \
     -d '{"page":"https://docs.layero.ru/cli/install#login",
          "quote":"…","problem":"…","evidence":"…",
          "workaround":"none","effect":"…","source":"http"}'
   ```

   `202` with `{"ok": true, "id": "…", "status": "queued"}` means the report
   is stored; delivery to our team is retried on our side. `400` names the
   field to fix, `429` means the hourly limit (10 reports) is reached.
3. **If neither works**, show the report to the user at the end of your
   reply and tell them it can be sent later with the command above.

If the user says no, or told you not to send reports, don't.

After a report is accepted, confirm it to the user in one line.
