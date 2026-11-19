---
sidebar_position: 1
title: Installing and signing in
description: How to run the Layero CLI with npx layero@latest, sign in through the browser with an emailed code or Yandex ID, where the sign-in is stored and which token CI needs.
---

# Installing and signing in

**The Layero CLI is the npm package [`layero`](https://www.npmjs.com/package/layero).
You don't need to install it: run it with `npx layero@latest`.** It needs
Node.js 20 or newer.

```bash
npx layero@latest deploy
```

Write `@latest`: without a version, `npx` takes a copy that's already
installed and doesn't check for a newer one — you can run an old version for
years. If you did add the package to a project (`npm install -D layero`),
update it yourself: `npm install -D layero@latest`.

## Signing in

```bash
npx layero@latest login
```

1. The CLI prints a link like `https://app.layero.ru/cli?code=5NFW-K2NG` and
   opens it in the browser. The `--no-browser` flag only prints the link.
2. In the browser, sign in with a code from an email or with Yandex ID. No
   account yet — it's created on the first sign-in. The page names the
   account it gives access to; if it's the wrong one, there's a «войти
   другим» (sign in as someone else) link right there.
3. Click «Разрешить доступ» (Allow access). The CLI saves the sign-in to
   `~/.layero/config.json`.

You can open the link on another device: sign-in works over SSH and from a
container. The code is valid for 15 minutes — if you miss it, run `login`
again.

After the first sign-in the CLI may ask for a username: lowercase Latin letters, digits and hyphens, 2 to 32 characters. It's the address of your personal organization. If the CLI runs under an agent or in CI, there's nobody to ask: set the name with `npx layero@latest username <name>`.

Which account you're signed in as:

```bash
npx layero@latest whoami
```

A sign-in lasts 7 days. To sign out, run `npx layero@latest logout`: it
removes the sign-in from this machine. You can see and close active sessions
in the dashboard, in the user card, the «Сессии» (Sessions) block.

## A token for CI and agents

CI has no browser, and a sign-in lasts a week. Issue a long-lived token:

```bash
npx layero@latest token create ci
```

`ci` is the token's name. By default it has read and deploy rights. The token
is shown once — save it in your CI secrets as `LAYERO_TOKEN`. The CLI picks
it up from the variable by itself:

```bash
LAYERO_TOKEN="$LAYERO_TOKEN" npx layero@latest deploy --prod --yes --project my-site
```

Don't print the token: everything in the build log is visible to everyone
with access to the runs. List tokens with `npx layero@latest token list`, revoke with `npx layero@latest token revoke` or on the «Токены CLI и CI» (CLI and CI tokens) page in
the [dashboard](https://app.layero.ru/settings/cli). How rights work —
[From GitHub Actions](../deploys/github-actions.md#the-token).

## CLI files

| File | What's in it |
|---|---|
| `~/.layero/config.json` | the sign-in and the API address. Created by `login` |
| `.layero/project.json` | the folder's link to a project. Created by the first `deploy` or by `init` |

The CLI fills in `.layero/project.json`: after the first publish it holds the
project's id and address, and you don't need to edit them. The CLI doesn't
write build settings there — they live in
[`layero.json`](../build/layero-json.md) or in the project settings.

## `layero init`

An optional command for working with AI agents: it adds a block on how to
publish to Layero to `AGENTS.md`, `CLAUDE.md` or `.cursorrules` and creates
`.layero/project.json`. Details — [The layero skill](../agents/skill.md#layero-init-and-agentsmd).

## What's next

- [All commands](./commands.md)
- [From a folder with the CLI](../deploys/deploy.md) — `layero deploy`, flags and limits
- [AI agents](../agents/index.md) — Claude Code, Cursor, Codex
- [CLI JSON events](../agents/json-events.md) — for agents and CI
