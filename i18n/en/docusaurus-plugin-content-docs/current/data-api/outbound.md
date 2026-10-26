---
sidebar_position: 6
title: HTTP from SQL
description: Telegram notifications and webhooks straight from a database function — net.http_post, like pg_net in Supabase.
---

# HTTP from SQL

:::info[Beta]

Data API is in beta and isn't open to everyone yet. How to get access and
what to expect from these pages is covered in [What Data API Is](./index.md).

:::

A Telegram notification, a webhook to your server, a call to a third-party API
is an ordinary database function that calls `net.http_post`. The functions are
the same as in the `pg_net` extension in Supabase, so code from there moves over
unchanged, except for secrets.

| Function | What it does |
|---|---|
| `net.http_post(url, body, params, headers, timeout_milliseconds)` | POST with a JSON body; `Content-Type: application/json` by default |
| `net.http_get(url, params, headers, timeout_milliseconds)` | GET |
| `net.http_delete(url, params, headers, timeout_milliseconds)` | DELETE |

Every argument except `url` is optional. The function returns the request id
(`bigint`) and returns immediately: the request goes out after the transaction
commits.

The `net` schema appears in the database together with the Data API. If the
database already has its own `net` schema or the `pg_net` extension, Layero
leaves it alone.

## A Telegram notification

First set a secret — the bot token from @BotFather. The value goes to Layero
and never lands in the database:

```bash
printf %s "$BOT_TOKEN" | npx layero@latest data secrets set TELEGRAM_BOT_TOKEN --db <database>
```

The same in the panel: "Data API" → "Access" → "Secrets".

In the URL, headers and body of a request a secret is written as
`{{secrets.NAME}}` — Layero substitutes the value when sending.

### Option 1. One function writes and notifies

The site calls one RPC method. The write and the notification share a
transaction: nothing written — nothing sent.

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
                               'text', 'New report: ' || left(submit_report.message, 500))
  );
  RETURN jsonb_build_object('id', id);
END $$;

GRANT EXECUTE ON FUNCTION api.submit_report(text, text) TO anon;
```

### Option 2. A trigger — when the table is written several ways

If the site writes through the Data API, your server through the connection
string and migrations as well, hang the notification on a trigger: it can't be
bypassed.

```sql
CREATE FUNCTION private.notify_new_report() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM net.http_post(
    url  := 'https://api.telegram.org/bot{{secrets.TELEGRAM_BOT_TOKEN}}/sendMessage',
    body := jsonb_build_object('chat_id', 123456789, 'text', 'New report: ' || new.message)
  );
  RETURN new;
END $$;

CREATE TRIGGER reports_notify AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION private.notify_new_report();
```

⚠️ Don't make a separate "send a notification" RPC that the site calls after
the write. Anyone with your public key can call it with any text, and between
the two calls the write and the notification drift apart.

## A webhook to your server

```sql
PERFORM net.http_post(
  url     := 'https://example.com/hooks/order',
  headers := jsonb_build_object('Content-Type', 'application/json',
                                'Authorization', 'Bearer {{secrets.HOOK_TOKEN}}'),
  body    := jsonb_build_object('type', 'INSERT', 'table', 'orders', 'record', to_jsonb(new))
);
```

## What happens after the call

1. The request lands in the `net.http_request_queue` queue — in the same
   transaction as your write. Rolled back — the request won't go out.
2. After the commit Layero sends it. Internal addresses are refused: the
   request only goes to the internet.
3. Network failures, 5xx, 408 and 429 are retried with a growing delay, up to
   5 attempts. 4xx and setup errors (missing secret, bad address) are not
   retried: a person fixes those, not time.
4. The outcome goes to `net._http_response` under the same id: status code,
   headers, body (up to 64 KB, secret values cut out), `timed_out`,
   `error_msg`. Responses are kept for 6 hours, as in `pg_net`.

```sql
SELECT id, status_code, error_msg, left(content, 200)
  FROM net._http_response ORDER BY id DESC LIMIT 10;
```

The timeout is `timeout_milliseconds`, but no more than 15 seconds. Requests
count toward the database's daily request limit.

## Differences from `pg_net` in Supabase

| | Supabase `pg_net` | Layero |
|---|---|---|
| `net.http_*` signatures | — | the same |
| Sending | after commit | after commit |
| Retries | no | yes, up to 5 attempts |
| Secrets | `vault.decrypted_secrets` right in SQL | `{{secrets.NAME}}` — the value never lands in the database |
| Internal addresses | reachable | refused |
| Database Webhooks in the panel | yes | no: a webhook is the trigger from option 2 |

If code from Supabase reads a token from `vault.decrypted_secrets`, replace that
expression with `{{secrets.NAME}}` in the URL or header string.
