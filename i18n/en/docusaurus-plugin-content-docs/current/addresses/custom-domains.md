---
slug: /deploys/custom-domains
sidebar_position: 1
title: Custom domain
description: How to connect your own domain to a project on Pro — which DNS records to add, how Layero issues the certificate, what to do with your previous hosting's records and what happens to the domain if Pro ends.
---

# Custom domain

**You can connect your own domain, bought from any registrar, to a project —
for example `my-site.ru` or `shop.my-site.ru`.** It isn't a redirect: your
domain serves the site itself, with its own HTTPS certificate.

:::info[Plan]
Custom domains are available on the [Pro](../billing/plans.md) plan. On Free
the «Домены» (Domains) item in the project menu carries a Pro badge.
:::

A custom domain shows the same as the project's main address: when a new
build is published or rolled back, it changes along with it.

A connected domain can be made **primary** — the «Сделать основным» (Make
primary) button on the domain card. The `layero.app` address and the
project's other domains then redirect visitors to the primary domain (a 301
redirect).

## How to connect one

1. Open the project → «Домены» (Domains) in the project menu.
2. Enter the domain — `my-site.ru` or `shop.my-site.ru`. Layero works out
   whether it is an apex domain or a subdomain and recognises your registrar
   from DNS.
   For an apex domain the wizard offers a «Подключить также `www.…`» (Also connect www) checkbox: the `www` address will redirect to the apex.
   It needs one more record — a CNAME for `www`.
3. Click «Добавить» (Add). A domain card appears with a step-by-step checklist and
   the **two DNS records** you need to add.
4. Open your registrar's control panel, add the records (the wizard shows
   instructions for your specific registrar) and save.
5. There is nothing else to do: Layero re-checks DNS by itself roughly
   every 15 minutes, then issues the certificate and connects the domain.
   You do not have to wait — the «Проверить» (Check) button on the card runs the
   check right away.

## Which DNS records are needed

Two. The type of the first depends on whether you have an apex domain or a
subdomain.

| Domain | The "points at" record | The verification record |
|---|---|---|
| Apex (`my-site.ru`) | `A` → Layero's IP address | `TXT` `_layero-verify` |
| Subdomain (`shop.my-site.ru`) | `CNAME` → `cname.layero.ru` | `TXT` `_layero-verify.shop` |

The exact values (the IP address, the TXT value) are shown on the domain card — each is copied in one click. If your registrar's panel won't let you create the `_layero-verify` name, add the same value as a TXT record on the domain itself.

No third record is needed for the certificate: Layero verifies domain
ownership over HTTP as soon as the domain starts pointing at the platform.

### Apex domain and subdomain

- **Apex domain** (`my-site.ru`) — needs an `A` record to Layero's IP. The DNS
  standard forbids a `CNAME` at the zone apex, so `A` it is.
- **Subdomain** (`shop.my-site.ru`, `test.my-site.ru`) — a `CNAME` to
  `cname.layero.ru`. A subdomain at any depth (`api.v2.my-site.ru` too) works
  the same way.

A subdomain via `CNAME` is in fact more robust: if Layero's infrastructure
changes IP, subdomains follow automatically and nothing needs rewriting.

## Instructions for your registrar

The wizard picks step-by-step instructions for the popular registrars:
**REG.RU**, **Cloudflare**, **Beget**, **GoDaddy**, **Namecheap**. For the
rest there are generic instructions and support.

A few things worth knowing:

- **REG.RU with hosting.** If the domain's NS servers are
  `ns1.hosting.reg.ru`, DNS records are edited **not on the domain card** but
  in the hosting panel (ISPmanager). The wizard walks you through that path.
  For the apex leave the "Name" field **empty** — ISPmanager fills in the
  domain itself.
- **Cloudflare.** Set the added records to Proxy status → **"DNS only"** (the
  grey cloud). The orange cloud (proxy) breaks our TLS — Cloudflare will try
  to substitute the certificate.
- **TXT without quotes.** Paste the TXT value as-is, without surrounding
  quotes — most panels add them themselves.

## Moving from another host

Records from the previous host stay in the zone and keep working — adding your
own on top is not enough. While the old records are there, they route both
visitors and the Let's Encrypt check to someone else's server. **Delete them
before you click «Проверить» (Check).**

