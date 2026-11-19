---
slug: /cli/rollback
sidebar_position: 7
title: Rollback and picking a build
description: How to bring back the previous build on the main address or publish any ready build — with dashboard buttons and the layero rollback and layero promote commands.
---

# Rollback and picking a build

**Any ready build that's still kept can be made the main one in seconds, without rebuilding.**
A rollback is a special case: the previous build becomes the main one again.
It works the same for static sites and for apps with a server.

## Rolling back to the previous build

**In the dashboard:** the «Откатить» (Roll back) button on the project page,
then confirm in the «Откатить основной адрес?» (Roll back the main address?) dialog.

**In the CLI:**

```bash
npx layero@latest rollback
```

The command finds the previous ready build of the main branch, shows the plan and, after confirmation, serves it at the main address.

A second rollback in a row changes nothing: the previous build is already at the main address, and the command answers with the `rollback_noop` code. To bring back a newer build, publish it with `promote`.

| Flag | What it does |
|---|---|
| `--deploy <id or sha>` | roll back to a specific build, not the previous one |
| `--branch <branch>` | roll back another branch, not the main one |
| `--project <id or slug>` | the project, if the command isn't run from its folder |
| `-y`, `--yes` | don't ask for confirmation |

```bash
npx layero@latest rollback --deploy a3f9c2b
npx layero@latest rollback --branch staging
```

## Publishing any build

**In the dashboard:** in the deploy list, the «Сделать основной» (Make main) circle next to the build; on a
deploy's page, «Сделать активным» (Make active).

**In the CLI:**

```bash
npx layero@latest deploys list          # find the build
npx layero@latest promote a3f9c2b       # make it the main one
```

`promote` takes a build id or the start of a commit hash. It searches among
the main branch's builds, so give the branch for a build of another branch or
for a folder upload:

```bash
npx layero@latest promote a3f9c2b --branch cli
```

Without an argument `promote` takes the latest ready build of the branch from
`--branch`, and if no branch is given — of the `cli` environment. For a
project with a repository that's a folder upload, not a `main` build. To
publish the latest build of the main branch, name it:

```bash
npx layero@latest promote --branch main
```

Before publishing, the command shows the plan — the project, the main
address, which build it publishes and which one is live now — and asks for
confirmation. The `-y` flag skips it; in CI and for an agent the command
doesn't ask. In JSON mode you get the `promoted` event.

For a project with a repository, `layero deploy --prod` builds a folder upload and publishes it to the main address in one command — see [From a folder with the CLI](./deploy.md).

## Limitations

- **Only a ready build that's still kept can be published.** Failed,
  cancelled and expired builds don't qualify — see
  [Build retention](./retention.md).
- **Custom domains** show the same as the main address and change with it.
- **A push to the main branch** makes the new build the main one again if
  automatic publishing is on. So that the next push doesn't overwrite a rollback, turn it off — see
  [Environments and previews](./environments.md#publishing-pushes-automatically-or-by-hand).
