---
sidebar_position: 4.2
title: Sign-in with Yandex, VK ID and Sber ID
description: How to connect sign-in through an external provider — the provider's side, the callback URL, scopes, the button on your site and what happens to the account.
---

# Sign-in with Yandex, VK ID and Sber ID

:::info[Beta]

The Data API is in beta and available on the Pro plan. More on the
[“What the Data API is”](./index.md) page.

:::

A visitor clicks “Sign in with Yandex”, confirms at the provider and comes back
to your site signed in. It works the same way as in Supabase:

```js
await db.auth.signInWithOAuth({
  provider: "yandex", // or "vkid", "sber"
  options: { redirectTo: "https://shop.example/account" },
});
```

## Connecting a provider

You do it once per database: open the database in the dashboard, then
“Authentication” → “Sign-in methods” → the provider. The dialog has three steps.

1. **Create an app at the provider.**

   | Provider | Where | What you need |
   |---|---|---|
   | Yandex | [oauth.yandex.ru](https://oauth.yandex.ru) → “Create app” | Client ID and secret |
   | VK ID | [id.vk.ru](https://id.vk.ru) → “Create app” | Client ID only, VK ID has no secret |
   | Sber ID | [developers.sber.ru](https://developers.sber.ru) → Sber ID → partner application | a partner agreement, Client ID, secret and a certificate |

2. **Add the callback URL at the provider.** The dialog shows it; it looks like:

   ```
   https://data.layero.ru/<database-address>/auth/v1/callback
   ```

   It is the Data API address, not your site: the provider sends the person to
   us, and we send them on to your site.

3. **Paste the Client ID and secret into the dashboard** and press “Check
   sign-in”. The check runs a real sign-in and shows what the provider returned.

The same from the terminal, handy in a setup script:

```bash
printf %s "$YANDEX_SECRET" | npx layero@latest data auth provider set yandex --client-id <id> --db <database>
npx layero@latest data auth redirects add yandex http://localhost:5173 --db <database>
npx layero@latest data auth status --db <database>
```

### Which scopes to enable at the provider

The platform asks the provider only for what the account needs — enable the
same scopes for your app:

| Provider | Scopes |
|---|---|
| Yandex | `login:email` (email address), `login:info` (name) |
| VK ID | `email`, `phone` |
| Sber ID | `openid`, `name`, `email` |

### Where a person may be sent back

`redirectTo` must match one of the site's allowed addresses. The list is in
the same dashboard dialog: it already holds the addresses of the connected projects,
and you can add your own, e.g. `http://localhost:5173` for development. Any
other address is refused — otherwise a sign-in link would carry the session to
a third-party site. Without `redirectTo` the person returns to the connected
project's address.

## The button on your site

Show the button only for connected providers. `GET /auth/v1/settings` returns
the list:

```js
const res = await fetch(`${DATA_URL}/auth/v1/settings`, {
  headers: { apikey: DATA_KEY },
});
const { external } = await res.json();
// external = { yandex: true, vkid: false, sber: false }
if (external.yandex) showYandexButton();
```

`true` means the keys are saved and the sign-in is enabled.

### When sign-in fails

If `redirectTo` is allowed, the visitor is sent back to your site, and the reason
arrives in the URL as `error`, `error_code` and `error_description`; `supabase-js` parses them
itself. The most common codes:

| Code | What happened |
|---|---|
| `provider_not_configured` | the provider is not connected for the database |
| `provider_disabled` | the provider is turned off in the dashboard |
| `access_denied` | the person cancelled at the provider |

With no `redirectTo`, the platform answers with JSON carrying the same code and
does not redirect. A foreign address also gets JSON, with `redirect_not_allowed`.

## What happens to the account

- **The first sign-in** creates the user. `user.identities` gets the provider's
  entry (`provider: "yandex"`); name and avatar arrive in `user_metadata`.
- **A repeated sign-in** through the same provider finds the same account.
- **The email matches an existing account.** Yandex and Sber ID vouch for the
  address, so the sign-in is linked to that account, which gets a second entry
  in `user.identities`. VK ID does not, so such a sign-in is refused (“This
  address is already taken by another sign-in method”): otherwise anyone could
  enter someone else's account by typing their address into a profile.
- **A different email** means a different account. Accounts are not merged.

A user who came by email (password, link, emailed code, or created in the
dashboard) has an `email` entry in `user.identities`, as in Supabase. Your app
can use the list to decide whether to show “Link Yandex”.
