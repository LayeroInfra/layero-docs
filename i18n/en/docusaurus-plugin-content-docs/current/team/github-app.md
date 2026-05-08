---
sidebar_position: 2
title: GitHub App интеграция
description: Зачем нужен GitHub App, как установить на personal или organization, в чём отличие от OAuth, как отключить.
---

# GitHub App интеграция

Layero может работать с GitHub двумя способами:

* **OAuth App** (legacy) — токен конкретного пользователя. Layero
  использует его для clone'а и создания per-repo webhook'ов. Ломается,
  если этот пользователь уходит из организации или revoke'ает токен.
* **GitHub App** (рекомендуется) — installation на GitHub-аккаунт или
  GitHub Organization. Layero получает короткоживущий installation token
  по запросу. Не зависит от конкретного юзера, переживает смену состава
  команды.

Для command-organization GitHub App — **обязательный** способ доступа к
репам: иначе все деплои привязаны к OAuth-токену одного человека.

## Подключение

1. https://app.layero.ru → выбери организацию в OrganizationSwitcher
2. Перейди на страницу **Команда** (`/account/team`)
3. В блоке **GitHub интеграция** жми **Подключить GitHub**
4. Откроется picker:
   * Если у твоего OAuth-токена нет scope `read:org` — Layero
     автоматически прогонит OAuth round-trip, чтобы получить полный
     список твоих GitHub-organizations
   * После round-trip picker заново откроется со списком всех orgs
5. Выбери GitHub Organization из списка — Layero отправит тебя сразу
   на GitHub install page для этой orgы (никакого "personal account"
   exhaust trap)
6. На GitHub: выбери **All repositories** или конкретный список → Install
7. GitHub редиректнет назад на `/account/team?github_app=connected`

После успешной установки в блоке **GitHub интеграция** появится:

```
Подключено: layero-platform (GitHub Org)        [Отключить]
```

## Personal Layero org → Personal GitHub

Личный Layero-аккаунт тоже может использовать GitHub App, если ты
хочешь App-подобный flow (без OAuth-токена) для своих личных репо.
Picker предложит твой GitHub-юзер вместо organization'а. Это валидный
сценарий, App установится на твой GitHub-юзер.

## Отключение

`/account/team` → **Отключить** в блоке GitHub интеграция. Это убирает
связь Layero ↔ installation на нашей стороне. Сам App в GitHub
остаётся установленным — чтобы полностью убрать, иди в `https://github.com/settings/installations`
(или `https://github.com/organizations/<org>/settings/installations`)
и uninstall.

После отключения существующие проекты под этой Layero-orgой потеряют
App-токен. Следующий деплой упадёт с "no installation token" — нужно
либо переподключить App, либо мигрировать проект на CLI-only.

## Что даёт App

* **Repo listing scoped to installation:** dashboard "New Project" → Import
  Git Repository показывает только репы, к которым App имеет доступ
  (а не все репы owner'а).
* **Push events** через единый webhook `/webhook/github-app` (не нужно
  per-repo webhook'и).
* **Installation token** живёт 1 час, минтуется по запросу. Не нужно
  хранить access token конкретного юзера.
* **Builder context** автоматически предпочитает installation token при
  clone'е репо.

## Troubleshooting

### "Список ваших GitHub-организаций неполный"

OAuth-токен не имеет scope `read:org`. Нажми **Подключить GitHub** —
Layero автоматически отправит на повторную авторизацию, GitHub попросит
подтвердить новый scope.

### "GitHub App can't see X on this installation"

App установлен, но repo не выбрана в его scope. Иди в
`https://github.com/organizations/<org>/settings/installations/<id>` →
"Repository access" → выбери нужную repo.

### "Не вижу свою organization в picker'е"

После round-trip с `read:org` все orgs где ты member должны появиться.
Если всё ещё не видно — введи имя orgи вручную через **"Не видишь нужную
organization? Ввести вручную"**. Layero резолвит её через App JWT.
