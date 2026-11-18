---
sidebar_position: 3
title: Environment variables
description: Env vars are encrypted with AES-256-GCM and available at build time and inside the runtime container.
---

# Environment variables

Env vars are set in the panel — the project's **«Переменные окружения»**
(Environment variables) section — with `layero env`, or through the API. They
are available to the build process and end up in `process.env`. Changes are
picked up by the **next build**: the version already published does not see them.

## Where they apply

Env vars are injected into the environment **at build time** (the `env` stage
of the builder pipeline, before `install`). This means frameworks that inline
variables into the bundle (Vite, Next.js with `NEXT_PUBLIC_*`, CRA with
`REACT_APP_*`) will see them and bake them into the artifacts.

For **runtime projects** (SSR Next, Streamlit, Gradio) the variables are
additionally passed into the environment of the running container — available
at runtime through the same `process.env` / `os.environ`.

## Security

Values are encrypted in the database with **AES-256-GCM**, with a unique nonce
per record.

The encryption key (`ENV_ENCRYPTION_KEY`) is **not kept in the database**: the
source of truth is a secret store, from which the key reaches the control
plane's environment at deploy time. What that buys you in practice: a database
dump on its own reveals nothing — without the key it is ciphertext.

The key **never reaches your containers**, neither the build one nor the
runtime one. Only the decrypted values of the variables you added to that
project do.

Once saved, a value is never shown again — not in the panel, the CLI or the
API: you see the name and the length, and for long values the first few
characters.

## What not to store

- **Never commit `.env*`.** `.env`, `.env.local` and the like are in the
  built-in denylist of `layero deploy` and are not uploaded in any case. But if
  they end up in the git repository under the GitHub flow, Layero will clone
  them at the `clone` stage.
- **Production secrets must not go into `NEXT_PUBLIC_*` / `VITE_*` /
  `REACT_APP_*`.** Those prefixes mean "goes into the client bundle". Use them
  only for public values — public API endpoints, analytics tokens and so on.

## CLI and API

From a terminal, use `layero env`. `set` adds or changes only the variables
you name; the rest stay as they were:

```bash
npx layero@latest env list
npx layero@latest env set API_URL=https://api.example.com
npx layero@latest env unset API_URL
```

:::warning[The API replaces the whole set]
`PUT` writes the set you send **as a whole**: any key missing from the request
is deleted. To keep an existing value, send its key with `null`. To change one
variable, `layero env set` is safer.
:::

```bash
curl -X PUT https://api.layero.ru/projects/{id}/env \
  -H "Authorization: Bearer $LAYERO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vars": {"API_URL": "https://api.example.com", "SECRET_KEY": null}}'
```

Here `API_URL` gets the new value, `SECRET_KEY` keeps its old one, and every
other variable of the project is deleted.
