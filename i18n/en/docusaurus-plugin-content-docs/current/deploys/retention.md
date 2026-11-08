---
sidebar_position: 10
title: Rollback points and source retention
description: How many past deploys Layero keeps for rollback, what happens to stale branches, how long files uploaded without a repository are stored, and how to download them.
---

# Rollback points and source retention

Every successful deploy is a ready copy of your site or app. While the copy
is in storage you can return to it in seconds, with no rebuild. Copies are
not kept forever: here is how many remain and what to do about it.

## How many deploys you can roll back to

| Environment | Kept |
|---|---|
| Production | the 10 latest successful deploys |
| A branch with a preview URL | the 3 latest successful deploys |
| A branch that is not served and has had no deploys for 30 days | nothing |

Production means the default branch and the environment whose deploy is
currently served at the project's main address. For projects without a
repository this is usually the `cli` environment.

The deploy being served right now and the previous production deploy are
always kept, no matter how many newer ones exist. The "Roll back" button
therefore works even if production has not changed for a year.

You can only roll back to a successful deploy. Files of failed and cancelled
builds are removed: there is no site in them.

The rule is the same for static sites and for apps — Next SSR, Node, Python.

## What happens to stale branches

A branch is "not served" when it has no working preview URL: it was deleted,
its preview slot went to another branch, or its build never finished. If such
a branch has had no deploys for 30 days, its copies are removed.

Bringing it back is simple: push to it. Layero builds it again from the
repository.

A branch with a working preview URL is not affected, however long it stays
unchanged.

## Returning to a deploy that is no longer listed

Outside the window there is no ready copy any more. What remains is
rebuilding the commit you need:

- a project built from a repository — start a deploy from that commit or
  branch;
- a project built from uploaded files — upload that version of the files
  again.

Rebuilding an old commit does not guarantee the same result: dependencies
are installed as they are today. Tag the versions you may need to return to.

## Sources uploaded without a repository

When a project is published by uploading files — from the dashboard, with
`layero deploy` or through an agent — Layero keeps the uploaded archive so
the project can be rebuilt without uploading again.

- The archive of the project's **latest upload** is kept for as long as the
  project exists.
- The archives of the deploy currently served on the site and of the
  previous production deploy are kept while they are there.
- Archives of other uploads are kept for **7 days**.

The "Redeploy" button rebuilds the project from the latest uploaded archive.
When there is nothing to rebuild — no files have been uploaded yet — the
button is disabled and its hint says why. In that case use "Update files" or
run `layero deploy`.

## Download a deploy's sources

While the archive is kept, you can download it as a ZIP file: open the
deploy and click the down-arrow icon next to "Build again". The same item
is in the "⋯" menu of the deploy in the list.

- For a deploy from the terminal the archive holds the sources; for a
  publication from chat or with `--prebuilt` it holds the uploaded ready-made
  files.
- Project members who can deploy can download it. Viewers don't see the
  button.
- `.env`, `.env.local` and other `.env.*` files are left out of the ZIP even
  if they were uploaded. Templates such as `.env.example` stay. The project's
  environment variables and the files Layero adds during the build are never
  stored in the archive.
- When the archive is no longer kept, the button is disabled and its hint
  says why.
- A deploy built from a repository offers a link to the commit at the
  provider instead.

The download link is valid for 5 minutes. Up to 30 downloads per hour per
person.

From the terminal — `npx layero@latest source` (see [CLI commands](../cli/commands.md#layero-source)).
The same file is available through the API:
`GET /projects/{project_id}/deploys/{deploy_id}/source` returns
`{url, filename, expires_in}`; with `?redirect=1` it redirects straight to
the file.

The source archive is not a backup of your code: it is deleted after 7 days.
Keep your sources yourself or in a repository.

For projects built from a repository Layero stores no sources at all: every
build fetches the code from the repository again.

Related: [Rollback](../cli/rollback.md),
[Environments, preview and production](./environments.md).
