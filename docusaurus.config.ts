import {execSync} from 'node:child_process';
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// `showLastUpdateTime` берёт дату из git-истории файла, и БЕЗ репозитория
// Docusaurus не предупреждает, а падает: «This Docusaurus site is outside any
// Git repository». Этот же репозиторий собирается двумя путями — в GitHub
// Actions (там git есть, клон полный) и на самой Layero, куда исходники
// приезжают тарболом без .git. Безусловное включение уронило второй путь
// 20 раз за 6 часов, пока первый исправно катился.
//
// Поэтому обе опции, которым нужен git — showLastUpdateTime и sitemap.lastmod,
// — включаем по факту наличия репозитория: где git есть, в sitemap попадает
// честный <lastmod>; где нет — сборка просто проходит без него.
const hasGitHistory = (() => {
  try {
    execSync('git rev-parse --is-inside-work-tree', {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
})();

const config: Config = {
  title: 'Layero Docs',
  tagline: 'Документация платформы Layero',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://docs.layero.ru',
  baseUrl: '/',

  organizationName: 'LayeroInfra',
  projectName: 'layero-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en'],
    localeConfigs: {
      ru: {label: 'Русский', htmlLang: 'ru-RU'},
      en: {label: 'English', htmlLang: 'en-US'},
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl:
            'https://github.com/LayeroInfra/layero-docs/tree/main/',
          // Без этого Docusaurus не вычисляет дату последней правки из git,
          // и sitemap остаётся без <lastmod> — плагин просто нечего писать.
          showLastUpdateTime: hasGitHistory,
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'Блог Layero',
          blogDescription: 'Новости, обновления и заметки команды Layero',
          postsPerPage: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'Блог Layero',
            copyright: `© ${new Date().getFullYear()} Layero`,
            xslt: true,
          },
          editUrl:
            'https://github.com/LayeroInfra/layero-docs/tree/main/',
          showLastUpdateTime: hasGitHistory,
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        // Без этого Docusaurus отдаёт sitemap вообще без <lastmod>, и краулеру
        // нечем отличить изменившуюся страницу от нетронутой — он либо ходит
        // по всем 56 подряд, либо не ходит вовсе. Дата берётся из git-истории
        // файла, поэтому в CI нужен полный клон (fetch-depth: 0), иначе у всех
        // страниц окажется дата единственного склонированного коммита.
        sitemap: {
          // Требует git САМ ПО СЕБЕ, независимо от showLastUpdateTime — без
          // репозитория падает тем же «outside any Git worktree». Проверено
          // разделением: убрать только эту строку — сборка без git проходит.
          lastmod: hasGitHistory ? 'date' : undefined,
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  // Раздел docs/plugin/* (генерация лендингов через MCP) снят 17.09.2026 как
  // неудачный эксперимент; его заменил docs/agents/*. Старые адреса жили в
  // карте сайта, IndexNow и внешних каталогах — отдавать по ним 404 значит
  // терять именно тех читателей, что пришли по ссылке. Плагин создаёт
  // HTML-заглушки с meta refresh для обеих локалей.
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {from: ['/plugin', '/plugin/intro', '/plugin/integrations'], to: '/agents/'},
          {from: '/plugin/install', to: '/agents/install'},
          {from: '/plugin/catalogue', to: '/agents/mcp-tools'},
        ],
      },
    ],
  ],

  // Docusaurus сам кладёт на страницы только BreadcrumbList (и BlogPosting в
  // блоге) — узла Organization нет нигде. То есть вся развязка сущности жила
  // на лендинге, а 56 страниц документации не сообщали поисковику и ассистенту
  // ничего о том, что за Layero это вообще. Омонимов при этом три: Layer0 /
  // Edgio, layero.com и LayerOne (dev.layerone.fr, тоже с MCP-сервером).
  //
  // @id узла НАМЕРЕННО тот же, что на layero.ru — это один и тот же субъект на
  // двух доменах, и совпадение @id — единственный способ сказать это явно.
  // Значения дублируют лендинг; при правке менять в обоих местах.
  headTags: [
    // Docusaurus объявляет ровно одну иконку — ту, что в `favicon`. У доков
    // это был только SVG, а `/favicon.ico` отдавал 404. SVG-иконки понимают
    // не все: старые Safari и часть мобильных браузеров, а главное —
    // агрегаторы, читалки и сервисы превью по соглашению дёргают именно
    // `/favicon.ico` и получали ничего. Плюс не было иконки для добавления
    // на домашний экран. Набор взят с лендинга, чтобы бренд не разъезжался.
    {tagName: 'link', attributes: {rel: 'icon', href: '/favicon.ico', sizes: 'any'}},
    {tagName: 'link', attributes: {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png'}},
    {tagName: 'link', attributes: {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png'}},
    {tagName: 'link', attributes: {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'}},
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://layero.ru/#organization',
            name: 'Layero',
            alternateName: ['Лайеро', 'Layero PaaS', 'Layero.ru'],
            url: 'https://layero.ru/',
            logo: {
              '@type': 'ImageObject',
              url: 'https://layero.ru/android-chrome-512x512.png',
              width: 512,
              height: 512,
            },
            description:
              'Бесплатный хостинг для фронтенд-сайтов и фуллстек-приложений с CDN в России.',
            disambiguatingDescription:
              'Российский PaaS для деплоя фронтенда и фуллстек-приложений. Не следует путать с Layer0 / Edgio — это другой продукт, не имеющий отношения к Layero.',
            areaServed: {'@type': 'Country', name: 'Россия'},
            sameAs: [
              'https://www.wikidata.org/wiki/Q140078300',
              'https://github.com/LayeroInfra',
              'https://www.npmjs.com/package/layero',
            ],
            identifier: {
              '@type': 'PropertyValue',
              propertyID: 'Wikidata',
              value: 'Q140078300',
            },
          },
          {
            '@type': 'WebSite',
            '@id': 'https://docs.layero.ru/#website',
            url: 'https://docs.layero.ru/',
            name: 'Документация Layero',
            description:
              'Документация платформы Layero: деплой фронтенда из репозитория (GitHub, GitVerse, GitLab, GitFlic, SourceCraft) или одной командой, кастомные домены, runtime-приложения, CLI, навык и MCP-сервер для AI-агентов.',
            publisher: {'@id': 'https://layero.ru/#organization'},
          },
        ],
      }),
    },
  ],

  // Поиска на доках не было вовсе: блока `algolia` в конфиге нет, а
  // meta-теги `docsearch:*` Docusaurus печатает по умолчанию — это подсказки
  // ДЛЯ краулера, а не признак настроенного поиска, и на них легко купиться.
  //
  // Взят локальный индекс, а не Algolia DocSearch: он не требует заявки и
  // одобрения, не зависит от зарубежного сервиса (что для этого продукта
  // отдельный аргумент) и одинаково работает в обеих локалях.
  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['ru', 'en'],
        indexBlog: true,
        docsRouteBasePath: '/',
        searchResultLimits: 8,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    // Растровая, а не логотип в SVG. Ни один сборщик превью — Telegram,
    // Facebook, Slack, VK, Twitter — SVG в карточке не рисует, поддерживаются
    // только PNG/JPEG/WebP. С logo.svg все 56 страниц и оба поста блога
    // разворачивались в чате без картинки.
    image: 'img/og-image.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      logo: {
        alt: 'Layero',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Документация',
        },
        {to: '/blog', label: 'Блог', position: 'left'},
        {to: '/contacts', label: 'Контакты', position: 'left'},
        {
          href: 'https://layero.ru',
          label: 'layero.ru',
          position: 'right',
        },
        {type: 'localeDropdown', position: 'right'},
        // Читатель документации — самый тёплый трафик, какой у нас есть: он
        // уже разбирается, как всё устроено. До этого нажать ему было
        // некуда — в навбаре стояли только разделы и ссылка на лендинг.
        {
          href: 'https://app.layero.ru',
          label: 'Начать',
          position: 'right',
          className: 'navbar__cta',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Документация',
          items: [
            {label: 'Введение', to: '/'},
            {label: 'Блог', to: '/blog'},
          ],
        },
        {
          title: 'Layero',
          items: [
            {label: 'layero.ru', href: 'https://layero.ru'},
            {label: 'app.layero.ru', href: 'https://app.layero.ru'},
          ],
        },
        {
          title: 'Code',
          items: [
            {label: 'GitHub', href: 'https://github.com/LayeroInfra'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Layero. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
