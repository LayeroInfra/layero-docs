---
sidebar_position: 6
title: HTTP из SQL
description: Уведомления в Telegram и вебхуки прямо из функции базы — net.http_post, как pg_net у Supabase.
---

# HTTP из SQL

:::info[Бета-версия]

Data API работает в бета-версии и открыт пока не всем. Как получить доступ
и чего ждать от страниц, написано в [«Что такое Data API»](./index.md).

:::

Уведомление в Telegram, вебхук на ваш сервер, вызов чужого API — это обычная
функция базы, которая зовёт `net.http_post`. Функции те же, что у расширения
`pg_net` в Supabase, поэтому код оттуда переносится без правок, кроме секретов.

| Функция | Что делает |
|---|---|
| `net.http_post(url, body, params, headers, timeout_milliseconds)` | POST с телом JSON; заголовок `Content-Type: application/json` по умолчанию |
| `net.http_get(url, params, headers, timeout_milliseconds)` | GET |
| `net.http_delete(url, params, headers, timeout_milliseconds)` | DELETE |

Все аргументы, кроме `url`, необязательны. Функция возвращает номер запроса
(`bigint`) и сразу отдаёт управление: запрос уходит после коммита транзакции.

Схема `net` появляется у базы вместе с Data API. Если у базы уже есть своя
схема `net` или расширение `pg_net`, Layero её не трогает.

## Уведомление в Telegram

Сначала задайте секрет — токен бота от @BotFather. Значение уходит в Layero
и в базу не попадает:

```bash
printf %s "$BOT_TOKEN" | npx layero@latest data secrets set TELEGRAM_BOT_TOKEN --db <база>
```

То же — в панели: «Data API» → «Доступ» → «Секреты».

В адресе, заголовках и теле запроса секрет пишется как `{{secrets.ИМЯ}}` —
Layero подставит значение при отправке.

### Вариант 1. Одна функция пишет и уведомляет

Сайт зовёт один RPC-метод. Запись и уведомление в одной транзакции: не
записалось — не отправилось.

```sql
CREATE FUNCTION api.submit_report(site_key text, message text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s  public.sites%ROWTYPE;
  id bigint;
BEGIN
  SELECT * INTO s FROM public.sites WHERE sites.key = submit_report.site_key;
  IF NOT FOUND THEN RAISE EXCEPTION 'unknown site key'; END IF;

  INSERT INTO public.reports (site_id, message) VALUES (s.id, submit_report.message)
  RETURNING reports.id INTO id;

  PERFORM net.http_post(
    url  := 'https://api.telegram.org/bot{{secrets.TELEGRAM_BOT_TOKEN}}/sendMessage',
    body := jsonb_build_object('chat_id', s.telegram_chat_id,
                               'text', 'Новое обращение: ' || left(submit_report.message, 500))
  );
  RETURN jsonb_build_object('id', id);
END $$;

GRANT EXECUTE ON FUNCTION api.submit_report(text, text) TO anon;
```

### Вариант 2. Триггер — если пишут несколькими путями

Если в таблицу пишут и сайт через Data API, и ваш сервер по строке
подключения, и миграции, уведомление надёжнее повесить на триггер: его не
обойти.

```sql
CREATE FUNCTION private.notify_new_report() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM net.http_post(
    url  := 'https://api.telegram.org/bot{{secrets.TELEGRAM_BOT_TOKEN}}/sendMessage',
    body := jsonb_build_object('chat_id', 123456789, 'text', 'Новое обращение: ' || new.message)
  );
  RETURN new;
END $$;

CREATE TRIGGER reports_notify AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION private.notify_new_report();
```

⚠️ Не делайте отдельный RPC «отправь уведомление», который сайт зовёт после
записи. Его позовёт кто угодно с вашим публичным ключом и любым текстом, а
между двумя вызовами запись и уведомление разойдутся.

## Вебхук на ваш сервер

```sql
PERFORM net.http_post(
  url     := 'https://example.ru/hooks/order',
  headers := jsonb_build_object('Content-Type', 'application/json',
                                'Authorization', 'Bearer {{secrets.HOOK_TOKEN}}'),
  body    := jsonb_build_object('type', 'INSERT', 'table', 'orders', 'record', to_jsonb(new))
);
```

