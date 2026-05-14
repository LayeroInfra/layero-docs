---
sidebar_position: 4
title: Интеграции форм
description: Telegram-бот, Google Sheets, custom webhook — куда могут приходить заявки с лендинга.
---

# Интеграции форм

Каждый лендинг из `@layero` включает форму. Куда уходят данные, юзер выбирает в третьем квизе.

## Telegram

Заявки приходят в чат или группу через бот.

**Что нужно от юзера**:
1. Токен бота от [`@BotFather`](https://t.me/BotFather)
2. ID чата куда слать (через `@RawDataBot` — пишет любое сообщение, бот отвечает с chat_id)

**Что делает плагин**:
1. Создаёт мини-relay на FastAPI (`forms-relay/main.py`)
2. Деплоит его как Layero runtime-приложение
3. Прописывает env-vars `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`
4. Подставляет URL relay'а в `<form action>` лендинга

Юзеру не нужно настраивать CORS, держать своё API или поднимать сервер — Layero делает это в одно действие.

## Google Sheets

Заявки — новая строка в Google-таблице. Без своего бэкенда.

**Что нужно от юзера**:
1. Создать пустой Spreadsheet
2. Меню **Расширения** → **Apps Script** → вставить код (плагин его сгенерирует под нужные поля)
3. **Развернуть** → **Веб-приложение** → **Доступ: все** → скопировать URL
4. Вернуть URL в чат

**Что делает плагин**:
1. Генерирует Apps Script под колонки формы (timestamp, name, email, message, …)
2. Вписывает Web App URL в `<form action>`
3. Добавляет небольшой JS для thank-you-state без перезагрузки

CORS не нужен — Apps Script принимает `application/x-www-form-urlencoded` без preflight.

## Custom webhook / Notion / HubSpot / своё API

Если у юзера есть собственный endpoint или сервис (Notion, HubSpot, ConvertKit, Airtable, свой backend), плагин действует по схеме:

| Что у юзера | Что делает плагин |
|---|---|
| Webhook URL | Прописывает `<form action>` → готово |
| Public form embed (Mailchimp, HubSpot, etc.) | Извлекает action URL из embed-кода + дублирует field names |
| API-ключ от сервиса | Поднимает Layero relay (как Telegram), хранит ключ в env-vars, форвардит payload |
| Свой backend | Один вопрос: «какие поля он ожидает?» → подставляет имена |

## Когда intergration = `skip`

Юзер может явно пропустить выбор интеграции. В этом случае `<form action>` ставится в плейсхолдер `{{FORM_ACTION}}`, и юзер настраивает интеграцию позже (повторным вызовом `@layero add-integration ...`).
