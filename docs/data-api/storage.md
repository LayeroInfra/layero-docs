---
sidebar_position: 4.5
title: Файлы
description: Хранилище файлов базы — бакеты, политики на storage.objects, подписанные ссылки и лимиты. Совместимо с supabase.storage.
---

# Файлы

:::info[Бета-версия]

Data API работает в бета-версии и открыт пока не всем. Как получить доступ
и чего ждать от страниц, написано в [«Что такое Data API»](./index.md).

:::

Файлы живут на том же адресе, что и Data API: `https://data.layero.ru/<база>/storage/v1`.
Схема `storage` устроена как у Supabase — таблицы `storage.buckets` и
`storage.objects`, функция `storage.foldername()`, — поэтому `supabase.storage`
и политики переносимого проекта работают без правок. Байты лежат в объектном
хранилище, в базе — только строка о файле, и права на файл решает она.

## Включить

```bash
npx layero@latest data enable --db <база> --storage
```

Или в панели: «Базы данных» → база → «Файлы» → «Включить файлы».

Бакет заводится там же («Добавить бакет»): имя, публичный или приватный, предел
размера файла и допустимые типы (`image/jpeg, image/png`). Из кода сервера —
`supabase.storage.createBucket()` секретным ключом.

## Публичный и приватный бакет

| Бакет | Чтение | Запись и удаление |
|---|---|---|
| публичный | любой по прямой ссылке `…/storage/v1/object/public/<бакет>/<путь>` | по политикам |
| приватный | по политикам или по подписанной ссылке | по политикам |

Новый бакет закрыт, пока для него нет политик: без них файлы может читать и
писать только секретный ключ.

## Политики на `storage.objects`

Каждое действие проверяет свою политику — как у Supabase:

| Действие | Нужна политика |
|---|---|
| загрузка (`upload`) | `INSERT` |
| перезапись (`upload` с `upsert: true`) | `INSERT`, `SELECT` и `UPDATE` |
| чтение, скачивание, подписанная ссылка на чтение | `SELECT` |
| перенос (`move`) | `SELECT` и `UPDATE` |
| копирование (`copy`) | `SELECT` на исходный и `INSERT` на новый путь |
| удаление | `DELETE` |
| ссылка на загрузку (`createSignedUploadUrl`) | `INSERT` — проверяется при выдаче ссылки |

Право на таблицу тоже нужно, но открывает оно не всё, а ровно то, что
пропустит политика. Не выдавайте `GRANT ALL ON storage.objects` гостю: таблица
одна на все бакеты базы.

### Каждый пользователь — в своей папке

```sql
GRANT SELECT, INSERT, DELETE ON storage.objects TO authenticated;

CREATE POLICY "свои файлы: чтение" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "свои файлы: загрузка" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "свои файлы: удаление" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

```js
await db.storage.from("avatars").upload(`${user.id}/photo.jpg`, file);
```

### Гость загружает, но не читает

Форма обратной связи со снимком экрана: гость кладёт файл в приватный бакет,
читает его только владелец сайта.

```sql
GRANT INSERT ON storage.objects TO anon;

CREATE POLICY "гость кладёт снимок" ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'screenshots' AND (storage.foldername(name))[1] = 'reports');
```

Политики чтения у гостя нет — и для обычной загрузки она не нужна. Путь лучше
выдавать функцией приёма (случайное имя внутри папки обращения), а не брать
от гостя.

## Подписанные ссылки

```js
// ссылка на скачивание на 10 минут — нужен SELECT по политике
const { data } = await db.storage.from("screenshots").createSignedUrl(path, 600);

// ссылка на загрузку — браузер кладёт файл, не зная ключа; INSERT проверяется сейчас
const { data: up } = await db.storage.from("uploads").createSignedUploadUrl(path);
await db.storage.from("uploads").uploadToSignedUrl(path, up.token, file);
```

Подписанная ссылка работает без ключа, пока не истекла; после срока шлюз
отвечает `400 InvalidJWT`. Путь внутри ссылки подменить нельзя.

## Проверить права, не входя под пользователем

```bash
# какие файлы бакета видит пользователь
npx layero@latest data probe POST /storage/v1/object/list/screenshots --as user --user <id>
# может ли гость загрузить сюда (файл не пишется — проверяется политика INSERT)
npx layero@latest data probe POST /storage/v1/object/upload/sign/screenshots/reports/test.jpg
```

Проба файлов ничего не записывает: настоящую загрузку и удаление она не
выполняет, байты не откатываются.

## Лимиты

| Что | Значение |
|---|---|
| Файл | до 50 МБ на любом тарифе; меньше — пределом бакета |
| Место под файлы одной базы | Free — 1 ГБ, Pro — до 100 ГБ |
| Нет | преобразования картинок, возобновляемая загрузка, S3-протокол |

Запросы к файлам считаются в суточный лимит запросов базы — см. [«Чего нет»](./limits.md).
