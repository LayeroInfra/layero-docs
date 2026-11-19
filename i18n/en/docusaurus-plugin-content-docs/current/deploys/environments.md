---
sidebar_position: 4
title: Environments and previews
description: The project's main address and branch previews, how a build becomes the main one, how many previews run at once, rollback and the «Сайт скоро появится» page.
---

# Environments and previews

**A project has one main address and a preview for each branch.** A push to
the main branch updates the main address; a push to any other branch gives a
preview at its own address and leaves the main address alone.

## An environment is a branch

A push to a branch creates an environment with its own build history and its
own address. A project without a repository has one environment, `cli`:
every folder upload goes there.

A folder upload to a project with a repository also lands in the `cli`
environment and doesn't touch the main address until you publish it with
`--prod`. You can't pick a branch for a folder upload: the CLI refuses the
`--branch` flag.

## Addresses

| | Main address | Branch preview |
|---|---|---|
| Project created after 26 July 2026 | `<project>.layero.app` | `<project>-<branch>.layero.app` |
| Project created earlier | `<organization>-<project>.layero.app` | `<organization>-<project>-<branch>.layero.app` |

The address works right after the first successful build. Project names are
unique across the whole platform, so the address may differ from the folder
name.

:::tip[Don't build the address from a template]
The exact address is shown on the project card in the dashboard and in the
`layero deploy` output (the `url` field in JSON mode). Take it from there.
:::

When a [custom domain](../addresses/custom-domains.md) is connected, it
shows the same as the main address. If you click «Сделать основным» (Make primary) on the domain, the `layero.app` address redirects to it.

## Which build the main address serves

The main address and your domains serve one build. Three things change it:

- **A push to the main branch.** A successful build becomes the main one by
  itself.
- **Picking a build by hand.** Any ready build of any branch can be made the
  main one: it opens at once, with no rebuild.
- **Rollback.** The «Откатить» (Roll back) button brings back the previous
  main build.

### Publishing pushes automatically or by hand

By default a push to the main branch is published at once. To publish by hand: project → «Настройки» (Settings) → «Сборка и
деплой» (Build and deploy) → the «Production-публикация» (Production
publishing) block → turn off «Автоматически публиковать пуши в…» (Publish
pushes to … automatically) and click «Сохранить» (Save).

After that a push to the main branch builds as usual, but the main address
doesn't change until you publish the build yourself.

### Picking a build by hand

**In the dashboard:** in the deploy list, the «Сделать этот деплой
production» (Make this deploy production) button next to the build; on a
deploy's page, «Сделать активным» (Make active).

**In the CLI:**

```bash
npx layero@latest deploys list              # find the build
npx layero@latest promote a3f9c2b           # make it the main one
```

Without an argument, `promote` takes the latest ready build of the `cli`
environment, not of the main branch. Details —
[`layero promote`](../cli/promote.md).

### Rollback

The «Откатить» (Roll back) button in the dashboard or
[`layero rollback`](../cli/rollback.md) gives the main address its previous
build back. No new build is needed: the previous one opens almost at once.
Any other build that is still kept can be made the main one by hand, see [Build retention](./retention.md).

## Branch previews

A branch preview is the address that serves the branch's latest successful
build. Previews don't expire: one works as long as the branch exists and until other previews push it out (see below). If you delete a branch on GitHub or GitLab, its preview is removed by itself.

Previews are open to anyone with the link. Search engines don't index them:
the platform always sends `X-Robots-Tag: noindex, nofollow` on previews. The
main address gets the same header until
[indexing](../billing/plans.md#search-engine-indexing) is turned on for the
project.

### How many previews run at once

A project serves at most five previews at once. The main address doesn't
count towards that and always works.

This doesn't limit builds: a sixth branch builds as usual, with logs and history.

When there are more than five previews, the one that went longest without a
deploy is paused. The branch's age doesn't matter. When a preview is paused:

- answers with a «Превью приостановлено» (Preview paused) page;
- keeps its branch, builds and history;
- moves to the «Без активного деплоя» (No active deploy) section in the
  dashboard.

To bring a preview back, push to that branch. Its place goes to the preview that has gone longest without a deploy.

`layero deploy` tells you when a new build pushed out another branch's preview:

```
! Превью feature/old-checkout приостановлено — этот деплой занял его место
  Вернуть: задеплойте ту ветку снова или откройте панель
```

(«Preview feature/old-checkout paused — this deploy took its place. To bring
it back, deploy that branch again or open the dashboard».) In JSON mode this
is the `preview_evicted` event. It arrives before `ready`, so that an agent
learns about the paused preview before it considers the job done.

## Before the first build

Until the project has had a successful build, the main address shows a
«Сайт скоро появится» (Site coming soon) page instead of a 404 error. A
branch preview shows the same while the branch builds for the first time.
