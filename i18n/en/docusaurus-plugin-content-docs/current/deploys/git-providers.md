---
sidebar_position: 1.5
title: "Connecting a repository: GitHub, GitVerse, GitLab, GitFlic, SourceCraft"
description: The five git providers Layero builds from on push. How each one connects, what it supports (webhook, branch previews, archive by commit) and where the limits are.
---

# Connecting a repository

Layero builds a site from a repository on five services: **GitHub**,
**GitVerse**, **GitLab**, **GitFlic** and **SourceCraft**. A connected
repository is [path (a)](../agents/index.md#a-there-is-a-connected-repository)
for an agent and for a person alike: a push to a
branch gives a preview, a push to the production branch gives production. The
model is the same for all; what differs is how the connection is made and what
the provider's API supports.

## How it connects

| Provider | Method | Who owns the connection |
|---|---|---|
| GitHub | [GitHub App](../team/github-app.md) (recommended) or OAuth sign-in | the Layero organisation: the installation token is short-lived and independent of any person |
| GitVerse | personal access token | the Layero organisation, but the token belongs to one member |
| GitLab | personal access token (`glpat-…`); self-hosted instances supported | same |
| GitFlic | personal access token; self-hosted instances supported | same |
| SourceCraft | personal access token (`pv1_…`) | same |

A token connection is made once per organisation: **Settings → Linked
accounts → "Connect repository"**, pick the service and paste the token. After
that the service's repositories appear in the picker when creating a project —
**"Create project" → "Import from repository"**.

The token is stored encrypted and is never returned. It has an expiry: when it
runs out, builds on push stop and the connection list shows "token invalid" —
issue a new one and update the connection. A token connection rests on the
account of whoever issued it: if that person leaves the team and revokes the
token, the organisation's builds stop. GitHub has no such dependency — use the
GitHub App.

For a self-hosted GitLab or GitFlic instance, enter the **API** address, not
the site: `https://gitlab.example.com/api/v4`,
`https://api.gitflic.example.com`. The address must be public and use `https`.

## What each one supports

| | GitHub | GitVerse | GitLab | GitFlic | SourceCraft |
|---|---|---|---|---|---|
| Build on push (webhook) | yes, created automatically | yes, created automatically | yes, created automatically | yes; if the API refuses to create it, add it by hand | **no** |
| Webhook signature | HMAC-SHA256 | undocumented | token in a header | token in a header | — |
| Branch previews | yes | yes | yes | yes | no (no push events) |
| Archive by commit (fast build without a clone) | yes | no, full clone | yes | no, full clone | no, full clone |
| Self-hosted instance | no | no | yes | yes | no |
| Nested groups in the path | no | no | yes (`group/sub/repo`) | no | no |
| API rate limit | standard | standard | standard | **500 per hour per token** | standard |

### SourceCraft: deploy hook only

The SourceCraft API has no webhooks at all, so there are no automatic builds
on push. The standard route is SourceCraft's own CI,
which calls a Layero deploy hook after the push:

```bash
npx layero@latest hooks create publish --prod
# → https://api.layero.ru/hooks/<token>
```

A POST to that address starts a build from the connected repository. The
other route is the "Build" button in the dashboard or `npx layero@latest
deploy`. One more limit: the API returns only the file tree, without content —
the framework is detected from the names of the root files (`package.json`,
`vite.config.ts`, `index.html`).

### GitFlic: rate limit

500 requests per hour per token is the shared budget for everything the
organisation does, builds included. With many projects on one token, listing
repositories and building can hit the limit; issue Layero a dedicated token
that nothing else uses.

## What happens on a push

The same for every provider with a webhook:

```
git push  →  provider webhook  →  POST /webhook/v2/{token}   (GitHub: /webhook/{project_id})
                                          │
                                          ▼
                       Layero creates a deploy at the commit SHA
                                          │
                                          ▼
                The builder fetches the code (archive by commit or clone),
                builds, uploads, switches the environment
```

A push to the production branch (`main` by default) is published to
production; a push to any other branch is a preview at
`<project>-<branch>.layero.app`. Deleting a branch retires its preview.
Details: [Environments, preview and production](./environments.md).

## Step by step

- [GitHub](./github.md) — signing in with GitHub and the GitHub App.
- [GitVerse](./gitverse.md) — issuing a token and connecting.
- GitLab, GitFlic, SourceCraft — the same steps as GitVerse; where the token
  is issued and which permissions to tick is shown by the dashboard in the
  connection dialog.