## Что происходит после вызова

1. Запрос ложится в очередь `net.http_request_queue` — в той же транзакции,
   что и ваша запись. Откатилась транзакция — запрос не уйдёт.
2. После коммита Layero отправляет его. Внутренние адреса запрещены: запрос
   уходит только в интернет.
3. Любой ответ сервера — итог, как у `pg_net`: 3xx, 4xx и 5xx записываются
   с кодом, и по `status_code` решает ваш код. Переадресацию Layero не
   проходит. Повторяются только сетевые сбои и тайм-аут, когда ответа нет
   вовсе, — с растущей задержкой, до 5 попыток. Ошибки настройки (нет
   секрета, неверный адрес) не повторяются: их чинит человек, а не время.
4. Итог — в `net._http_response` под тем же номером: код, заголовки, тело
   (до 64 КБ, значения секретов вырезаны), `timed_out`, `error_msg`. Ответы
   хранятся 6 часов, как у `pg_net`.
5. В очереди одной базы — не больше 1000 неотправленных запросов. Сверх
   этого `net.http_*` сразу отказывает ошибкой: чаще всего это функция,
   которая зовёт запрос в цикле.

```sql
SELECT id, status_code, error_msg, left(content, 200)
  FROM net._http_response ORDER BY id DESC LIMIT 10;
```

Таймаут — `timeout_milliseconds`, но не больше 15 секунд. Запросы считаются в
суточный лимит запросов базы.

## Отличия от `pg_net` в Supabase

| | Supabase `pg_net` | Layero |
|---|---|---|
| Сигнатуры `net.http_*` | — | те же |
| Отправка | после коммита | после коммита |
| Повторы | нет | только сетевой сбой и тайм-аут, до 5 попыток; любой ответ сервера — итог |
| Секреты | `vault.decrypted_secrets` прямо в SQL | `{{secrets.ИМЯ}}` — значение в базу не попадает |
| Внутренние адреса | доступны | запрещены |
| Database Webhooks в панели | есть | нет: вебхук — это триггер из варианта 2 |

Если в коде из Supabase токен читается из `vault.decrypted_secrets`, замените
это выражение на `{{secrets.ИМЯ}}` в строке адреса или заголовка.

## Входящие вебхуки — их нет

HTTP из SQL работает в одну сторону: из базы наружу. Адреса, который принимает
чужой запрос без ключа и запускает вашу функцию, у Data API нет. В Supabase
такие запросы принимают Edge Functions, а у нас их нет: исполнять ваш код на
своей стороне мы не будем.

Чем заменить, от лучшего варианта к худшему:

1. **Сервис умеет добавлять заголовки** — ваш бэкенд, интеграционная платформа.
   Пусть он сам вызывает функцию:
   `POST https://data.layero.ru/<адрес-базы>/rest/v1/rpc/<функция>` с ключом
   в заголовке `apikey`. Секретный ключ держите только на сервере.
2. **Сервис только шлёт вебхук** (Telegram, ЮKassa, GitHub). Поднимите на
   Layero маленькое серверное приложение на Node или Python. Оно принимает
   вебхук, проверяет подпись или секрет сервиса и вызывает функцию базы
   секретным ключом. Это обычный проект Layero, отдельной платформы для него
   не нужно.
3. **У сервиса есть метод «дай новое»** — например, `getUpdates` у бота
   Telegram. Функция базы опрашивает его через `net.http_get` и читает ответ
   из `net._http_response`. Так можно, но держите опрос в рамках:
   - опрашивайте, только пока ждёте ответа (открыто окно «подключить бота»),
     и ограничьте ожидание сроком, например 15 минут;
   - не чаще раза в 2 секунды;
   - передавайте `offset`, чтобы не перечитывать одно и то же;
   - помните, что каждый вызов функции из браузера идёт в суточный лимит
     запросов базы, а ответы хранятся 6 часов и занимают её место.

   У Telegram опрос и вебхук взаимоисключающие: пока у бота задан вебхук,
   `getUpdates` отвечает ошибкой.
