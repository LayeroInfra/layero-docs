/**
 * Подвал статьи: одна карточка вместо штатной строки Docusaurus и отдельной
 * строки «нашли неточность».
 *
 *  * Верх — для людей: «Нашли неточность?», дата обновления и две кнопки —
 *    написать в поддержку и предложить правку (бывшее «Отредактировать эту
 *    страницу», ведёт на GitHub).
 *  * Низ — для агентов, под тонкой линией: Markdown-копия страницы и правила
 *    отчёта об ошибке. Видно всем: скрытого текста для агентов здесь нет и не
 *    будет — поисковики считают его манипуляцией.
 *  * В <head> — `<link rel="alternate" type="text/markdown">`: агент, читающий
 *    HTML, находит короткую Markdown-версию страницы (с врезкой).
 *
 * Зачем (core/docs/DOCS-FEEDBACK.md): врезка для агентов живёт только в
 * Markdown-копиях, а большинство агентов читают обычную HTML-страницу.
 *
 * Штатный подвал больше не рисуется: дату и ссылку на правку берём из тех же
 * метаданных (`editUrl`, `lastUpdatedAt`), теги — штатным TagsListInline.
 */
import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import TagsListInline from '@theme/TagsListInline';
import styles from './styles.module.css';

/** Адрес Markdown-копии так же, как его строит scripts/export-md.py. */
function markdownPath(permalink: string): string {
  const path = permalink.replace(/\/+$/, '');
  if (path === '' || path === '/en') {
    return `${path}/index.md`;
  }
  return `${path}.md`;
}

const FEEDBACK_SUFFIX = '/agents/feedback';

function Glyph({d}: {d: ReactNode}): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

const CHAT = <path d="M4 5h16v11H9l-5 4z" />;
const PENCIL = <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>;
const AGENT = (
  <>
    <path d="M12 3.5 13.8 9 19.5 10.5 13.8 12 12 17.5 10.2 12 4.5 10.5 10.2 9z" />
    <path d="M18.5 16v4M16.5 18h4" />
  </>
);

export default function FooterWrapper(): ReactNode {
  const {metadata} = useDoc();
  const {siteConfig, i18n} = useDocusaurusContext();
  const mdPath = markdownPath(metadata.permalink);
  const rules = useBaseUrl('/agents/feedback.md');
  const support = useBaseUrl('/support');
  const onRulesPage = metadata.permalink.replace(/\/+$/, '').endsWith(FEEDBACK_SUFFIX);
  const {editUrl, lastUpdatedAt, tags} = metadata;
  // Часовой пояс фиксирован: дата одна и та же при сборке и в браузере.
  const updated = lastUpdatedAt
    ? new Intl.DateTimeFormat(i18n.currentLocale, {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
      }).format(new Date(lastUpdatedAt))
    : null;

  return (
    <>
      <Head>
        <link rel="alternate" type="text/markdown" href={`${siteConfig.url}${mdPath}`} />
      </Head>
      {tags.length > 0 && (
        <div className={styles.tags}>
          <TagsListInline tags={tags} />
        </div>
      )}
      <footer className={styles.card}>
        <div className={styles.people}>
          <div className={styles.lead}>
            <span className={styles.leadTitle}>
              <Translate id="docItem.report.lead">Нашли неточность?</Translate>
            </span>
            {updated && (
              <span className={styles.updated}>
                <Translate id="docItem.report.updated" values={{date: <time dateTime={new Date(lastUpdatedAt!).toISOString()}>{updated}</time>}}>
                  {'Страница обновлена {date}'}
                </Translate>
              </span>
            )}
          </div>
          <div className={styles.actions}>
            <Link className={styles.button} to={support}>
              <Glyph d={CHAT} />
              <Translate id="docItem.report.support">Написать в поддержку</Translate>
            </Link>
            {editUrl && (
              <Link className={styles.button} href={editUrl}>
                <Glyph d={PENCIL} />
                <Translate id="docItem.report.edit">Предложить правку</Translate>
              </Link>
            )}
          </div>
        </div>
        <div className={styles.agents}>
          <span className={styles.agentsLabel}>
            <Glyph d={AGENT} />
            <Translate id="docItem.report.agents">Для AI-агентов:</Translate>
          </span>
          {/* Файлы, а не страницы: мимо клиентского роутера. */}
          <a href={mdPath}>
            <Translate id="docItem.report.markdown">эта страница в Markdown</Translate>
          </a>
          {!onRulesPage && (
            <>
              <span className={styles.sep} aria-hidden="true">·</span>
              <a href={rules}>
                <Translate id="docItem.report.rules">правила отчёта об ошибке</Translate>
              </a>
            </>
          )}
        </div>
      </footer>
    </>
  );
}
