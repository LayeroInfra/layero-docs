---
sidebar_position: 3
title: Переменные окружения
description: Env vars шифруются AES-256-GCM, доступны на стадии сборки и в runtime-контейнере.
---

# Переменные окружения

Env vars задаются в дашборде проекта (**Project → Environment Variables**)
или через API. Они доступны процессу сборки и попадают в `process.env`.

## Где они применяются

Env vars подставляются в окружение **на стадии сборки** (этап `env`
в pipeline билдера, до `install`). Это значит, что фреймворки, которые
встраивают переменные в бандл (Vite, Next.js с `NEXT_PUBLIC_*`, CRA с
`REACT_APP_*`), увидят их и зашьют в артефакты.

Для **runtime-проектов** (SSR Next, Streamlit, Gradio) переменные
дополнительно прокидываются в окружение запущенного контейнера —
доступны в runtime через тот же `process.env` / `os.environ`.

## Безопасность

Значения шифруются в БД алгоритмом **AES-256-GCM** с уникальным nonce
на запись. Ключ шифрования (`ENV_ENCRYPTION_KEY`) хранится отдельно от
БД и не доступен из приложений. В UI значения скрыты по умолчанию, при
просмотре можно «раскрыть» конкретную запись.

## Что НЕ хранить

- **Никогда не коммитьте `.env*`** — `.env`, `.env.local` и т. п.
  попадают в встроенный denylist `layero deploy` и в любом случае не
  заливаются. Но если они окажутся в git-репо при GitHub-flow — Layero
  склонирует их на стадии `clone`.
- **Production-секреты не должны попадать в `NEXT_PUBLIC_*` /
  `VITE_*` / `REACT_APP_*`** — эти префиксы означают «попасть в
  клиентский бандл». Используйте их только для публичных значений
  (например, public API endpoints, токены аналитики и т. п.).

## CLI / API

Через UI — самый простой путь. Если нужен скрипт:

```bash
curl -X PUT https://api.layero.ru/projects/{id}/env \
  -H "Authorization: Bearer $LAYERO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vars": [{"key": "API_URL", "value": "https://api.example.com"}]}'
```

(Полная спека API публикуется отдельно.)
