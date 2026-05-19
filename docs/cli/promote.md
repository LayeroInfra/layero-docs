---
sidebar_position: 5
title: layero promote
description: Перевести production apex на конкретный деплой — из любой ветки, без пересборки. Плюс one-click rollback на предыдущий production.
---

# `layero promote`

Перевести production apex `<org>-<project>.layero.ru` на указанный деплой. Двигает указатель `production_deploy_id` — без пересборки, апекс начинает отдавать новый артефакт через ~30–60 секунд (время CDN cache propagation).

## Зачем

Production-флоу в Layero «как у Vercel»:

1. Push в любую ветку → preview-URL ветки (24 ч TTL)
2. Тестируем, шерим, сравниваем
3. Готовы выкатить — **promote** на тот ready-деплой, который проверили

Без promote'а apex продолжает отдавать предыдущий production. Это страховка от случайных релизов после merge'а в main (если auto-promote выключен для команды).

## Использование

```bash
# promote последнего ready-деплоя default-ветки
layero promote

# promote по commit SHA (первые 7+ символов) или полному deploy id
layero promote --deploy=a3f9c2b
layero promote --deploy=550e8400-e29b-41d4-a716-446655440000

# конкретная ветка → её последний ready
layero promote --branch=staging

# rollback: вернуть apex на предыдущий production-деплой
layero promote --rollback

# CI: без подтверждения
layero promote --yes
```

## Что происходит

1. CLI находит deploy (по `--deploy`, по последнему ready в `--branch`, или по последнему ready в default-ветке).
2. Показывает план:
   ```
   promote plan:
     from: 1743a29  2026-05-08 20:30  v2.4.1 — bugfix release
     to:   ce70191  2026-05-19 07:09  feature: new pricing page
   proceed? [y/N]
   ```
3. После confirm бэкенд:
   - Атомарно обновляет `projects.production_deploy_id` (CTE захватывает старое значение в `previous_production_deploy_id` — для rollback'а).
   - Записывает `promote_events` (audit log: кто, когда, source='cli', prev → new).
   - Инвалидирует resolver-кеш через Postgres NOTIFY.
4. Через 30–60 сек CDN edge подтягивает новый артефакт. Старые edge-кеши обновляются по TTL.

## One-click rollback

```bash
layero promote --rollback
```

Делает атомарный swap `production_deploy_id ↔ previous_production_deploy_id`. **Стабильный**: вызвали два раза подряд — вернулись в исходную точку (ping-pong). Удобно когда хочется быстро откатиться, попробовать, и при необходимости вернуться обратно.

Rollback **не требует** ввода commit SHA — оба деплоя уже зафиксированы платформой при предыдущем promote'е.

Если `previous_production_deploy_id` пуст (на проекте ещё ни одного promote не было) — CLI вернёт ошибку: откатываться некуда, надо хотя бы один promote сделать сначала.

## `--promote` как флаг `layero deploy`

Если хочется одной командой: build → promote, не дожидаясь ready'я в UI:

```bash
layero deploy --branch=hot-fix --promote --yes
```

Билд завершится, CLI автоматом перейдёт в promote и подтвердит. Эквивалентно `layero deploy ... && layero promote --deploy=<last>`, но без второй ручной команды.

## Ограничения

- Promote можно сделать только на `ready`-деплой с `s3_path` (или зарегистрированным runtime-контейнером).
- Для **runtime**-проектов (SSR Next, Streamlit, Gradio, Flask) promote переключает указатель моментально, но running-инстанс старого билда продолжает отвечать пока его не дёрнут (cold-start триггернёт следующий запрос на новом артефакте).
- Если auto-promote default-ветки **включён**, любой следующий push в default перетрёт ваш ручной promote. Выключите auto-promote в Settings проекта если хотите оставить ручной контроль за production.

## Альтернативы

- В дашборде на странице деплоя — кнопка «Promote to production».
- На странице проекта в Production card — кнопка «Откатить» = эквивалент `--rollback`.
- История промоутов — Project → Deploys → «Promote history» (видно auto vs ui vs cli + кто).

## Как это связано с rollback

Раньше `layero rollback` менял `environments.active_deploy_id` (per-ветка). Под V071 модель доменов одна-на-проект: rollback теперь — это «откати **production apex** на прошлый pinned-деплой», т.е. swap двух полей проекта. Команда `layero rollback` удалена; используйте `layero promote --rollback`.
