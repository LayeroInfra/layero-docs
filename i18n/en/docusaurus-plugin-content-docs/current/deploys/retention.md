---
sidebar_position: 5
title: Build retention
description: How many ready builds Layero keeps for rollback, what happens to old branches, how to go back to an old version and how to download the sources of an upload.
---

# Build retention

**Every successful build is a ready copy of the site or app, and you can go
back to it in seconds, without rebuilding.** Copies aren't kept forever:
below is how many remain and what to do if the one you need is gone.

## How many builds are kept

| Environment | Kept |
|---|---|
| the main branch | the last 10 successful builds |
| a branch with a live preview | the last 3 successful builds |
| a branch with no preview that hasn't been deployed for 30 days | none |

For a project without a repository, the main environment is `cli`.

The build that's live now and the previous main build are always kept, no
matter how many new ones came after them. That's why the «Откатить» (Roll
back) button works even if the site hasn't been updated for a year.

You can only roll back to a successful build: files of failed and cancelled
builds are deleted. The rule is the same for static sites and
[apps with a server](../runtime/overview.md).

## Old branches

A branch has no live preview if it was deleted, its preview was pushed out
by others or its build didn't finish. If such a branch hasn't been deployed
for 30 days, its builds are deleted. To get a build again, push to the branch — Layero builds it again.

Branches with a live preview aren't affected, however long they sit
unchanged.

## If the build you need is gone

Build that version again:

- project from a repository — start a build of the commit or branch you
  need;
- project without a repository — upload that version of the files again.

Rebuilding an old commit doesn't always give the same result: without a lock file dependencies are installed as of today, and the build environment is always the current one. Tag versions you may need to return to in the
repository.

## Sources of uploads without a repository

When a project is published by uploading files — from the dashboard, with
`layero deploy` or through an agent — Layero keeps the uploaded archive so
the project can be rebuilt without uploading again:

- the archive of the **latest upload** is kept as long as the project
  exists;
- the archives of the build that's live now and of the previous main build
  are kept while you can roll back to them;
- archives of other uploads are kept for at least 7 days and then deleted.

The «Redeploy» button on the project overview rebuilds the project from the
latest uploaded archive. If no files have been uploaded yet, the button is
inactive and its hint says why. Then click «Обновить файлы» (Update files)
or run `layero deploy`.

Projects from a repository keep no sources at all: every build fetches the
code from the repository again.

## Downloading a build's sources

While the archive is kept, you can download it as a ZIP: open the build and
click the down-arrow icon next to «Собрать заново» (Build again). The same
item is in the «⋯» menu of the build in the list.

- An upload from the terminal contains the sources; a publish through an
  agent or with `--prebuilt` contains the ready files.
- The owner and developers of the organization can download; guests don't
  see the button.
- `.env`, `.env.local` and other `.env.*` files don't go into the archive, even if they were uploaded — except templates like `.env.example`. The
  project's environment variables aren't in the archive.
- If the archive is already deleted, the button is inactive and its hint
  says why.
- A build from a repository has a link to the commit instead.

The download link is valid for 5 minutes, up to 30 downloads an hour.

From the terminal — `npx layero@latest source`, details in
[CLI commands](../cli/commands.md#layero-source). Through the API:
`GET /projects/{project_id}/deploys/{deploy_id}/source` returns
`{url, filename, expires_in}`, and with `?redirect=1` it redirects straight
to the file.

An upload archive isn't a backup of your code. Keep your sources yourself
or in a repository.
