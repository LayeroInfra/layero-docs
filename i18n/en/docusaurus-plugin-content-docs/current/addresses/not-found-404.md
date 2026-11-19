---
slug: /deploys/not-found-404
sidebar_position: 3
title: The 404 page and redirects
description: What Layero answers for an address that isn't in the build, how clean URLs and SPAs work, how to set your own 404 page and redirects in a _redirects file.
---

# The 404 page and redirects

**If the build has a `404.html`, an unknown address gets that page with code
404. If not — `index.html` with code 200, as single-page apps need.** Usually
there's nothing to set up, and for special cases there's the `_redirects`
file.

## How Layero finds a file for an address

For the address `/docs/hello`, Layero checks in turn:

1. a file at exactly that address: `/docs/hello`;
2. the folder's page: `/docs/hello/index.html`;
3. a page with the extension: `/docs/hello.html`;
4. if nothing is found — serves the 404 page or `index.html`, see below.

Step 3 is for generators with clean URLs: VitePress with `cleanUrls: true`,
Astro with `build.format: 'file'`, Eleventy when pages are built as
`name.html`. The link `/docs/hello` opens `docs/hello.html`.

Step 3 is skipped if the address ends with `/` or its last part has a dot
(`/app.js`, `/logo.png`). If the build has both `hello/index.html` and
`hello.html`, `hello/index.html` opens.

## What an unknown address gets

| Is there a `404.html` at the build root? | An unknown address gets |
|---|---|
| yes | `404.html` with code **404** |
| no | `index.html` with code **200** |

This suits both kinds of sites:

- **A multi-page site** (Next.js static export, Astro, Hugo, Eleventy) puts
  a `404.html` into the build, and an unknown address gets a real 404 code.
  That's how search engines learn the page doesn't exist.
- **A single-page app** (React, Vue, Angular without prerendering) doesn't
  create a `404.html`. Any address serves `index.html`, the app loads, and
  its router shows the right screen.

The `404.html` itself, at the direct address `/404.html`, opens with code
200.

## The `_redirects` file

Put a `_redirects` file at the root of the build output folder. The syntax is
Netlify's: one line per rule, with "from", "to" and the code.

```text title="_redirects"
# Redirect one address, 301 by default
/old-page   /new-page

# A temporary redirect
/sale       /promo      302

# A whole section: the rest of the address replaces :splat
/blog/*     /posts/:splat   301
```

- The code is `301` (default) or `302`. A rule for all addresses can also use `200` and `404`, see below.
- `*` is allowed only at the end of a path; the rest of the address replaces
  `:splat`.
- Rules are checked top to bottom, and the first match wins. In `_headers` it's the other way round: the last matching block wins.
- Lines with `#` and blank lines are skipped.

Not supported: placeholders like `/blog/:slug`, `*` in the middle of a path
and other response codes. Such lines are skipped with a warning in the log;
the build doesn't fail.

### Your own 404 page or SPA behaviour

If choosing by the presence of `404.html` doesn't suit you, set it with the
last line of `_redirects`:

```text title="_redirects"
# Always serve index.html with code 200, even if there's a 404.html
/*   /index.html   200
```

```text title="_redirects"
# Serve your own page with code 404
/*   /not-found.html   404
```

Put the rule for all addresses **last**: otherwise it catches the redirects
below it.

The file doesn't do the `www.site.ru → site.ru` redirect; that's set up when
connecting the domain — see [Custom domain](./custom-domains.md).

## Checking

```bash
curl -I https://<project-address>/a-page-that-does-not-exist
# HTTP/2 404   — a site with 404.html
# HTTP/2 200   — a single-page app
```

Changes take effect from the next build: Layero picks up the 404 page and
the rules at build time.
