---
sidebar_position: 1
title: Your first site
description: Publish a site from a folder with one command — no repository. Sign in with an emailed code or Yandex ID, the build runs on Layero, the address works as soon as the build ends.
---

# Your first site

**One command in the project folder, and the site is live at its own
address.** No repository needed: Layero uploads the folder and builds it on
its side. All you need is Node.js 20 or newer.

Is an AI agent publishing the site? It needs the same commands plus the skill
and MCP — see [AI agents](../agents/index.md).

## 1. See how the project will be built

```bash
cd my-site
npx layero@latest deploy --dry-run
```

The command uploads nothing and does not ask you to sign in. It shows which
framework it found, what command will build the project and whether
publishing will replace the live site. If the app sits in a subfolder, the
command says so and suggests a flag:

```
! Не удалось уверенно определить приложение в этой папке
  This folder has no app of its own; the app is apps/web (vite). Deploy that folder.
  → npx layero@latest deploy --root apps/web
```

Detected something wrong? Fix one value in [`layero.json`](../deploys/layero-json.md)
and run the check again.

## 2. Publish

```bash
npx layero@latest deploy
```

If you have not signed in yet, the CLI shows a link and a code and opens the
browser. Sign in with a code from an email or with Yandex ID and confirm. You
can open the link on another device — sign-in works over SSH and from a
container. If the account has no username yet, the CLI asks for one: Latin
letters, digits and hyphens.

Then the CLI packs the folder — leaving out files from `.gitignore` and
`.layeroignore` — uploads it, and the platform builds the site. The build log
streams to the terminal.

The first publish creates a project and records it in `.layero/project.json`.
Later publishes from this folder go to the same project.

## 3. Open the site

At the end the CLI prints an address like `https://my-site.layero.app`, and the
site already opens there. Take the address from the CLI output or the
dashboard: if the name is taken, the address differs from the folder name.

## 4. Update the site

Changed the code? Run the same command:

```bash
npx layero@latest deploy
```

The new build replaces the site at the main address right away.

:::warning[Every publish from a folder is visible to visitors at once]

A project without a repository has no previews: every `layero deploy`
replaces the live site. To look at changes at a separate address first,
connect a repository — then every branch gets its own preview. If a new version turns out
bad, bring back the previous one with `npx layero@latest rollback` or the «Откатить»
(Roll back) button in the dashboard.

:::

## Without a terminal

In the dashboard click **«Новый проект» → «Загрузить из папки»** (New project →
Upload a folder) and drop the site folder. The platform builds it the same way
as `layero deploy`.

## Where to go next

- [Connecting a repository](../deploys/git-providers.md) — a preview for every
  branch and a build on every push.
- [Environment variables](../deploys/env-vars.md) — keys and API addresses for
  the build.
- [Custom domains](../deploys/custom-domains.md) — on the Pro plan.
- [CLI commands](../cli/commands.md) — everything `layero` can do.
