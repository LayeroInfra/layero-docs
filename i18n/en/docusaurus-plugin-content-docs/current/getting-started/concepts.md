---
sidebar_position: 2
title: How it all fits together
description: Organization, project, environment, build and main address — what Layero is made of and how the parts connect. Static sites and apps with a server, the "Made with Layero" label.
---

# How it all fits together

**Layero comes down to five concepts: organization, project, environment,
build and main address.** Below is what each one means and how they connect,
and at the end how a static site differs from an app with a server.

## Organization

An organization owns projects, databases and a balance. The Pro subscription
also belongs to an organization, not to a person.

On first sign-in you pick a username, and your personal organization is
created under that name. To work with colleagues there are team
organizations — see [Organizations](../team/organizations.md).

The organization switcher is in the dashboard. Lists of projects,
repositories and builds show only what belongs to the selected organization.

## Project

A project is one site or one app. It gets the address
`https://<project>.layero.app`; the exact address is shown in the dashboard
and in the CLI output.

Code gets into a project in one of these ways:

- from a connected repository — every push starts a build;
- from a folder — with `layero deploy` or an upload in the dashboard;
- as ready-made files from an AI agent — with the MCP tool `publish_site`.

A project with a repository accepts folder uploads too. They land in a
separate `cli` environment and do not touch the main address until you
publish them yourself with `--prod`.

## Environment

An environment is a project address with its own build history. Usually an
environment matches a branch: a push to a new branch creates an environment,
and its address serves that branch's preview.

A project without a repository has one environment, `cli`: every folder
upload goes there. More in [Environments and previews](../deploys/environments.md).

## Build

Every push and every upload starts a build. The platform detects the
framework, installs dependencies, builds the project and stores the result.
Build statuses in the dashboard:

| Status | Meaning |
|---|---|
| «В очереди» (Queued) | waiting for a free builder |
| «Сборка» (Building) | the build is running |
| «Готов» (Ready) | opens at the environment's address |
| «Ошибка» (Failed) | the build failed; the log or `npx layero@latest diagnose` shows why |
| «Отменён» (Cancelled) | the build was stopped |

What builds the project and how — [Frameworks](../build/frameworks.md),
[Node.js and Python versions](../build/runtime-versions.md) and
[`layero.json`](../build/layero-json.md).

## Main address

The main address `<project>.layero.app` and your custom domains serve one and
the same build. Usually it is the latest successful build of the main branch; for a
project without a repository, the latest folder upload.

Any ready build can be made the main one: it opens at once, with no rebuild.
A rollback works the same way — the previous build becomes the main one
again. In the dashboard it is the «Откатить» (Roll back) button; in the CLI,
[`layero rollback`](../cli/rollback.md) and [`layero promote`](../cli/promote.md).

## Static site and app with a server

- **Static site.** After the build there are files: HTML, JavaScript, CSS.
  Layero servers deliver them, and no process runs. This is the fastest
  option: the page is served at once, with no process to start.
- **App with a server.** Next.js with server rendering, Node.js and Python
  servers, Streamlit, Gradio, Flask. It runs as a separate process: it wakes
  up on the first request and goes to sleep when nobody uses it.
  See [Runtime apps](../runtime/overview.md).

## The "Made with Layero" label

A static site shows a thin "Сделано на Layero" (Made with Layero) strip at the
bottom of the page. It does not cover the content and matches the colour of
the bottom of the page. To show it, the platform adds one line before
`</body>` in every HTML file:

```html
<script defer src="/_layero/footer-<hash>.js" data-layero-footer></script>
```

Nothing is written to your repository: the line exists only in the files the
platform serves.

**Where there is no label:**

- in HTML without `</body>` and in files not in UTF-8;
- in ownership verification files for Yandex Webmaster, Google Search Console
  and Bing;
- in `node_modules` and in folders whose name starts with a dot;
- in pages served by an app with a server. The frontend of a fullstack
  project does get the label.

**How to remove it.** On the Pro plan: dashboard → project → «Настройки»
(Settings) → «Layero Label» → «Выкл» (Off). You can pick the strip colour
there too. The change applies from the next build. An agent turns the label
off with the MCP tool `project_settings` and `badge: false`. If the
organization goes back to Free, the label comes back — see [Plans](../billing/plans.md).
