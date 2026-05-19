---
sidebar_position: 6
title: Rollback
description: Откатить production apex на предыдущий рабочий деплой одной командой. Атомарный swap указателя, без пересборки.
---

# Rollback

Откатить production apex `<org>-<project>.layero.ru` на **предыдущий** production-деплой. Без пересборки, без выбора commit'а — Layero запоминает прошлое значение указателя при каждом promote, и rollback просто меняет их местами.

## Зачем

Только что promote'нули новый билд, и оказалось, что он сломал production. Нужно мгновенно вернуть рабочую версию.

Pересборка предыдущего commit'а из git-истории не сработает идемпотентно: `npm install` против сегодняшнего реестра может дать другой `node_modules` (lockfile drift, transitive republish). Rollback берёт **тот же** артефакт, что работал раньше — он уже в S3.

## Использование

```bash
# rollback: вернуть apex на предыдущий production
layero promote --rollback

# CI: без подтверждения
layero promote --rollback --yes
```

Это эквивалентно кнопке «Откатить production» на странице проекта в UI.

## Как это работает

Под капотом Layero хранит **два** указателя на проекте:

```
projects.production_deploy_id           ── что apex отдаёт прямо сейчас
projects.previous_production_deploy_id  ── что отдавал до прошлого promote'а
```

Rollback — это **атомарный swap** этих двух полей одним SQL-апдейтом. Apex моментально (через CDN edge cache propagation, ~30–60 сек) возвращается на прошлый рабочий билд.

`previous_production_deploy_id` обновляется автоматически при каждом promote'е (UI / CLI / auto-promote), так что rollback всегда есть «куда».

**Стабильность ping-pong**: вызвав `layero promote --rollback` два раза подряд, вы вернётесь в исходную точку. Удобно когда хочется: откатить → проверить старую версию → вернуть новую обратно.

## Что происходит

1. CLI показывает план:
   ```
   rollback plan:
     from: ce70191  2026-05-19 07:09  feature: new pricing page (current production)
     to:   1743a29  2026-05-08 20:30  v2.4.0 — stable release   (previous production)
   proceed? [y/N]
   ```
2. После confirm бэкенд:
   - Атомарный swap `production_deploy_id ↔ previous_production_deploy_id`.
   - Запись в `promote_events` (action='promote', source='cli', с заметкой что это rollback).
   - Инвалидация resolver-кеша через Postgres NOTIFY.
3. CDN propagation — 30–60 секунд, и apex отдаёт прошлую версию.

## Ограничения

- На проекте должен быть **минимум один** предыдущий promote — иначе rollback'у некуда (CLI вернёт ошибку с понятным сообщением).
- Rollback двигает **production apex** проекта; preview-URL'ы веток остаются нетронутыми — у каждой ветки своя независимая история деплоев.
- Для **runtime**-проектов (SSR Next, Streamlit, Gradio, Flask) rollback переключает указатель моментально, но running-инстанс старого билда продолжает отвечать пока его не дёрнут (cold-start на следующем запросе уже на старом артефакте).

## Альтернативы

- В UI: Project page → Production card → кнопка «Откатить».
- Откатить **на конкретный** деплой (не предыдущий): `layero promote --deploy=<sha>`. См. [`layero promote`](./promote.md).
- Если хочется **rebuild** прошлого коммита (а не reuse артефакта) — обычный `layero deploy` с тем кодом или Redeploy в дашборде.

## Что было раньше (до V071)

В прошлой модели у каждой ветки был **свой** канонический hostname `<branch>.layero.ru`, и `layero rollback` менял `environments.active_deploy_id` per-ветка. С переходом на «один apex на проект» rollback теперь — это операция уровня проекта, не env'а. Команда `layero rollback` удалена; используйте `layero promote --rollback`.
