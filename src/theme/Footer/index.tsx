/**
 * Подвал документации.
 *
 * Своя версия вместо стандартной (18.11.2026): та ставила три колонки
 * ссылок по всей ширине и строку «Built with Docusaurus» по центру — без
 * знака, без иерархии, со значком внешней ссылки у каждого второго пункта.
 *
 * Слева, как в подвале лендинга, — знак «layero × Docusaurus», фраза о том,
 * что это за документация, и одной строкой статус систем и значки GitHub,
 * GitVerse, Telegram. Ширина блока — по фразе в одну строку, строка со
 * статусом растянута на неё же: правые края текста и значков совпадают. Копирайта и переключателя языка нет (владелец 19.11):
 * язык уже есть в шапке. На узком экране у статуса короткая подпись.
 * Справа — колонки ссылок на всю оставшуюся ширину, последняя — для AI-агентов.
 * Колонки берутся из themeConfig.footer.links (docusaurus.config.ts), их
 * переводы — i18n/en/docusaurus-theme-classic/footer.json.
 * Замена Footer в Docusaurus помечена как безопасная.
 */
import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';
import {useThemeConfig} from '@docusaurus/theme-common';
import SystemStatus from './SystemStatus';
import styles from './styles.module.css';

type FooterLink = {label?: string; to?: string; href?: string};
type FooterColumn = {title?: string | null; items: FooterLink[]};

function Lockup(): ReactNode {
  return (
    <div className={styles.lockup}>
      <Link href="https://layero.ru" className={styles.lockupLink} aria-label="Layero">
        <ThemedImage
          className={styles.layeroLogo}
          alt="Layero"
          sources={{
            light: useBaseUrl('/img/logo.svg'),
            dark: useBaseUrl('/img/logo-dark.svg'),
          }}
        />
      </Link>
      <span className={styles.times} aria-hidden="true">
        ×
      </span>
      <Link href="https://docusaurus.io" className={styles.lockupLink}>
        <img
          className={styles.docusaurusLogo}
          src={useBaseUrl('/img/docusaurus.svg')}
          alt=""
          width={22}
          height={22}
        />
        <span className={styles.docusaurusName}>Docusaurus</span>
      </Link>
    </div>
  );
}

/**
 * GitVerse — зеркало репозитория (layero-agents/README.md, таблица зеркал).
 * Значок — настоящий favicon gitverse.ru, тот же файл, что в панели
 * (frontend/control-plane/src/assets/providers/gitverse.png): чужую марку
 * не перерисовываем.
 */
function GitVerseLink(): ReactNode {
  const label = translate({id: 'footer.gitverse', message: 'Исходники документации на GitVerse'});
  return (
    <Link className={styles.toolIcon} href="https://gitverse.ru/layero/layero-docs" aria-label={label} title={label}>
      <img src={useBaseUrl('/img/gitverse.png')} alt="" width={16} height={16} />
    </Link>
  );
}

/** Новостной канал Layero; контур — официальная марка Telegram (simple-icons). */
function TelegramLink(): ReactNode {
  const label = translate({id: 'footer.telegram', message: 'Новости Layero в Telegram'});
  return (
    <Link className={styles.toolIcon} href="https://t.me/layero_ru" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    </Link>
  );
}

function GitHubLink(): ReactNode {
  return (
    <Link
      className={styles.toolIcon}
      href="https://github.com/LayeroInfra/layero-docs"
      aria-label={translate({id: 'footer.github', message: 'Исходники документации на GitHub'})}
      title={translate({id: 'footer.github', message: 'Исходники документации на GitHub'})}>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    </Link>
  );
}

function Column({column}: {column: FooterColumn}): ReactNode {
  return (
    <div className={styles.column}>
      {column.title && <div className={styles.columnTitle}>{column.title}</div>}
      <ul className={styles.columnList}>
        {column.items.map((item, i) => (
          <li key={i}>
            <Link
              className={styles.link}
              {...(item.href ? {href: item.href} : {to: item.to})}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Колонка для AI-агентов. Живёт здесь, а не в docusaurus.config.ts:
 * llms.txt и sitemap.md — файлы, которые deploy.sh кладёт отдельно в каждую
 * локаль (/llms.txt и /en/llms.txt), а ссылка из конфига одна на обе.
 * pathname:// — мимо клиентского роутера: это файлы, не страницы.
 */
function useAgentsColumn(): FooterColumn {
  const llms = `pathname://${useBaseUrl('/llms.txt')}`;
  const sitemap = `pathname://${useBaseUrl('/sitemap.md')}`;
  return {
    title: translate({id: 'footer.agents.title', message: 'Для агентов'}),
    items: [
      {label: translate({id: 'footer.agents.install', message: 'Подключить агента'}), to: '/agents/install'},
      {label: translate({id: 'footer.agents.mcp', message: 'MCP-сервер'}), to: '/agents/mcp-tools'},
      {label: translate({id: 'footer.agents.skill', message: 'Навык layero'}), to: '/agents/skill'},
      {label: 'llms.txt', href: llms},
      {label: 'sitemap.md', href: sitemap},
    ],
  };
}

export default function Footer(): ReactNode {
  const {footer} = useThemeConfig();
  const agents = useAgentsColumn();
  if (!footer) {
    return null;
  }
  const columns = [...((footer.links ?? []) as FooterColumn[]), agents];
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.brandTop}>
              <Lockup />
              <p className={styles.tagline}>
                {translate({
                  id: 'footer.tagline',
                  message: 'Деплой сайтов и приложений из Git, терминала или AI-агента.',
                })}
              </p>
              <div className={styles.tools}>
                <SystemStatus />
                <div className={styles.links}>
                  <GitHubLink />
                  <GitVerseLink />
                  <TelegramLink />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.columns}>
            {columns.map((column, i) => (
              <Column key={i} column={column} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
