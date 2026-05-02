---
sidebar_position: 1
title: Быстрый старт
description: Установите CLI, залогиньтесь и опубликуйте первый сайт за одну команду.
---

# Быстрый старт

За 30 секунд опубликуем локальный фронтенд через CLI. Если вы предпочитаете
автодеплой по `git push`, см. раздел [Деплой из GitHub](../deploys/github.md).

## 1. Поставьте CLI

```bash
npm install -g layero
```

Требуется Node.js ≥ 20.

## 2. Залогиньтесь

```bash
layero login
```

Команда откроет браузер и предложит авторизоваться через **GitHub** или
**Яндекс ID**. После успешной авторизации токен сохраняется в
`~/.layero/config.json` (chmod 600).

## 3. Задеплойте

```bash
cd my-site
layero deploy
```

CLI:

1. Упакует папку в tar.gz, уважая `.gitignore` и `.layeroignore`
   (см. [layero deploy](../cli/deploy.md)).
2. Зальёт архив в Yandex Object Storage.
3. Запустит сборку на стороне платформы.
4. Покажет ссылку на дашборд проекта в [app.layero.ru](https://app.layero.ru).

Первый деплой создаст проект и сохранит ссылку на него в
`./.layero/project.json` — последующие `layero deploy` уйдут в тот же проект.

## 4. Откройте сайт

После завершения сборки сайт будет доступен на
`https://<owner>-<project>.layero.ru`. Например, для пользователя `vasya`
и проекта `my-site` — `https://vasya-my-site.layero.ru`.

:::tip Preview-URL за 30 секунд
Полный канонический hostname на CDN прогревается 5–15 минут. Чтобы вы могли
сразу проверить результат, Layero выдаёт **preview-URL** вида
`https://<project>-<sha7>.preview.layero.ru` уже через ~30 секунд после
успешной сборки. Подробнее — в [Окружения и preview-URL](../deploys/environments.md).
:::

## Что дальше

- Поднимите свой проект из GitHub: [Деплой из GitHub](../deploys/github.md).
- Добавьте переменные окружения: [Env vars](../deploys/env-vars.md).
- Подключите свой домен: [Custom domains](../deploys/custom-domains.md).
