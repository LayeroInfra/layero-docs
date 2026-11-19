---
sidebar_position: 2
title: Таблицы и REST
description: Чтение и запись таблиц по HTTP, фильтры PostgREST, выдача доступа роли и политики RLS.
---

# Таблицы и REST

**Таблицы базы доступны по адресу `https://data.layero.ru/<база>/rest/v1/<таблица>`** — методами GET, HEAD, POST, PATCH и DELETE.

Форма запроса — PostgREST, поэтому фильтры, сортировка, встроенные ресурсы и
заголовки `Prefer` работают так же, как в документации Supabase.

```bash
# первые пять записей, новые сверху
curl "https://data.layero.ru/moya-baza/rest/v1/entries?select=id,body,created_at&order=created_at.desc&limit=5" \
     -H "apikey: pk_live_…"

# одна запись по условию
curl "https://data.layero.ru/moya-baza/rest/v1/entries?id=eq.42&select=*" \
     -H "apikey: pk_live_…"
```

Ответ — не больше 1000 строк. Если `limit` не задан, шлюз ставит 1000, а больший `limit` молча урезает до 1000: например, `.range(0, 4999)` в supabase-js вернёт 1000 строк без ошибки. Нужно больше — запрашивайте по частям.

## Доступ: политика RLS, как в Supabase

Новая таблица в `public` сразу доступна ролям `anon`, `authenticated` и
`service_role` — права по умолчанию, как у Supabase. Какие строки видны, решает
RLS, поэтому включайте его сразу:

```sql
CREATE TABLE public.entries (id bigint generated always as identity primary key,
                             owner_id uuid default auth.uid(), body text,
                             created_at timestamptz default now());
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY entries_read_own ON public.entries
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid());
```

🚨 **Таблица без RLS отдаёт все строки любому с публичным ключом.** Платформа
предупреждает о такой: красная метка «видны все строки» в панели и строка в
`npx layero@latest data methods`. Таблицы, созданные до 26.10.2026 без RLS, закрыты —
откройте их после включения RLS: `npx layero@latest data grant <таблица> --get visitor`.

🚨 **Роли — `anon`, `authenticated`, `service_role`, как в Supabase.** Выдавайте права им, а не ищите «свою» роль в списке ролей сервера шаблоном: список общий для всех баз сервера, и права уйдут не туда.
Закрыть таблицу публичному ключу — `REVOKE … FROM anon`, как в Supabase.

Проверьте выданное не на глаз: панель выполнит запрос **от роли ключа** — от
`anon`, от вошедшего пользователя или от секретного ключа — и откатит
транзакцию.

## Отказы, которые вы увидите

Отказ приходит в теле ответа так: `error` — наш код отказа, `message` —
объяснение, `code` — код ошибки Postgres, если он есть, иначе тот же наш
код, `hint` — что сделать, часто с готовым SQL. Supabase-js показывает
`code`, а различать отказы удобнее по `error`.

| `error` | Ответ | Что это значит |
|---|---|---|
| `unknown_table` | 404 | такой таблицы нет — проверьте имя и схему |
| `permission_denied` | 401 гостю, 403 вошедшему, `code` 42501 | таблица есть, но этому ключу закрыта. В `hint` — как открыть: в панели или `layero data grant` |
| `no_table_grant` | 401 или 403, `code` 42501 | у роли нет нужного права, например на запись. В `hint` — готовый `GRANT` |
| `no_schema_access` | 401 или 403, `code` 42501 | роли закрыта сама схема |
| — | 200, пустой массив | права есть, но политика RLS не пускает ни одной строки |

Самая частая точка непонимания — последняя строка: **пустой ответ не
ошибка, а работающая политика**.

## Запись

```js
// вставить и вернуть вставленную строку: без .select() supabase-js её не возвращает
await db.from("entries").insert({ body: "Привет" }).select();
```

`Prefer: return=representation` возвращает строку — и попадает под
политику **чтения**, а не только вставки. Если политика чтения не пускает автора, запрос с возвратом получит отказ RLS и строка не сохранится, хотя та же вставка без возврата прошла бы. Подробности и рецепт — [«Грабли переезда»](./pitfalls.md).
