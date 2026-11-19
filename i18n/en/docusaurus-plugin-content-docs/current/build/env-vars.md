---
slug: /deploys/env-vars
sidebar_position: 4
title: Environment variables
description: How to set a project's environment variables in the dashboard, with the CLI and the API, when they take effect, which variables the platform sets and what the limits are.
---

# Environment variables

**Environment variables are set in the dashboard, with `layero env` or
through the API, and take effect from the next build.** The version of the
site that's already published doesn't see them.

## Where to set them

**In the dashboard:** project → «Переменные окружения» (Environment
variables). You can also upload a ready `.env` file there.

**From the terminal:**

```bash
npx layero@latest env list
npx layero@latest env set API_URL=https://api.example.com
npx layero@latest env unset API_URL
```

`set` adds and changes only the variables you name; the rest stay as they
were. `unset` asks for confirmation, and the `-y` flag skips it. From
another folder, name the project with `--project`.

## Where they apply

- **During the build.** Variables are available in `process.env`, so
  frameworks that embed them into page code see them: Vite (`VITE_*`),
  Next.js (`NEXT_PUBLIC_*`), Create React App (`REACT_APP_*`).
- **In a running [app with a server](../runtime/overview.md).** The same
  variables are passed to the app: `process.env` in Node.js, `os.environ` in
  Python.

Variables are shared by the whole project: there's no separate set for
previews and for production.

:::warning[Public prefixes end up in the browser]
Variables with the `VITE_`, `NEXT_PUBLIC_`, `REACT_APP_` prefixes are
embedded into code every visitor downloads. Only put there what you don't
mind showing: an API address, a public analytics key. Secrets go without a
prefix and can only be read on the server.
:::

## Security

Values are stored encrypted. Neither the dashboard, nor the CLI, nor the API
shows a saved value: you see the name and the length, and for values of 16
characters or more, the first four characters. To check a value, set it
again.

Don't keep secrets in `.env` files in the repository. When uploading from a
folder, `layero deploy` doesn't send them, but from a connected repository
they get into the build with the rest of the code.

## Variables set by the platform

When a [database](../database/index.md) is connected to the project, the
platform adds variables itself:

| Variable | Where it applies |
|---|---|
| `LAYERO_DATABASE_URL` and `LAYERO_DATABASE_URL_<SLUG>` | in the app with a server |
| `VITE_LAYERO_DATA_URL`, `VITE_LAYERO_DATA_KEY` | during the build |
| `NEXT_PUBLIC_LAYERO_DATA_URL`, `NEXT_PUBLIC_LAYERO_DATA_KEY` | during the build |

The list marks them as platform variables. You can't set your own value for
`LAYERO_DATABASE_URL`: the API answers with a 409 error.

## Limits

| What | How much |
|---|---|
| Variables per project | up to 500 |
| Name length | up to 256 characters |
| One value | up to 64 KB |
| All values together | up to 1 MB |

## Through the API

:::warning[The API replaces the whole set]
`PUT` writes the set you send **as a whole**: a variable missing from the
request is deleted. To keep a value as it is, send the variable with the
value `null`. To change a single variable, `layero env set` is safer.
:::

```bash
curl -X PUT https://api.layero.ru/projects/{id}/env \
  -H "Authorization: Bearer $LAYERO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vars": {"API_URL": "https://api.example.com", "SECRET_KEY": null}}'
```

Here `API_URL` gets the new value, `SECRET_KEY` stays as it was, and all the
project's other variables are deleted.
