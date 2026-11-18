---
sidebar_position: 4
title: Deploying from GitHub Actions
description: The official GitHub Action for deploying to Layero — CI tokens, building the artifact in your pipeline, pull-request previews, step outputs and the errors you are likely to hit.
---

# Deploying from GitHub Actions

The official Action is [`LayeroInfra/deploy-action`](https://github.com/LayeroInfra/deploy-action).

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: LayeroInfra/deploy-action@v1
        with:
          token: ${{ secrets.LAYERO_TOKEN }}
          prod: true
```

## First — do you need the Action at all

If the repository is simply [linked to a project](../deploys/github), a push
already triggers a build through the webhook and the Action is not needed: you
would be adding a second copy of the same work.

You want the Action when **the build has to run in your pipeline**:

- the build needs secrets the platform does not have;
- it uses private npm packages from your own registry;
- tests, linters or codegen must pass before publishing;
- you build a monorepo and publish only one package out of it.

Then you build it yourself and ship the **finished artifact**:

```yaml
      - run: npm ci && npm run build
        env:
          API_KEY: ${{ secrets.API_KEY }}
      - uses: LayeroInfra/deploy-action@v1
        with:
          token: ${{ secrets.LAYERO_TOKEN }}
          prebuilt: dist
          prod: true
```

## The token

An ordinary login session lasts a week — no good for CI, where builds would
start failing with a 401 exactly seven days later. Pipelines get a separate
**long-lived token** instead.

1. Open [app.layero.ru/settings/cli](https://app.layero.ru/settings/cli),
   section "CI tokens".
2. Give it a name (for example `GitHub Actions`) and press create.
3. **Copy the value immediately** — it is shown once. Only a hash is stored;
   the token cannot be recovered.
4. In the repository: Settings → Secrets and variables → Actions → New
   repository secret, named `LAYERO_TOKEN`.

You can revoke the token on the same page — builds using it start getting 401
right away.

:::warning[The token carries account-level rights]
It can do everything an ordinary login can. Create a separate token per
repository: then a compromise of one is contained without breaking the rest.
:::

The CLI reads the token from the `LAYERO_TOKEN` variable **before** the local
`~/.layero/config.json`. That is deliberate: otherwise, on a developer machine
with an active login, the variable would silently lose and the deploy would go
to the wrong account.

## Parameters

| Parameter | Required | Default | What it does |
|---|---|---|---|
| `token` | yes | — | Layero CI token |
| `project` | no | from `.layero/project.json` | Target project (id or slug) |
| `name` | no | — | Project name, used when the project is created on the first deploy |
| `prod` | no | `false` | Publish to production. Only needed for a project with a connected repository: for a project without one, every run publishes to the main address anyway |
| `branch` | no | — | Do not use: the current CLI rejects it and the step fails. Branch previews come from a connected repository, not from the Action |
| `prebuilt` | no | — | Directory with a finished build |
| `type` | no | auto-detect | Framework: `vite`, `next`, `astro`, `static`… |
| `root` | no | — | Monorepo: subdirectory to treat as the app root |
| `working-directory` | no | `.` | Where to run the deploy from |
| `version` | no | `latest` | Version of the `layero` npm package |

:::danger[`name` creates a new project on every run]
If the workflow is meant to keep updating the same project, pass **`project`**
— it takes an id or a slug and targets one specific existing project.

`name` only sets the name **at the moment the project is created on the first
deploy**. And every run is a "first deploy" whenever the repository has no
`.layero/project.json` — which it usually does not. On a name collision the
slug gets a suffix, so nothing fails loudly: the build is green, the address is
simply new each time.

We walked into this in our own examples repository: 11 projects for 4 examples
in a single day.
:::

## Step outputs

```yaml
      - uses: LayeroInfra/deploy-action@v1
        id: deploy
        with:
          token: ${{ secrets.LAYERO_TOKEN }}
      - run: 'echo "Published — ${{ steps.deploy.outputs.url }}"'
```

| Output | What it holds |
|---|---|
| `url` | The address the deploy is served at |
| `deploy-id` | Id of the deploy |

The address also lands in the job summary, so it is visible on the run page
without reading the logs.

## Previews for pull requests

The Action does not create previews: everything it uploads lands in a single
environment of the project. To give every branch and pull request its own
address, [connect the repository](../deploys/git-providers.md) — previews are
then built on every push.

:::warning[A project without a repository]
For a project without a connected repository, every Action run publishes to
the main address — even without `prod`. Do not run such a workflow on pull
requests: every PR would replace the live site.
:::

## Several examples in one workflow

A matrix publishes several applications from one repository. That is how the
[examples repository](https://github.com/LayeroInfra/examples) works — four
live sites are built and rolled out on every push.

```yaml
    strategy:
      fail-fast: false
      matrix:
        include:
          - dir: vite-react
            output: dist
          - dir: astro
            output: dist
```

:::tip[fail-fast: false is not paranoia]
Without it, one broken example cancels the rollout of all the others,
including the ones already built. A single broken dependency takes down every
live demo.
:::

## Errors you are likely to hit

### `prebuilt_no_index`

```
'.next' has no index.html — nothing to serve
```

`prebuilt` is meant for **static output** — a directory with a ready
`index.html` in it. A Next.js build in server mode is not such a directory.

For SSR applications do not pass `prebuilt` at all: ship the sources and Layero
will bring the app up as a [runtime](../runtime/). A static Next.js export
(`output: 'export'`) goes the other way — ship it with `prebuilt: out`.

### `auth_required` immediately at start

The token is missing or empty. Check that the secret is named exactly
`LAYERO_TOKEN` and is passed into the step.

The CLI used to try opening a browser login here and hung for 15 minutes until
the code expired. Since version 0.8.4 it fails immediately in CI — silent
waiting on a runner was worse than an honest error.

### `address_required` / `impersonation`

The project name looks like somebody else's brand or like a platform service
address. Pick a different one — prefixed with your organization, for example.

### `project_not_found`

`project` points at a project that does not exist. Either drop the parameter
(the project will be created on the first deploy) or list what you have:
`npx layero@latest projects list`.

## Other CI systems

The Action is a wrapper around an ordinary CLI call, so any other system needs
nothing but the environment variable:

```bash
LAYERO_TOKEN=... npx layero@latest deploy --prod --yes
```

`--yes` skips confirmations. In CI the CLI asks nothing anyway, but with
`--yes` the command behaves the same in CI and in a terminal.
