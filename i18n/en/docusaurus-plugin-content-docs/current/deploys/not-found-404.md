---
sidebar_position: 6
title: The 404 page and the SPA fallback
description: How a static site on Layero answers URLs that do not exist. Your own 404.html with a real 404 status (Next export, Astro, Hugo), or an index.html SPA fallback for apps with client-side routing. Controlled through the _redirects file.
---

# The 404 page and the SPA fallback

When a visitor opens a URL that is not in your build, Layero has to answer with
something. There are two correct behaviours — and they are opposites:

- A **multi-page static site** (Next.js `output: 'export'`, Astro, Hugo,
  Eleventy, Jekyll and so on) usually puts a **`404.html`** file in the build and
  expects an unknown address to return exactly that, with HTTP status **404**.
  That is how search engines — Yandex, Google — learn the page is gone.
- A **SPA with client-side routing** (React, Vue, Angular, Solid without
  prerendering) wants the opposite: **any** address should return `index.html`
  with status **200**, so the app loads and its own router shows the right screen
  (or its own not-found state).

## How Layero finds the file for a URL

Before it gets to the 404 page or the SPA fallback, Layero tries to find a file
in the build for the address, in this order — taking `/docs/hello` as the
example:

1. the file at exactly that address — `/docs/hello`;
2. the directory page — `/docs/hello/index.html`;
3. the page with an extension — `/docs/hello.html`;
4. nothing found — the 404 page or the SPA fallback, as described below.

Step 3 is for generators with clean URLs: VitePress with `cleanUrls: true`,
Astro with `build.format: 'file'`, Eleventy when pages are built as
`name.html`. A link to `/docs/hello` opens `docs/hello.html`, not the home page or the 404
page.
Nothing to configure, and it works for deploys that are already live — no
rebuild needed.

Step 3 is skipped when the address ends in `/` or its last segment contains a
dot (`/app.js`, `/logo.png`). If the build has both `hello/index.html` and
`hello.html`, `hello/index.html` wins: step 2 comes before step 3.

## The default behaviour

Layero picks automatically, based on what is in the build:

| Is there a `404.html` at the build root? | An unknown URL returns |
|---|---|
| **Yes** | `404.html` with status **404** |
| **No** | `index.html` with status **200** (the SPA fallback) |

Most projects need to do nothing: Next export, Astro, Hugo and similar
generators write `404.html` themselves, and it starts being served with the right
status. Vite and CRA apps do not create `404.html`, so they keep working as SPAs.

:::note
The `404.html` file itself is always reachable at its direct address
(`/404.html`) with status 200 — only **unknown** URLs get the 404.
:::

## Overriding through `_redirects`

If the automatic choice does not suit you, put a **`_redirects`** file (Netlify
syntax) at the build root with a catch-all rule:

```
# Force the SPA fallback even when 404.html is present:
/*   /index.html   200

# Or the other way round — explicitly turn on your own 404 page:
/*   /404.html     404
```

- `/* /index.html 200` — **always** serve `index.html` with status 200. This is
  for apps with client-side routing that generate a `404.html` anyway.
- `/* /404.html 404` — serve the given page with status 404. The path can be
  anything (`/not-found.html` and so on); the file has to exist in the build.

The rule must come **last** in `_redirects` — ordinary redirects (`301`/`302`)
in the same file keep working as before.

## Checking it

```bash
curl -I https://<your-project-address>/a-page-that-does-not-exist
# HTTP/2 404      ← expected for a static site with a 404.html
# HTTP/2 200      ← expected for a SPA
```

The change takes effect with the **next deploy** — Layero determines the 404
page at build time.
