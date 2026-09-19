---
sidebar_position: 2
title: Core concepts
description: Project, environment, deploy, runtime, handle and the build environment — the vocabulary for talking about Layero consistently.
---

# Core concepts

Before going into detail, here is the platform's vocabulary: **project**,
**environment**, **deploy**, **runtime** and **handle**. These five terms
appear throughout the rest of the documentation.

## Organization

An **organization** is the scope that groups people, projects and integrations
under one slug. There are two kinds:

* **Personal** — created automatically on signup, with your `username` as the
  slug. One per user, no invitations.
* **Team** — created by hand ("+ Create team"), accepts email invitations and
  can connect the [GitHub App](../team/github-app).

Details in [Organizations](../team/organizations).

The organization switcher sits in the top corner of the dashboard. Your
choice is remembered in the browser, and every list — projects, repositories
to import, deploys — shows only what belongs to the organization you picked.

## Project

A **project** is the unit of deployment. It belongs to one organization and
gets a canonical address in the user-site zone:
`https://<project>.layero.app`. Projects created before the move (26 July
2026) still carry the organization prefix:
`https://<organization>-<project>.layero.app`. The exact address is visible in
the dashboard; see
[Environments, previews and production](../deploys/environments).

Where the code comes from:

- `github` — from a GitHub repository; a push triggers a deploy automatically
  through a webhook (OAuth or GitHub App).
- `cli` — from a local `layero deploy` (a tarball upload).

One project can accept **both** sources at once (mixed mode): GitHub pushes
and CLI uploads coexist. See [`layero deploy`](../cli/deploy).

## Environment

An **environment** corresponds to a branch of the repository. A push to any
branch creates its own environment with its own deploy history and its own
**preview URL** that lives as long as the branch does.

A project has **one production address** — the apex. Which environment serves
it right now is decided by `production_deploy_id` (below). That is not
necessarily the default branch — it can be any promoted build.

See [Environments, previews and production](../deploys/environments).

## Deploy

A **deploy** is one build from one commit (`commit_sha`). Every deploy has a
status:

| Status | What it means |
|---|---|
| `queued` | queued, waiting for a build instance |
| `building` | the build is running right now |
| `ready` | artifacts uploaded; can be promoted and served |
| `failed` | the build failed, see the deploy logs |

`environments.active_deploy_id` is the branch's latest ready deploy, updated
atomically after the build. It is reachable at the branch preview URL.

`projects.production_deploy_id` points at the **one** deploy the apex is
currently serving. It moves via auto-promote on the default branch, or by hand
through the UI or CLI promote.

**Rollback** swaps `production_deploy_id` and
`previous_production_deploy_id` in a single atomic step. The apex returns to
the previous working build instantly; rolling back again returns it. See
[`layero promote`](../cli/promote) or the "Roll back" button in the UI.

## Runtime: static vs SSR

Layero distinguishes **two execution modes**:

- **SPA / static** (the default) — the build produces a folder of HTML/JS/CSS
  that lives in object storage and is served from the platform's edge servers.
  Nothing runs on Layero's side. This is the fastest and cheapest mode.
- **Runtime** — the application runs as a container (Next.js in server mode,
  Streamlit, Gradio, Flask and so on). The container wakes on the first
  request and stops when idle. See [Runtime](../runtime/overview).

## Username and organization

On first sign-in you choose a **unique username** — the handle of your
account. Your personal organization is created from it, with the same slug.
For projects created before the move to `layero.app` that slug ended up in the
site address (`https://alice-<project>.layero.app`). New addresses consist of
the project slug alone, and the organization slug does not affect them.

Beyond the personal one you can create **additional organizations** with their
own slugs — for working with a team, for example. Each can have several
members (admin / member) invited by email. Members are managed in the
[Team](https://app.layero.ru/account/team) section.

The username is set once, during onboarding. More in
[Onboarding](https://app.layero.ru/onboarding).

## Build environment

- **Node.js** — `nvm use <detected_version>`. The version comes from
  `.nvmrc`, `.node-version` or `engines.node` in `package.json`. Node 20 by
  default.
- **Package manager** — detected from the lockfile: `yarn.lock` → yarn,
  `pnpm-lock.yaml` → pnpm, otherwise npm.
- **`node_modules` is removed** before `install`.
- **Build command** — taken from the project (`build_cmd`), `npm run build` by
  default. The output directory is determined by the framework (see
  [Supported frameworks](./frameworks)).

## The Layero label in HTML

After a static site is built, the platform inserts one line before `</body>`
in every HTML file:

```html
<script defer src="/_layero/footer-<hash>.js" data-layero-footer></script>
```

The script itself goes to the `/_layero/` folder. In the visitor's browser it
draws a thin strip reading «Сделано на Layero» ("Made with Layero") — a
footer below all the page content. It does not cover the content and picks
its colour to match the bottom of the page.

This is not a build error: nothing is written to the repository, the line
exists only in the files the platform serves.

- **Where there is no label.** HTML without `</body>`, files that are not
  UTF-8, site verification files for Yandex Webmaster, Google Search Console
  and Bing, `node_modules` and folders whose names start with a dot. HTML
  served by a container (SSR, a Node or Python server) is not changed. The
  frontend of a fullstack project does get the label.
- **How to configure it.** Dashboard → project → **Settings → Layero Label**:
  automatic colour, your own colour, or off. Turning the label off needs the
  Pro plan ([plans](../billing/plans)). The change takes effect with the
  next deploy.
