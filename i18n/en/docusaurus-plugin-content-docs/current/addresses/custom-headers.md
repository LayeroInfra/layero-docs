---
slug: /deploys/custom-headers
sidebar_position: 2
title: HTTP headers
description: How to add your own HTTP headers to a static site with a _headers file — syntax, supported paths, headers you can't set and how to check the result.
---

# HTTP headers

**Your own HTTP headers for a static site are set with a `_headers` file at
the root of the built site** — for example `X-Frame-Options`,
`Content-Security-Policy` or `Referrer-Policy`. The syntax is Netlify's, with the limits described below. There's no separate setting in the dashboard: the file lives next to the code.

Why not a `<meta http-equiv>` tag: browsers don't accept `X-Frame-Options` through it: that policy works only as a real response header.

:::note[Apps with a server]
All of this is about static sites. An [app with a
server](../runtime/overview.md) (Next.js with server rendering, Node.js,
Python) sets headers itself, in code: `res.setHeader(...)`, `headers()` in
`next.config.js` and so on.
:::

## Quick start

Put a `_headers` file (no extension) at the root of the build output
folder — next to `index.html`:

```text title="_headers"
/*
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
```

After publishing, the headers are sent on every page of the site. To check:

```bash
curl -sI https://<project-address>/ | grep -i -E 'x-frame|referrer|x-content-type'
```

## Syntax

The file is made of blocks. A block starts with a path line at the left
edge — it starts with `/`. Below it are indented lines of the form
`Header-Name: value`. Blank lines and lines starting with `#` are skipped.

```text title="_headers"
# A comment

/*
  X-Frame-Options: DENY

/about/
  X-Robots-Tag: noindex

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### Supported paths

| Pattern | What matches | Example |
|---|---|---|
| `/*` | every address on the site | the whole site |
| exact path | exactly this address | `/about/`, `/index.html` |
| `/prefix/*` | every address under the prefix | `/assets/*`, `/docs/*` |

An asterisk in the middle of a path (`/foo/*/bar`) and placeholders like
`/blog/:slug` aren't supported: such a block is skipped with a warning in
the build log.

### When several blocks match

The order in the file is kept, and if one header is set in several matching
blocks, **the last one wins**. So the general `/*` block goes first and the
specific ones below it:

```text title="_headers"
/*
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

Here `/assets/style.css` gets a long cache and every other address gets
`must-revalidate`. Your `Cache-Control` replaces the platform's value.

## Headers you can't set

The platform doesn't let you set:

- `Strict-Transport-Security`, `Public-Key-Pins`,
  `Public-Key-Pins-Report-Only`;
- `Set-Cookie`;
- the service headers `X-Layero-*`.

Lines with them are skipped with a warning in the build log. All other headers are allowed. For `Content-Security-Policy`, `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials` and `X-Frame-Options` the log adds the note `replaces the platform default for this site — applied as written`: the header is applied as you wrote it.

## Where to put the file

`_headers` must end up at the root of the build output folder — the one
that gets published (`outputDirectory` in the project settings or in
[`layero.json`](../build/layero-json.md)).

- Most generators copy files from the static folder (`public/`, `static/`)
  as they are. Put `_headers` there — after the build it ends up at the
  root.
- In a monorepo — inside the app's folder.

If the headers are missing after publishing, the file almost always didn't
reach the root of the output folder.

## Errors in the file don't fail the build

Invalid lines — a path without `/`, a header without `:`, an unsupported
pattern, a forbidden name — are skipped, valid ones are applied. Every note
goes to the build log. An empty or deleted `_headers` removes the rules set
earlier: headers always match the latest build.

Headers work the same on the `layero.app` address and on a
[custom domain](./custom-domains.md).

## Redirects

Path redirects are set with a neighbouring `_redirects` file — see
[The 404 page and redirects](./not-found-404.md). It doesn't do the
`www.site.ru → site.ru` redirect: for that, tick «Подключить также `www.…`»
(Also connect www) when connecting the domain — see
[Custom domain](./custom-domains.md).
