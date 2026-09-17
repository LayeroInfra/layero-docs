---
sidebar_position: 6
title: Outbound Calls
description: Telegram notifications and webhooks straight from the database — the api.outbox queue and a synchronous call through the gateway.
---

# Outbound Calls

:::warning[Section in testing]

Data API is not yet open to everyone — a closed pilot is underway. How to
get access and what to expect from these pages is written up in
["What Data API Is"](./index.md).

:::

The gateway reaches out, not the database. Your database deliberately has no
extensions like `http` or `pg_net`: a synchronous HTTP call from Postgres
eats up connections, and being able to reach anywhere from SQL would be an
open proxy running from our address.

The mechanism has three parts, and none of them is hardcoded for a specific
service: Telegram is configured the same way as any webhook.

| Part | What it is |
|---|---|
| **Secrets** | values substituted into the call and never returned outward |
| **Allowed hosts** | a list like `api.telegram.org` — without it we'd be an open proxy |
| **Call description** | method, address, headers, and body with substitutions |

All three are configured for the database in the panel ("API" section →
"Outbound").

## Call description

```json
{
  "name": "telegram_notify",
  "method": "POST",
  "url_template": "https://api.telegram.org/bot{{secrets.TELEGRAM_BOT_TOKEN}}/sendMessage",
  "body_template": {
    "chat_id": "{{secrets.CHAT_ID}}",
    "text": "{{args.text}}"
  }
}
```

There are exactly two kinds of substitution: `{{secrets.X}}` — your secret,
`{{args.y}}` — whatever the caller passed. There's no free-form `fetch`
through us: the address and headers are set by the description, not by the
caller.

## Two delivery paths

### Queue — from inside the database itself

```sql
CREATE FUNCTION api.submit(payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_id bigint;
BEGIN
    INSERT INTO public.entries (payload) VALUES (payload) RETURNING id INTO new_id;
    INSERT INTO api.outbox (call_name, args)
    VALUES ('telegram_notify',
            jsonb_build_object('text', 'New submission #' || new_id));
    RETURN jsonb_build_object('ok', true, 'id', new_id);
END $$;
```

The `api.outbox` table lives **in your database**, so the write and the
notification land in the same transaction: if the submission rolls back, the
notification never goes out. The gateway drains the queue, retries with
growing backoff, and records the outcome in the same rows (`status`,
`attempts`, `response_code`, `last_error`).

Network failures and 5xx responses are retried. 4xx and configuration errors
are not — those get fixed by a person, not by waiting.

### Synchronous — from the application

```
POST https://data.layero.ru/<database>/call/<name>
```

The external service's response is returned to the caller. The public key
can make this call only if the description explicitly allows an anonymous
call: otherwise the public key would mean the right to send anything,
anywhere, from our address.

## What's already handled

- **Secrets are never returned** — values are stripped from the response
  body, from the error text, and from the log.
- **SSRF protection** — the address is resolved and checked: internal ranges
  are forbidden, and DNS spoofing against them doesn't get through.
- **Telegram gets through.** DNS returns a single address for
  `api.telegram.org`, and it's blocked outright from some networks. The
  gateway tries it along with Telegram's fallback addresses, connects to
  whichever one completes the handshake, and keeps the hostname for TLS —
  the certificate is checked by name, not by address.
- **A host added just now works right away** — a `host_not_allowed` refusal
  is re-checked against the current list.
