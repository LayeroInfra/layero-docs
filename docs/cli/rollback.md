---
sidebar_position: 4
title: layero rollback
description: Как откатить активный деплой ветки на предыдущий successful артефакт без пересборки.
---

# `layero rollback`

Откатить активный деплой на предыдущий ready-артефакт. Без пересборки —
артефакт уже лежит в Object Storage с прошлого успешного деплоя.

## Зачем

Production упал после релиза. Нужно мгновенно вернуть рабочий артефакт,
не дожидаясь нового билда. Pересборка предыдущего commit'а из git-истории
не сработает идемпотентно: `npm install` против сегодняшнего npm-registry
может дать другой `node_modules` (lockfile drift, transitive republish).
Rollback берёт **точно тот же** артефакт, что работал раньше.

## Использование

```bash
# default-ветка → последний ready, который не текущий active
layero rollback

# конкретная ветка
layero rollback --branch=staging

# на конкретный deploy (по полному id или начальным 7+ символов SHA)
layero rollback --deploy=a3f9c2b
layero rollback --deploy=550e8400-e29b-41d4-a716-446655440000

# CI: без подтверждения
layero rollback --yes
```

## Что происходит

1. CLI вытаскивает список деплоев ветки и показывает текущий active +
   target кандидат:

   ```
   rollback plan:
     from: 1743a29  2026-05-08 20:30  v2.4.1 — bugfix release
     to:   8b34f01  2026-05-08 19:42  v2.4.0 — initial 2.4
   proceed with rollback? [y/N]
   ```

2. После confirm бэкенд:
   * Меняет `environments.active_deploy_id` на target deploy.
   * Сбрасывает CDN-кеш hostname'а ветки (новые запросы получат
     старый артефакт; старые edge-кеши по TTL обновятся за ~5 мин).
   * Возвращает обновлённый deploy с новым активным флагом.

3. CDN propagation — ~30–60 секунд.

## Ограничения

* Кандидат должен быть в статусе `ready` и иметь `s3_path` (артефакт в
  S3). Failed/queued/building деплои в кандидаты не идут.
* Rollback к самому себе (текущий active) — 400 error.
* Для **runtime**-проектов (SSR Next, Streamlit, Gradio, Flask)
  rollback флипает указатель на старый артефакт, но running-инстанс
  старого деплоя нужно явно дёрнуть — следующий request триггернёт
  cold start.

## Альтернативы

* В дашборде на странице **Deploys** у каждого ready-деплоя есть
  кнопка «Откатить» (кроме активного). Тот же endpoint.
* Если хочется **rebuild** того же commit'а (а не reuse артефакта) —
  делайте новый `layero deploy` с тем же кодом или жмите Redeploy в
  дашборде.
