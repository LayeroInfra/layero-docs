---
sidebar_position: 1
title: Connecting a repository
description: How to connect a repository on GitHub, GitVerse, GitLab, GitFlic or SourceCraft, how the providers differ and what happens after a push.
---

# Connecting a repository

**Layero builds a site from a repository on GitHub, GitVerse, GitLab, GitFlic
and SourceCraft.** A push to a branch gives a preview, a push to the main
branch updates the site. Providers differ in how they connect and what their API can do: for example, on SourceCraft a build is started by a call, see below.

## How to connect

| Provider | How it connects | What the connection depends on |
|---|---|---|
| GitHub | [GitHub App](../team/github-app.md) | nobody: the app is installed on a GitHub account or organization |
| GitVerse | personal token | the person who issued the token |
| GitLab | personal token (`glpat-…`), including on your own server | the same |
| GitFlic | personal token, including on your own server | the same |
| SourceCraft | personal token (`pv1_…`) | the same |

A provider is connected once per organization: organization settings →
«Git» → «Подключить репозиторий» (Connect a repository). Pick the service and
paste the token, or, for GitHub, allow the app to be installed. After that
the service's repositories appear when you create a project: «Новый проект»
(New project) → «Импорт из репозитория» (Import from a repository).

The token is stored encrypted. It has an expiry: when it runs out, builds on
push stop, and the connection list shows «токен недействителен» (token
invalid) — issue a new one and update the connection. If the person who issued the token revokes it or loses access to the repositories at the provider, the organization's builds
stop too. For a team, issue the token from a service account.

For your own GitLab or GitFlic server, give the **API** address, not the
site's: `https://gitlab.example.com/api/v4`, `https://api.gitflic.example.com`.
The address must be public and work over `https`.

## How the providers differ

| | GitHub | GitVerse | GitLab | GitFlic | SourceCraft |
|---|---|---|---|---|---|
| Build on push | yes | yes | yes | yes; if the webhook wasn't created, add it by hand | no |
| Branch previews | yes | yes | yes | yes | no |
| Own server | no | no | yes | yes | no |
| Nested groups (`group/sub/repo`) | no | no | yes | no | no |

Deleting a branch removes its preview by itself on GitHub and GitLab.

GitFlic has a limit of 500 requests an hour per token. Everything that uses the token shares it, Layero builds included. If you have many projects, issue a
separate token for Layero that nothing else uses.

### SourceCraft: build on call

SourceCraft has no webhooks, so there's no build on push. Start builds from
SourceCraft's own CI by calling the address this command gives you:

```bash
npx layero@latest hooks create publish --prod
# → https://api.layero.ru/hooks/<token>
```

A POST request to that address starts a build from the connected repository. You
can also click «Собрать» (Build) in the dashboard. SourceCraft's API returns
only the list of files without their contents, so the framework is detected
by the file names at the root: `package.json`, `vite.config.ts`,
`index.html`.

## What happens after a push

1. The provider tells Layero about the push.
2. Layero fetches the code of that commit and builds the project.
3. A push to the main branch (usually `main`) updates the site; a push to
   another branch gives a preview at `<project>-<branch>.layero.app`.

Details — [Environments and previews](./environments.md).

## Step by step

- [GitHub](./github.md) — installing the GitHub App.
- [GitVerse](./gitverse.md) — issuing a token and connecting it.
- GitLab, GitFlic, SourceCraft — the same steps as GitVerse. The connection
  window in the dashboard shows where to issue the token and which rights
  to tick.
