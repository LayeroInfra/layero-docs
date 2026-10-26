---
sidebar_position: 2
title: Таблицы и REST
description: Чтение и запись таблиц по HTTP, фильтры PostgREST, выдача доступа роли и политики RLS.
---

# Таблицы и REST

:::info[Бета-версия]

Data API работает в бета-версии и открыт пока не всем. Как получить доступ
и чего ждать от страниц, написано в [«Что такое Data API»](./index.md).

:::

```
GET|HEAD|POST|PATCH|DELETE  https://data.layero.ru/<база>/rest/v1/<таблица>
```

Форма запроса — PostgREST, поэтому фильтры, сортировка, встроенные ресурсы и
заголовки `Prefer` работают так же, как в документации Supabase.

```bash
# первые пять записей, новые сверху
curl "https://data.layero.ru/moya-baza/rest/v1/entries?select=id,name,created_at&order=created_at.desc&limit=5" \
     -H "apikey: pk_live_…"

# одна запись по условию
curl "https://data.layero.ru/moya-baza/rest/v1/entries?id=eq.42&select=*" \
     -H "apikey: pk_live_…"
```

Если `limit` не задан, шлюз ставит свой — 1000 строк. Запрос без предела
выедал бы пул соединений, общий для всех баз платформы.

## Доступ: политика RLS, как в Supabase

Новая таблица в `public` сразу доступна ролям `anon`, `authenticated` и
`service_role` — права по умолчанию, как у Supabase. Какие строки видны, решает
RLS, поэтому включайте его сразу:

```sql
CREATE TABLE public.entries (id bigint generated always as identity primary key,
                             owner_id uuid default auth.uid(), body text);
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY entries_read_own ON public.entries
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid());
```

🚨 **Таблица без RLS отдаёт все строки любому с публичным ключом.** Платформа
предупреждает о такой: красная метка «видны все строки» в панели и строка в
`npx layero@latest data methods`. Таблицы, созданные до 26.10.2026 без RLS, закрыты —
откройте их после включения RLS: `npx layero@latest data grant <таблица> --get visitor`.

🚨 **Роли — `anon`, `authenticated`, `service_role`, как в Supabase.** Не ищите
«свою» роль шаблоном (`rolname ~ '^u_.*_anon$'`): список ролей общий на весь
сервер, шаблон совпадает с ролями чужих арендаторов, и права уезжают не туда.
Закрыть таблицу публичному ключу — `REVOKE … FROM anon`, как в Supabase.

Проверьте выданное не на глаз: панель выполнит запрос **от роли ключа** — от
`anon`, от вошедшего пользователя или от секретного ключа — и откатит
транзакцию.

## Отказы, которые вы увидите

| Ответ | Что это значит |
|---|---|
| `unknown_table` (404) | такой таблицы нет — проверьте имя и схему |
| `42501` (401 гостю, 403 вошедшему) | таблица есть, но этому ключу не открыта: нет гранта. В `hint` — как открыть (панель или `layero data grant`) |
| `no_table_grant` | таблица есть, но у роли нет нужного права; в `hint` лежит готовый `GRANT` |
| `permission_denied` / `42501` | отказ самой базы |
| пустой массив | грант есть, а политика RLS не пускает ни одной строки |

Разница между последними двумя — самая частая точка непонимания: **пустой
ответ — не ошибка, а работающая политика**.

## Запись

```js
// insert + вернуть вставленное (так по умолчанию делает supabase-js)
await db.from("entries").insert({ name: "Аня" }).select();
```

`Prefer: return=representation` возвращает строку — и попадает под
политику **чтения**, а не только вставки. Если политика чтения не пускает автора,
вставка пройдёт, а запрос ответит отказом RLS; подробности и рецепт —
[Грабли переезда](./pitfalls.md).
