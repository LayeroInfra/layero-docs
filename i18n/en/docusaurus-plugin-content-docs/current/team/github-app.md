---
sidebar_position: 3
title: The GitHub App integration
description: Why the GitHub App exists, how to install it on a personal account or an organization, how it differs from OAuth, and how to disconnect it.
---

# The GitHub App integration

Layero can work with GitHub in two ways:

* **OAuth App** (legacy) — a specific user's token. Layero uses it to clone and
  to create per-repository webhooks. It breaks when that person leaves the
  organization or revokes the token.
* **GitHub App** (recommended) — an installation on a GitHub account or a
  GitHub Organization. Layero mints a short-lived installation token on
  demand. It does not depend on any one user and survives changes in the team.

For a team organization the GitHub App is the **required** way to reach
repositories: otherwise every deploy hangs on one person's OAuth token.

## Connecting

1. Go to https://app.layero.ru and pick the organization in the
   OrganizationSwitcher.
2. Open the **Team** page (`/account/team`).
3. In the **GitHub integration** block press **Connect GitHub**.
4. A picker opens:
   * if your OAuth token lacks the `read:org` scope, Layero runs an OAuth
     round trip automatically to obtain the full list of your GitHub
     organizations;
   * after the round trip the picker reopens with all organizations listed.
5. Pick the GitHub Organization from the list — Layero sends you straight to
   the GitHub install page for that organization (no "personal account"
   dead end).
6. On GitHub: choose **All repositories** or a specific list → Install.
7. GitHub redirects back to `/account/team?github_app=connected`.

After a successful install the **GitHub integration** block shows:

```
Connected: layero-platform (GitHub Org)        [Disconnect]
```

## A personal Layero org → personal GitHub

A personal Layero account can use the GitHub App too, if you want the App-style
flow (without an OAuth token) for your own repositories. The picker offers your
GitHub user instead of an organization. That is a valid scenario — the App
installs on your GitHub user.

## Disconnecting

`/account/team` → **Disconnect** in the GitHub integration block. That removes
the Layero ↔ installation link on our side. The App itself stays installed on
GitHub — to remove it completely go to
`https://github.com/settings/installations` (or
`https://github.com/organizations/<org>/settings/installations`) and uninstall.

After disconnecting, existing projects under that Layero organization lose the
App token. The next deploy fails with "no installation token" — you need either
to reconnect the App or to migrate the project to CLI-only.

## What the App gives you

* **Repository listing scoped to the installation:** dashboard "New Project" →
  Import Git Repository shows only the repositories the App has access to,
  rather than everything the owner has.
* **Push events** through one webhook `/webhook/github-app` — no per-repository
  webhooks needed.
* **An installation token** that lives for an hour and is minted on demand.
  There is no need to store any user's access token.
* **Builder context** automatically prefers the installation token when cloning
  a repository.

## Troubleshooting

### "The list of your GitHub organizations is incomplete"

The OAuth token lacks the `read:org` scope. Press **Connect GitHub** — Layero
sends you through authorization again and GitHub asks you to confirm the new
scope.

### "GitHub App can't see X on this installation"

The App is installed but the repository is not in its scope. Go to
`https://github.com/organizations/<org>/settings/installations/<id>` →
"Repository access" → select the repository you need.

### "I don't see my organization in the picker"

After the `read:org` round trip every organization you are a member of should
appear. If it still does not, enter the organization name by hand through
**"Can't see the organization you need? Enter it manually"** — Layero resolves
it through the App JWT.
