---
sidebar_position: 3
title: GitVerse
description: How to issue a token in GitVerse, connect it to a Layero organization and import a repository. How GitVerse differs from GitHub.
---

# GitVerse

**GitVerse connects with a personal token in three steps:** issue the token,
connect it to the organization, import the repository.

## 1. Issue a token in GitVerse

Open [gitverse.ru/settings/tokens](https://gitverse.ru/settings/tokens)
(«Настройки» → «Управление токенами», Settings → Token management).

1. Enter a token name, for example `layero`.
2. Tick the rights in the table — sections in rows, «Чтение» (Read) and
   «Запись» (Write) in columns:

   | Section | Right | Why |
   |---|---|---|
   | «Репозитории» (Repositories) | Read and Write | read the code and create a webhook for builds on push |
   | «Пользователи» (Users) | Read | find out whose token it is |

3. Click «Генерировать токен» (Generate token) and copy the value: it's
   shown once. The token is 40 letters and digits.

## 2. Connect the token to the organization

1. In the [dashboard](https://app.layero.ru), open the organization settings
   → «Git».
2. Click «Подключить репозиторий» (Connect a repository), choose GitVerse
   and paste the token.
3. Layero checks the token and shows its owner's login.

The connection belongs to the organization: all its members see the
repositories. But builds rely on this token — if its owner revokes it or loses access to the repositories in GitVerse, builds stop. For a team, issue the token from a service
account.

## 3. Import the repository

1. «Новый проект» (New project) → «Импорт из репозитория» (Import from a
   repository).
2. Choose the GitVerse connection and the repository, and the subfolder if
   the site isn't at the root.
3. Check which framework the platform detected and which build commands it
   suggests, and start the build.

Layero creates a webhook in the repository and starts the first build. From
then on every push builds the site: the main branch goes to the main
address, the others to previews at `<project>-<branch>.layero.app`.

## How GitVerse differs from GitHub

- **The code is fetched by commit.** GitVerse's API can't download a
  repository archive, so Layero fetches just the commit it needs.
- **Commit statuses aren't published.** GitVerse doesn't show whether a
  build passed: its API has no way to do that. Check the status in the
  dashboard.
- **The token expires.** When it does, builds on push stop, and the
  connections list shows «токен недействителен» (token invalid). Issue a new
  one and update the connection — projects don't need relinking.

The webhook is protected by a secret token in its address that only Layero
and GitVerse know. No one else can start a build.

## If the webhook wasn't created

If the token lacks the Write right in the «Репозитории» (Repositories) section, Layero can't create the webhook and warns you during import. Issue a token with that right and import again. Another way is to create the webhook in GitVerse by hand at the address the dashboard shows.
