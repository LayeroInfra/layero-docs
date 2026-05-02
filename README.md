# Layero Docs

Пользовательская документация платформы Layero. Сайт построен на
[Docusaurus](https://docusaurus.io) (TypeScript, classic preset).

В будущем будет развёрнут на `https://docs.layero.ru` отдельным CDN-ресурсом
поверх Yandex Object Storage.

---

## Структура

```
docs/                  # Основная документация (markdown / mdx)
  intro.md             # Корень сайта (slug: /)
  getting-started/     # Категория «Быстрый старт»
blog/                  # Блог Layero
  authors.yml
  tags.yml
  YYYY-MM-DD-*.mdx
src/                   # Кастомизация темы (CSS, кастомные компоненты)
static/                # Статические файлы (favicon, logo, картинки)
docusaurus.config.ts   # Главный конфиг (siteUrl, navbar, footer, и т.д.)
sidebars.ts            # Конфиг сайдбара
```

`docs.routeBasePath = '/'` — документация лежит в корне домена,
блог — на `/blog`.

## Локальная разработка

```bash
npm install
npm start            # http://localhost:3000 (live reload)
npm run build        # production-сборка в ./build
npm run serve        # локальный preview production-сборки
```

Node 18+ (рекомендуется 20/22/24).

## Контент

- **Документация** — `docs/**/*.{md,mdx}`. Сайдбар автогенерится из структуры
  каталогов. Метаданные категории — в `_category_.json`.
- **Блог** — `blog/YYYY-MM-DD-slug.mdx`. Авторы — `blog/authors.yml`,
  теги — `blog/tags.yml`. Маркер «свернуть превью» — `{/* truncate */}`
  (MDX-комментарий, не HTML).

## Деплой (план)

Целевой домен: **`docs.layero.ru`**. По аналогии с `layero.ru` (см.
[frontend/landing/README.md](../frontend/landing/README.md)):

1. **Object Storage**
   - Создать бакет `layero-docs` в YC (website-mode, public-read).
   - Содержимое = `npm run build` → каталог `build/`.
2. **CDN**
   - Создать CDN-ресурс с origin = бакет, cname = `docs.layero.ru`.
   - Включить TLS (Let's Encrypt через YC), gzip/brotli.
   - В `auto-register-cdn` (см. infra) добавить hostname `docs.layero.ru`
     в `secondary_hostnames` (wildcard в YC не поддерживается, каждый
     hostname через PATCH).
3. **DNS**
   - В зоне `layero.ru` добавить CNAME `docs` → cname CDN-ресурса.
4. **CI/CD**
   - Скопировать `frontend/landing/deploy.sh` как стартовый шаблон
     (`yc storage cp` + `yc cdn cache purge`).
   - Сервис-аккаунт: переиспользовать `layero-cdn-sa`
     (роли `storage.editor` + `cdn.editor`) либо завести `layero-docs-sa`.

После деплоя кеш CDN обновится за 30–60s.
