import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Layero Docs',
  tagline: 'Документация платформы Layero',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://docs.layero.ru',
  baseUrl: '/',

  organizationName: 'Layero-platform',
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
            'https://github.com/Layero-platform/layero-docs/tree/main/',
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
            'https://github.com/Layero-platform/layero-docs/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
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
            {label: 'GitHub', href: 'https://github.com/Layero-platform'},
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
