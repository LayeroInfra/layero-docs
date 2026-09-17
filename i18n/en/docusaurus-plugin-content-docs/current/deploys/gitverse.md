---
sidebar_position: 1.6
title: Deploying from GitVerse
description: Step by step — issue a token in GitVerse, connect it to your Layero organisation, import a repository and get builds on push.
---

# Deploying from GitVerse

GitVerse connects with a personal access token — it has no GitHub App
equivalent. Three steps: issue a token, connect it to the organisation, import
a repository.

## 1. Issue a token in GitVerse

Open [gitverse.ru/settings/tokens](https://gitverse.ru/settings/tokens)
(**Settings → Token management**).

1. Enter a token name, for example `layero`.
2. Tick the permissions in the table — sections in rows, "Read" and "Write"
   in columns:

   | Section | Permission | Why |
   |---|---|---|
   | Repositories | Read and Write | reading the code and creating the webhook for builds on push |
   | Users | Read | to tell whose token it is |

3. Press **"Generate token"** and copy the value — it is shown once. The token
   looks like 40 characters, letters and digits.

## 2. Connect the token to your Layero organisation

1. In the dashboard [app.layero.ru](https://app.layero.ru) open **Settings →
   Linked accounts**.
2. Press **"Connect repository"**, pick **GitVerse**, paste the token.
3. Layero verifies the token with a request to GitVerse and shows the login of
   its owner.

The connection belongs to the organisation: all its members see the
repositories. But builds rest on this token — if the owner revokes it or leaves
GitVerse, they stop. For a team, issue the token from a service account.

## 3. Import a repository

1. **"Create project" → "Import from repository"**.
2. Pick the GitVerse connection and the repository; if the site is not in the
   root, pick the subfolder.
3. Check the detected framework and build commands, press **Deploy**.

Layero creates a webhook in the repository and starts the first build. From
then on every `git push` builds the site: the production branch goes to
production, the others to a preview at `<project>-<branch>.layero.app`.

## What differs from GitHub

- **A full clone on every build.** GitVerse has no archive by commit, so the
  builder clones the whole repository; on large repositories the build starts a
  few seconds later.
- **The webhook signature is undocumented.** The webhook address contains a
  secret token known only to Layero and GitVerse; that is enough to stop an
  outsider from triggering a build. If GitVerse does send an HMAC‑SHA256
  signature header (GitHub or Gitea form), Layero verifies it; a delivery
  without a signature is accepted by the token in the address.
- **The token expires.** When it does, builds on push stop and the connection
  list shows "token invalid". Issue a new one and update the connection — the
  projects do not need to be re-linked.

## If the webhook was not created

If the token lacks "Write" on repositories, Layero cannot create the webhook
and says so during import. Issue a token with the right permissions and retry
— or create the webhook in GitVerse by hand at the address the dashboard
shows.

An overview of all providers and their differences:
[Connecting a repository](./git-providers.md).
