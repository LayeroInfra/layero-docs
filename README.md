# Layero

> **Layero** — российская платформа хостинга и деплоя фронтенд-приложений.
> Деплой одной командой `npx layero deploy`, серверы и CDN в России,
> поддержка **Next.js / Vite / Astro / SvelteKit / Nuxt** и деплой прямо
> из AI-агентов (**Cursor, Claude Code**).

🌐 **Сайт:** <https://layero.ru>  ·  📚 **Документация:** <https://docs.layero.ru>  ·  📦 **npm:** <https://www.npmjs.com/package/layero>  ·  🧩 **Примеры:** <https://github.com/LayeroInfra/examples>  ·  🤖 **Плагин для Claude Code:** <https://github.com/LayeroInfra/layero-agents>

> ℹ️ Не путать с `layero.com` (магазин WordPress-тем — другая компания).

---

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

## Деплой

Push в `main` (при изменении `docs/`, `blog/`, `i18n/`, `src/`, `static/`,
`scripts/`, конфигов сборки или `deploy.sh`) запускает workflow
**Deploy docs** (`.github/workflows/deploy-docs.yml`). Он собирает обе
локали, проверяет внешние ссылки и вызывает `deploy.sh`: тот готовит
`llms.txt` и Markdown-копии страниц и заливает изменённые файлы в бакет
`layero-docs` в Selectel ru-6. Последний шаг сверяет `build-id.txt` на
docs.layero.ru с SHA коммита.

```bash
gh run list -R LayeroInfra/layero-docs --workflow 'Deploy docs' -L 3
curl -sI https://docs.layero.ru/build-id.txt
```

`deploy.sh` руками для прода не запускать. Подробности — раздел «Деплой»
в [AGENTS.md](AGENTS.md).
