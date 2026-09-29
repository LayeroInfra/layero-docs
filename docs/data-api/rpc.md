---
sidebar_position: 3
title: Функции и RPC
description: Вызов функций базы по HTTP. Схема api — единственная публичная витрина; имена аргументов — публичный контракт.
---

# Функции и RPC

:::info[Бета-версия]

Data API работает в бета-версии и открыт пока не всем. Как получить доступ
и чего ждать от страниц, написано в [«Что такое Data API»](./index.md).

:::

```
POST     https://data.layero.ru/<база>/rest/v1/rpc/<функция>     форма PostgREST
GET      https://data.layero.ru/<база>/rest/v1/rpc/<функция>     только STABLE/IMMUTABLE
POST     https://data.layero.ru/<база>/rpc/<функция>             своя форма
```

Функция — это способ дать посетителю сайта **одно конкретное действие**, не
открывая ни одной таблицы. Приём заявки, счётчик, начисление бонуса: снаружи
доступен вызов, а что он делает с данными, решает код внутри базы.

```sql
CREATE FUNCTION api.submit(site_token text, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.entries (site_token, payload) VALUES (site_token, payload);
    RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION api.submit(text, jsonb) TO layero.role('anon');
```

```js
await db.rpc("submit", { site_token: "abc", payload: { name: "Аня" } });
```

## Функции ищутся только в схеме `api`

Таблицы шлюз ищет в `api`, `public` и `app`, функции — **только в `api`**.
Заголовки `Accept-Profile` и `Content-Profile` на это не влияют.

Несимметрично это осознанно: `api` и есть публичная витрина. Функция в
`public` — внутренняя механика приложения, и делать её вызываемой из интернета
по факту существования нельзя.

Если функция лежит не там, отказ так и скажет:

```json
{
  "error": "unknown_function",
  "message": "функция api.submit не найдена или не открыта по API; одноимённая есть в public — по HTTP видна только схема api"
}
```

## Имена аргументов — публичный контракт

Шлюз раскладывает ключи JSON по **одноимённым** аргументам функции. Значит,
имя аргумента видно снаружи: оно попадает в код каждого клиента, а в случае
формы на чужом сайте — ещё и в чужие сниппеты.

Отсюда две вещи:

1. **Переименование аргумента ломает клиентов** — ровно как переименование поля
   в JSON. Планируйте имена как часть API, а не как локальную деталь.
2. **Внутри функции имя аргумента конфликтует с именем колонки.** PL/pgSQL
   подставит аргумент туда, где вы имели в виду колонку, и запрос упадёт с
   `column reference "token" is ambiguous` — в том числе внутри
   `ON CONFLICT (token, …)`, куда локальная переменная тоже подставляется.

Лечится это не переименованием аргумента (он публичный), а квалификацией имён
внутри функции:

```sql
CREATE FUNCTION api.submit(token text, payload jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
#variable_conflict use_column          -- колонка важнее переменной
BEGIN
    INSERT INTO public.counters AS c (token, minute, hits)
    VALUES (api.submit.token, date_trunc('minute', now()), 1)  -- аргумент — по полному имени
    ON CONFLICT (token, minute) DO UPDATE SET hits = c.hits + 1;
    RETURN jsonb_build_object('ok', true);
END $$;
```

## Изменяющая функция и GET

Функция с `VOLATILE` (умолчание) по GET недоступна и отвечает
`volatile_by_get`. Решает отметка волатильности в каталоге. GET кешируют и
повторяют — браузер, прокси, предзагрузка ссылок, — и «создай заказ» по GET
однажды создаст два заказа.

Функцию для чтения помечайте `STABLE`, тогда GET заработает.

## `SECURITY DEFINER` и права

`SECURITY DEFINER` выполняет тело от владельца базы — так публичная функция
пишет в закрытую таблицу, не открывая её. Правило одно: **проверяйте вход
внутри**, потому что вызвать её сможет любой посетитель сайта.

Право на вызов выдаётся отдельно: свежесозданная функция в схеме `api`
недоступна никому, даже если схема открыта — платформа снимает `EXECUTE` у
`PUBLIC` с каждой новой функции.