What to look for in the registrar's panel:

- **An `ALIAS` (also called `ANAME`; in Cloudflare, a `CNAME` at the apex)
  pointing elsewhere.** The DNS standard forbids `CNAME` at the apex of a
  zone, and many panels offer `ALIAS` as a way around that. It overrides your
  `A` record even when that record sits right next to it and looks correct:
  the domain hands out the other server's address, and Let's Encrypt goes
  there to validate ownership. Leave only the `A` record pointing at Layero's
  IP.
- **A `CAA` record.** It lists the certificate authorities allowed to issue for
  the domain. The previous host may have put its own CA there — and then Let's
  Encrypt will not issue a certificate no matter how many times you press
  «Проверить». Either delete the `CAA` record or add another `CAA` record with the
  value `0 issue "letsencrypt.org"`. Layero checks `CAA` both on the domain
  itself and on its parent zones: for `shop.my-site.com`, also on
  `my-site.com`.
- **Stale `A` and `AAAA` records** pointing at the old host's IPs. Nothing
  subtle here — just delete them.

To see what DNS serves right now, ask one record type at a time:

```bash
dig +short my-site.com A
dig +short my-site.com AAAA
dig +short my-site.com CAA
```

Asking for `ANY` is useless: public resolvers answer that question with a
placeholder, so the zone looks empty. An `ALIAS` is not always visible either
— some providers, Cloudflare among them, resolve it on their side and hand out
plain `A` addresses. If the `A` record looks right but the domain still serves
the old site, look for an `ALIAS` in the registrar's panel.

Everything blocking the connection is listed with its current value in the
yellow bar above the checklist.

## Common problems

- **The registrar's parking records.** Many registrars add their own "parking"
  `A` and `AAAA` records when a domain is bought. Those must be **deleted**,
  otherwise the domain opens intermittently — some requests go to the parking
  page. Records from a previous host go the same way — see
  [Moving from another host](#moving-from-another-host).
- **The `AAAA` record (IPv6).** Layero is IPv4-only for now, so we do not issue
  a certificate while any `AAAA` record exists: Let's Encrypt prefers IPv6 and
  would go validate the domain over it — that is, past us. Delete the `AAAA`;
  the wizard warns you if it sees one. Sometimes there is no `AAAA` in the
  panel yet the domain still has IPv6: those addresses come from an `ALIAS`
  pointing elsewhere.
- **The verification code changed.** We issue a new one every time you add the
  domain to a project. If you removed the domain and added it again, the
  previous `_layero-verify` `TXT` value no longer matches — while the
  instructions look exactly the same. Copy the current code from the domain
  card.
- **DNS does not update instantly.** After you save at the registrar, records
  propagate in 5 minutes to an hour. Layero waits by itself — you do not need
  to keep the page open.

## How long it takes

| Step | Time |
|---|---|
| DNS propagation at the registrar | 5 minutes – 1 hour |
| Ownership check + Let's Encrypt issuance | 30–90 seconds once DNS is visible |
| Attaching to the server | ~10 seconds |

In total: from a couple of minutes to an hour, and nearly all of it is waiting
on DNS at your registrar — something Layero cannot influence.

## Your own certificate

Layero issues a Let's Encrypt certificate by itself. Uploading a ready-made
certificate (an EV one from your provider, for instance) is not available in
the panel yet — if you need it, [contact support](../support.md).

## Where the domain points

A custom domain shows the project's production build — the same as the main
address. Attaching a domain to a separate branch is not available in the panel
yet.

## Certificate renewal

A Let's Encrypt certificate is valid for 90 days. Layero **renews it
automatically** roughly 30 days before expiry — without your involvement and
without downtime.

## If Pro ends

After the organization moves to Free, custom domains are suspended. The DNS records and the link to the project are kept, and the site opens at `<project>.layero.app`. Once Pro is paid again, the domains turn back on by themselves — see [Balance and renewal](../billing/lifecycle.md#what-happens-after-moving-to-free).

## What Layero does not do

- **It does not buy domains.** Register them with any registrar.
- **It does not manage your DNS zone.** Layero gives exact instructions, but
  you add the records.


## Detaching

The domain card has a cross in the top right corner. Layero removes the
certificate and the configuration. Remove the DNS records in your own zone by
hand.
