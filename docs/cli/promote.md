---
sidebar_position: 5
title: layero promote
description: Перевести production apex на конкретный деплой — из любой ветки, без пересборки. Плюс one-click rollback на предыдущий production.
---

# `layero promote`


:::danger[Формы команды проверены 27.07.2026]
- Деплой указывается **позиционным аргументом**: `layero promote <commit-sha>`.
  Флага `--deploy=` не существует. Sha берётся из `layero deploys list`.
- **`layero promote --rollback` не существует** — CLI отвечает
  `unknown option`. Про рабочий откат — [Rollback](./rollback).
:::

Перевести production apex проекта на указанный деплой. Двигает указатель `production_deploy_id` — без пересборки, апекс начинает отдавать новый артефакт практически сразу (задержку даёт только короткий кеш на edge, до минуты).

## Зачем

Production-флоу в Layero «как у Vercel»:

1. Push в любую ветку → preview-URL ветки
2. Тестируем, шерим, сравниваем
3. Готовы выкатить — **promote** на тот ready-деплой, который проверили

Без promote'а apex продолжает отдавать предыдущий production. Это страховка от случайных релизов после merge'а в main (если auto-promote выключен для команды).

## Использование

```bash
# последняя готовая загрузка из CLI (ветка cli)
layero promote

# последняя готовая сборка основной ветки репозитория
layero promote --branch=main

# promote по commit SHA (первые 7+ символов) или полному deploy id
layero promote a3f9c2b

# конкретная ветка → её последний ready
layero promote --branch=staging

# откат: вернуть apex на прошлый рабочий деплой — по его sha
layero promote <commit-sha>

# CI: без подтверждения
layero promote --yes
```

:::warning[Без аргумента — ветка `cli`]
Без SHA и без `--branch` команда берёт последнюю готовую загрузку из CLI,
а не сборку основной ветки. У проекта с репозиторием это может выкатить
в продакшен старую загрузку. Указывайте SHA или `--branch=main`.
:::

## Что происходит

1. CLI находит deploy (по позиционному sha, по последнему ready в `--branch`, а без них — по последнему ready в ветке `cli`).
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
4. Edge подхватывает новый артефакт сразу; ранее закэшированные ответы обновляются по короткому TTL (до минуты).

## Откат

`layero rollback` вернёт предыдущий успешный деплой вместе с апексом —
если production обслуживается той же веткой (починено 27.07.2026; до этого
двигалось только окружение, и апекс оставался на сломанной версии).

Если возвращаться надо на конкретный старый деплой, а не на предыдущий, —
`promote` по нужному sha:

```bash
layero deploys list                # взять commit_sha рабочего билда
layero promote ff0d1b86 --yes      # вернуть на него апекс
```

Платформа хранит на проекте два указателя — `production_deploy_id` и
`previous_production_deploy_id`; второй обновляется при каждом promote, поэтому
предыдущий рабочий деплой всегда видно в истории промоутов. Подробности —
[Rollback](./rollback).

## `--promote` как флаг `layero deploy`

Если хочется одной командой: build → promote, не дожидаясь ready'я в UI:

```bash
layero deploy --promote --yes
```

Билд завершится, CLI автоматом перейдёт в promote и подтвердит. Эквивалентно `layero deploy ... && layero promote <last-sha>`, но без второй ручной команды.

## Ограничения

- Promote можно сделать только на `ready`-деплой с `s3_path` (или зарегистрированным runtime-контейнером).
- Для **runtime**-проектов (SSR Next, Streamlit, Gradio, Flask) promote переключает указатель моментально, но running-инстанс старого билда продолжает отвечать пока его не дёрнут (cold-start триггернёт следующий запрос на новом артефакте).
- Если auto-promote default-ветки **включён**, любой следующий push в default перетрёт ваш ручной promote. Выключите auto-promote в Settings проекта если хотите оставить ручной контроль за production.

## Альтернативы

- В дашборде на странице деплоя — кнопка «Promote to production».
- На странице проекта в Production card — кнопка «Откатить». Она работает на стороне бэкенда и двигает production-указатель; с 27.07.2026 то же делает и CLI-команда [`rollback`](./rollback).
- История промоутов — Project → Deploys → «Promote history» (видно auto vs ui vs cli + кто).

## Как это связано с rollback

Раньше у каждой ветки был свой канонический хост, и `layero rollback` менял
`environments.active_deploy_id` — то есть работал по-веточно. Под V071 модель
доменов стала одна-на-проект, и откат должен двигать **production-указатель**
проекта. Какое-то время CLI-команда за этой сменой не поспевала и апекс не
возвращала; починено 27.07.2026 — теперь `rollback` двигает и указатель, если
апекс обслуживается той же веткой. Подробности — [Rollback](./rollback).
