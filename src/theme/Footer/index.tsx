/**
 * Подвал документации.
 *
 * Своя версия вместо стандартной (18.11.2026): та ставила три колонки
 * ссылок по всей ширине и строку «Built with Docusaurus» по центру — без
 * знака, без иерархии, со значком внешней ссылки у каждого второго пункта.
 *
 * Слева — знак «layero × Docusaurus» и статус систем; справа — колонки
 * ссылок на всю оставшуюся ширину, последняя — для AI-агентов; внизу —
 * копирайт.
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
            <Lockup />
            <SystemStatus />
          </div>
          <div className={styles.columns}>
            {columns.map((column, i) => (
              <Column key={i} column={column} />
            ))}
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} Layero</span>
        </div>
      </div>
    </footer>
  );
}
