---
sidebar_position: 5
title: Custom HTTP headers
description: Add your own HTTP response headers (HSTS, X-Frame-Options, CSP, etc.) to a static site via a _headers file in the build output. Netlify-style syntax with path and wildcard support.
---

# Custom HTTP headers

You can attach your own HTTP response headers to any static site — for
example `Strict-Transport-Security`, `X-Frame-Options`,
`Content-Security-Policy` or `Referrer-Policy`. They are declared in a
**`_headers`** file at the root of your built site (Netlify-style syntax).

There is no "Custom Headers" panel in the dashboard — header management
lives in this file so the config is versioned in git next to your code.

## Why a file, not app code

A static site has no server process of yours: it is a set of files served
by Layero's edge nginx. HTTP response headers are part of the
**server's response**, so they are set by whatever serves the bytes — not
by the HTML file itself. A `<meta http-equiv>` tag does not help here:
browsers ignore it for `Strict-Transport-Security`, `X-Frame-Options` and
`Content-Security-Policy` — those policies only take effect as real HTTP
headers.

The `_headers` file is how you pass that intent down to the serving layer:
the builder reads it and attaches the listed headers to edge responses.

:::note[SSR and runtime apps]
Everything here is about **static** sites. If you run an SSR or runtime app
(Next.js in server mode, Streamlit, Flask), the process runs on the server
and can set headers itself, in code (`res.setHeader(...)`,
`next.config.js → headers()`, etc.). Such projects don't need `_headers`.
:::

## Quick start

Put a file named `_headers` (no extension) in the **root of your build
output folder**, next to `index.html`:

```text title="_headers"
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
```

Deploy — and the headers start being served on every page. Verify with any
`-I` request:

```bash
curl -sI https://<your-project-address>/ | grep -i -E 'strict-transport|x-frame|referrer'
```

## Syntax

The file is a set of blocks. A block starts with a **path line at the left
margin** (no indent, must start with `/`). Indented lines that follow are
`Header-Name: value` pairs belonging to that path. Blank lines and lines
starting with `#` are ignored.

```text title="_headers"
# A comment — ignored

/*
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000

/about/
  X-Robots-Tag: noindex

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### Supported paths

| Pattern | Matches | Example |
|---|---|---|
| `/*` | Every page (catch-all) | the whole site |
| Exact path | Exactly this URL | `/about/`, `/index.html` |
| `/prefix/*` | Everything under a prefix | `/assets/*`, `/docs/*` |

A wildcard **in the middle** of a path (`/foo/*/bar`) is not supported yet —
such a line is silently skipped and a warning is written to the build log.

### How overlaps resolve

File order is preserved, and when several blocks match the same header the
**last one wins**. So a broad `/*` block usually goes first, with narrower
overrides below:

```text title="_headers"
/*
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

Here `/assets/style.css` gets the long cache, everything else gets
`must-revalidate`.

:::warning[`Cache-Control` currently arrives twice]
Verified on a live project on 27 July 2026. If you set `Cache-Control` in
`_headers`, the edge still adds its own, and the response carries **two**
headers:

```
cache-control: public, max-age=31536000, immutable          ← yours
cache-control: public, max-age=0, s-maxage=60, stale-while-revalidate=600
```

By the standard these fields are combined into one list of directives, which
then holds two different `max-age` values. What any particular client or
intermediate cache does with that is undefined.

In practice: **you cannot currently rely on `_headers` to give assets a long
cache lifetime.** Every other header — including the security headers the file
is usually created for — works as documented: they are added, not conflicted.
Verified separately on all three path forms (`/*`, an exact path, a wildcard).
:::

## What you can and can't set

Any header is allowed, including `Content-Security-Policy`,
`Permissions-Policy`, `X-Content-Type-Options`, `Cross-Origin-*`, etc.

A few headers are **reserved by the platform** and cannot be overridden —
they are skipped with a warning in the build log:

- `Set-Cookie`
- `X-Layero-Cache`, `X-Layero-Deploy-Id`, `X-Layero-Project-Id`,
  `X-Layero-S3-Path`, `X-Layero-Redirects`, `X-Layero-Headers`
  (Layero's internal headers).

Layero does **not** add security headers for you. HSTS, `X-Frame-Options`
and the like appear only after you declare them in `_headers`.

## Where to put the file

`_headers` must land in the **root of the artifact** — the folder whose
contents get published (`output` in project settings or in
[`layero.json`](./layero-json)).

- Many generators copy the static folder (`public/`, `static/`, `assets/`)
  verbatim. Put `_headers` there and it will end up at the build root.
- **Regular project:** the file shows up next to `index.html` in the built
  folder.
- **Monorepo:** inside the project's `root_directory`, so it lands at the
  root of `output` after the build.

After deploying, confirm the headers applied with `curl -sI` (see
[Quick start](#quick-start)). If they're missing, the file almost always
didn't land in the `output` root.

## A broken file doesn't fail the deploy

The parser is fault-tolerant: malformed lines (a path without `/`, a header
without `:`, an unsupported wildcard, a reserved name) are **skipped**, and
valid ones are applied. Every issue is logged; the deploy doesn't fail. An
empty or missing `_headers` clears previously set rules — so the header
state always reflects the latest build.

## Works on custom domains too

Headers apply the same way on the platform-issued project address and on a linked
[custom domain](./custom-domains) — rules are bound to the deploy, not to a
specific host.

## Redirects

Per-path redirects are configured with the sibling **`_redirects`** file
(also Netlify-compatible, matched by path). Note that `_redirects` matches
by **path**, not host, so a redirect like `www.site.com → site.com` can't be done with it. For that,
tick **«Подключить также `www.…`»** (Also connect www) when you connect the
domain — see [Custom domains](./custom-domains).
