---
sidebar_position: 1
title: When you need an app with a server
description: Next.js with server rendering, Node.js servers (Express, NestJS, Fastify) and Python servers (Django, FastAPI, Flask), Streamlit and Gradio — the app types, how to set the type and what the app needs.
---

# When you need an app with a server

**Most frontend projects are static sites: the build leaves a folder of HTML, JavaScript and CSS, and Layero serves it as is.** This is the fastest and cheapest mode.

But some applications cannot be turned into an SPA — they need a **process on
the server**:

- **Next.js with server rendering** — without `output: 'export'`;
- **a Node server** — Express, NestJS, Fastify or any other that listens on a port;
- **a Python application** — Django, FastAPI, Flask, any WSGI/ASGI app;
- **Streamlit / Gradio** — Python applications with a web interface.

Layero runs such projects as apps with a server.

## App types

| Type | What it is |
|---|---|
| `spa` | A static site (the default). |
| `ssr_next` | Next.js with server rendering or API routes. |
| `node_web` | **Any Node server** that listens on HTTP: Express, Fastify, NestJS, Koa, Hono and others. |
| `python_web` | **Any WSGI/ASGI application**: Django, FastAPI, Flask, Starlette, Litestar and others. |
| `streamlit` | A Streamlit application (needs `app.py`). |
| `gradio` | A Gradio application (needs `app.py`). |

`flask` is a legacy name kept for compatibility — it is an alias of
`python_web`. New projects get `python_web`.

The platform has a ready image for each type — you don't build your own.

### Setting the type by hand

Usually you do not have to: the type is detected (see below). If Layero took a
server for a static site, there are three ways:

- **`layero.json` in the repository** — the value travels with the code:

  ```json title="layero.json"
  { "runtime": "node_web", "startCommand": "node dist/server.js", "port": 3000 }
  ```

  All keys are on the [`layero.json`](../build/layero-json.md) page.
- **A CLI flag** — one-off, no file: `npx layero@latest deploy -t node_web`
  (or `-t python_web`, `-t ssr_next`).
- **The dashboard** — project → «Настройки» (Settings) → «Сборка и деплой» (Build and deploy): the type follows from the framework you pick.

### What the app has to do

- **Start command.** For a Node app Layero takes the `start` script from
  `package.json`. No `start` script — set `startCommand`. Paths in the command
  are relative to `/app`, and the file must exist after the build.
- **Address and port.** The app listens on `0.0.0.0` and on the port from
  `$PORT`: `uvicorn main:app --host 0.0.0.0 --port $PORT`. A server on
  `127.0.0.1` is unreachable from outside the container, and the launch fails.
  If the app listens on its own port, put it into `port`.
- **An answer to `GET /`.** The launch probe expects a response without a 5xx.
  A long-polling bot with no HTTP server cannot pass it.

After the `ready` event the first request may get a 404 placeholder for up to
a minute while the app starts. A 404 that outlives a minute is a real
failure: read `npx layero@latest logs --runtime`.

### Visitor address

The address the visitor connected from is in the `X-Real-IP` header. The
platform sets it, and the visitor cannot forge it. It is safe to rely on for
rate limits, blocks and logs.

`X-Forwarded-For` is a chain of addresses: the visitor sends the left-hand
elements, the platform appends the last one. If you read this header, use only
the last element.

### What the platform adds to a Python app

The `python_web` image first installs the dependencies from `requirements.txt`
(or runs your install command — `installCommand` in `layero.json`), then adds
`gunicorn>=21.2` and `uvicorn[standard]>=0.30` in a separate step. That is why
the build log shows them being installed even when `requirements.txt` does not
list them. This is not an error: the default start commands run on them.

| App | Default start command |
|---|---|
| ASGI (FastAPI, Starlette, etc.) | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| WSGI (Flask, etc.) | `gunicorn main:app --bind 0.0.0.0:$PORT`; the number of workers depends on the instance memory |
| Django | `uvicorn <project>.asgi:application …` or `gunicorn <project>.wsgi:application …` |

`main` is replaced with the first module found among `main`, `app`,
`application`, `server`, `asgi`, `wsgi`. aiohttp and Tornado start as
`python main.py`, Sanic with its own server. Set your own command with
`startCommand` in `layero.json`. The servers are installed anyway, and your own
install command does not remove them either. If `requirements.txt` pins
`gunicorn` or `uvicorn` below these minimums, the build installs a newer
version. Streamlit and Gradio run their own servers, and `gunicorn` and
`uvicorn` are not added to them.

### What is detected automatically

The type is inferred from your dependencies, so you rarely need to pick it by
hand.

**Python → `python_web`.** Frameworks: Django, FastAPI, Flask, Starlette,
Litestar, Quart, Sanic, BlackSheep, Falcon, Bottle, Pyramid, CherryPy,
aiohttp, Tornado. Servers: Uvicorn, Gunicorn, Hypercorn, Daphne. The entry
point is looked up in `app.py`, `main.py` or `manage.py`.

**Node → `node_web`.** Express, Fastify, Koa, NestJS, Hapi, Hono, AdonisJS,
Restify, Polka, Feathers, Sails, h3, Elysia, json-server.

If your framework is not on the list but the app listens on an HTTP port, it
still runs: set `node_web` or `python_web`
[by hand](#setting-the-type-by-hand).
The list drives auto-detection; it is not a restriction.

## Running and idling

An app runs while it's being called: without requests it freezes, then goes
to sleep and wakes up on the first request. What this means for your code,
what resources the plan gives and which time is paid for — on
[Running and idling](./lifecycle.md).

## Files and state

Everything an app writes to disk is gone after a restart. Read
[Files and state](./stateless.md) **before** moving an app that writes to
SQLite, keeps sessions in files or caches on disk.
