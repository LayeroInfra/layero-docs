---
sidebar_position: 1
title: When you need a runtime
description: SSR Next.js, any Node server (Express, NestJS, Fastify), any Python WSGI/ASGI app (Django, FastAPI, Flask), Streamlit and Gradio — for applications with a long-lived process.
---

# When you need a runtime

Most frontend projects are static: `npm run build` produces a folder of
HTML/JS/CSS and putting that in storage is enough. This is Layero's fastest
and cheapest mode.

But some applications cannot be turned into an SPA — they need a **process on
the server**:

- **SSR Next.js** without `output: 'export'`;
- **a Node server** — Express, NestJS, Fastify or any other that listens on a port;
- **a Python application** — Django, FastAPI, Flask, any WSGI/ASGI app;
- **Streamlit / Gradio** — Python applications with a web interface.

For those Layero runs a user **container**.

## Supported presets

| `project_type` | What it is |
|---|---|
| `spa` | Static output (the default). |
| `ssr_next` | Next.js with SSR or API routes. |
| `node_web` | **Any Node server** that listens on HTTP: Express, Fastify, NestJS, Koa, Hono and others. |
| `python_web` | **Any WSGI/ASGI application**: Django, FastAPI, Flask, Starlette, Litestar and others. |
| `streamlit` | A Streamlit application (needs `app.py`). |
| `gradio` | A Gradio application (needs `app.py`). |

`flask` is a legacy name kept for compatibility — it is an alias of
`python_web`. New projects get `python_web`.

Each preset uses a ready-made Dockerfile template — you do not build your own
image.

### Setting the type by hand

Usually you do not have to: the type is detected (see below). If Layero took a
server for a static site, there are three ways:

- **`layero.json` in the repository** — the value travels with the code:

  ```json title="layero.json"
  { "runtime": "node_web", "startCommand": "node dist/server.js", "port": 3000 }
  ```

  All keys are on the [`layero.json`](../deploys/layero-json.md) page.
- **A CLI flag** — one-off, no file: `npx layero@latest deploy -t node_web`
  (or `-t python_web`, `-t ssr_next`).
- **The dashboard** — **Project → Runtime type**.

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
a minute while the container starts. A 404 that outlives a minute is a real
failure: read `npx layero@latest logs --runtime`.

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

## Cold start

The container **starts on the first request**, serves traffic and **goes to
sleep when idle**. Which means:

- Woken from a warm state, an application answers in **~0.2 s**; a fully cold
  start takes **4–12 s** depending on the stack (Python is faster, Streamlit
  slower). These are medians of real measurements; the per-stack table and all
  the states are in [Lifecycle](./lifecycle).
- Applications with regular traffic are **kept warm automatically** by the
  platform.
- While idle, a project costs nothing in compute — which is what people like
  serverless for.

Dedicated keep-warm (guaranteed no cold starts) is a paid setting in the
plans.

## The stateless invariant

The container's filesystem is **ephemeral** — an important constraint that is
easy to overlook. Read [The stateless invariant](./stateless) **before**
migrating an existing SSR application that uses SQLite, file-based sessions or
a local cache.
