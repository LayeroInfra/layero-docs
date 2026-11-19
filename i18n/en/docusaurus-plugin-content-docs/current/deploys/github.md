---
sidebar_position: 2
title: GitHub
description: How to connect a GitHub repository through the GitHub App, what happens after a push to the main branch and to other branches, and how to publish by hand.
---

# GitHub

**Connect a GitHub repository, and every push builds the site.** Layero gets
access to repositories through the GitHub App: the connection doesn't depend
on who made it and survives changes in the team.

Other providers and how they differ — on
[Connecting a repository](./git-providers.md).

## Connecting

1. In the [dashboard](https://app.layero.ru), pick the organization and open
   its settings → «Git» → «Подключить репозиторий» (Connect a repository) →
   «GitHub».
2. In the «Подключить GitHub» (Connect GitHub) window, choose a GitHub
   account or organization.
3. On GitHub, allow access to all repositories or to selected ones and
   confirm the installation.
4. Back in the dashboard, click «Новый проект» (New project) → «Импорт из
   репозитория» (Import from a repository) and pick the repository and
   branch. The main branch is `main` by default.

Layero subscribes to pushes and starts the first build by itself. More about
the app — [GitHub App](../team/github-app.md).

## A push to the main branch

A successful build of the main branch opens at the project's main address
right away. To publish by hand, turn off «Автоматически публиковать пуши
в…» (Publish pushes to … automatically) in the project settings — see
[Publishing pushes automatically or by hand](./environments.md#publishing-pushes-automatically-or-by-hand).

## A push to another branch

A push to any other branch builds a preview at
`<project>-<branch>.layero.app`. The main address doesn't change. Deleting
the branch on GitHub removes its preview.

To put a branch's build on the main address without merging into `main`,
click the «Сделать основной» (Make main) circle next to it in the deploy list, or run `npx layero@latest promote <sha>`.

## The first build

Until there's a successful build, the project's address shows the «Сайт
скоро появится» (Site coming soon) page. After the first successful build
the address works at once.

You can do without a repository too: publish a folder with
[`layero deploy`](./deploy.md).
