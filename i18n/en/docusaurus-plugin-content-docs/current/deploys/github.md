---
sidebar_position: 1
title: Deploying from GitHub
description: Connect a repository and every git push publishes a new version automatically.
---

# Deploying from GitHub

Connect a repository and every `git push` publishes a new version.

:::note
GitHub is one of five providers. GitVerse, GitLab, GitFlic and SourceCraft
connect with a token; the differences and the capability table are on
[Connecting a repository](./git-providers.md).
:::

## Connecting

1. Sign in to [app.layero.ru](https://app.layero.ru) with **GitHub**. During
   the OAuth consent step Layero asks for repository access — you choose which
   repositories.
2. Press **"Create project"** → **"Import from GitHub"**.
3. Pick the repository and the branch. `main` becomes the production branch by
   default.
4. Press **Deploy**. Layero clones the code, runs the build and publishes the
   artifacts.

## What happens on a push

```
git push  →  GitHub webhook  →  POST /webhook/{project_id}
              │
              ▼
        Layero creates a deploy at the current commit SHA
              │
              ▼
        The builder clones, installs dependencies, builds,
        uploads artifacts to S3 and switches the environment.
```

The webhook is registered automatically when the project is created. Each
project uses its own `webhook_secret`, and the HMAC-SHA256 signature is
verified from the `X-Hub-Signature-256` header.

## A push to the default branch — auto-promote to production

By default a successful build of the default branch becomes production
automatically: `production_deploy_id` switches to the new deploy and the
project's production address starts serving the fresh artifact.

For teams this toggle is better off (Settings → "Auto-promote default branch"
→ off): every release then becomes an explicit "Promote" click in the UI or
[`layero promote`](../cli/promote) from the CLI. It protects against
accidental production releases right after a merge into main.

## A push to any other branch — preview, not production

A push to any other branch creates a **preview environment** with its own URL
— `<project>-<branch>.layero.app`, or
`<project-label>-<branch>.layero.app` under the older scheme. The apex is
**not touched**: production keeps serving exactly the deploy the pointer
refers to.

To ship a feature branch to production without committing to main, press
"Promote" on its latest deploy (or run `layero promote <sha>`).

More on the domain model in
[Environments, previews and production](./environments).

## Multi-provider: what if I signed in with Yandex ID?

Layero's OAuth supports GitHub and Yandex ID. Importing repositories only
works for GitHub accounts. If you signed in with Yandex, add a GitHub identity
(UI: "Settings" → "Connected accounts") and the option to create a GitHub
source will appear in the project.

The alternative is deploying from the CLI: [`layero deploy`](../cli/deploy).

## The first deploy and the hostname promise

After the first `ready` deploy on the default branch, both the **branch
preview URL** and the **project production address** work immediately — both
are covered by the wildcard certificate of their zone and need no host
registration. The 5–15 minute wait that existed back when a CDN sat in front
of sites is gone (see
[Environments, previews and production](./environments)).

While there is no successful deploy at all, the address shows a
**"Site coming soon"** page, so a shared link does not return a 404.
