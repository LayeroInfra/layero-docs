---
sidebar_position: 1
title: Деплой из GitHub
description: Подключите репозиторий — каждый git push будет публиковать новую версию автоматически.
---

# Деплой из GitHub

Подключите репозиторий — и каждый `git push` будет публиковать новую
версию.

## Подключение

1. Залогиньтесь в [app.layero.ru](https://app.layero.ru) через **GitHub**.
   На этапе OAuth-разрешений Layero запросит доступ к репозиториям —
   вы можете выбрать, к каким именно.
2. Нажмите **«Создать проект»** → **«Импортировать из GitHub»**.
3. Выберите репозиторий и ветку. По умолчанию production-веткой
   становится `main`.
4. Нажмите **Deploy**. Layero склонирует код, прогонит сборку
   и опубликует артефакты.

## Что происходит на push

```
git push  →  GitHub webhook  →  POST /webhook/{project_id}
              │
              ▼
        Layero создаёт деплой со SHA текущего коммита
              │
              ▼
        Builder клонирует, ставит зависимости, собирает,
        загружает артефакты в S3, переключает окружение.
```

Webhook регистрируется автоматически при создании проекта. Для каждого
проекта используется индивидуальный `webhook_secret`, подпись HMAC-SHA256
проверяется в заголовке `X-Hub-Signature-256`.

## Push в default-ветку — auto-promote в production

По умолчанию успешный билд default-ветки автоматически становится
production: `production_deploy_id` переключается на новый деплой,
apex `<org>-<project>.layero.ru` начинает отдавать свежий артефакт.

Для команд этот toggle лучше выключить (Settings → «Auto-promote
default branch» → off): тогда каждый relaese — явный клик «Promote»
в UI или [`layero promote`](../cli/promote.md) из CLI. Защищает от
случайных production-релизов после merge'а в main.

## Push в другую ветку — preview, не production

Push в любую другую ветку создаст **preview-окружение** с собственным
URL `<org>-<project>-<branch>.preview.layero.ru` (24 ч TTL). Apex
**не трогается** — production продолжает отдавать ровно тот деплой,
на который указывает pointer.

Чтобы выкатить feature-ветку в production без коммита в main —
жмите «Promote» на её свежем деплое (или `layero promote --deploy=<sha>`).

Подробнее про модель доменов — [Окружения, preview и production](./environments.md).

## Multi-provider: что если я залогинен через Яндекс ID?

OAuth Layero поддерживает GitHub и Яндекс ID. Импорт репозиториев работает
только для GitHub-аккаунтов. Если вы залогинены через Яндекс — добавьте
GitHub-identity (UI: «Настройки» → «Подключённые аккаунты»), и в проекте
появится возможность создать GitHub-источник.

Альтернатива — деплоить из CLI: [`layero deploy`](../cli/deploy.md).

## Первый деплой и обещание hostname

После первого `ready`-деплоя в default-ветке:

- **Preview-URL ветки** (`<org>-<project>-<branch>.preview.layero.ru`) — доступен через ~30 секунд.
- **Production apex** (`<org>-<project>.layero.ru`) — через 5–15 минут на первый раз (YC CDN прогревает per-host LE-сертификат). На все последующие promote'ы apex отдаёт новый артефакт моментально — hostname уже зарегистрирован.

Пока apex прогревается, на нём показывается страница **«Сайт скоро появится»** — чтобы зашаренная ссылка не отдавала 404.
