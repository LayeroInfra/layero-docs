/**
 * Подвал статьи: штатный подвал Docusaurus (дата правки, «Отредактировать»)
 * плюс строка «нашли неточность» и ссылка на Markdown-копию страницы в <head>.
 *
 * Зачем (core/docs/DOCS-FEEDBACK.md): врезка для агентов живёт только в
 * Markdown-копиях, а большинство агентов читают обычную HTML-страницу и о
 * копии не знают. За первые сутки сбора — ноль настоящих отчётов. Здесь:
 *  * `<link rel="alternate" type="text/markdown">` — агент, читающий HTML,
 *    находит короткую Markdown-версию страницы (с врезкой);
 *  * видимая строка — для людей и для агентов одинаково. Скрытого текста для
 *    агентов здесь нет и не будет: поисковики считают его манипуляцией.
 *
 * Обёртка, а не замена: у DocItem/Footer нет пометки «безопасно заменять»,
 * поэтому штатный подвал рисуется как есть, а наше идёт рядом.
 */
import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Footer from '@theme-original/DocItem/Footer';
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

export default function FooterWrapper(): ReactNode {
  const {metadata} = useDoc();
  const {siteConfig} = useDocusaurusContext();
  const mdPath = markdownPath(metadata.permalink);
  const rules = useBaseUrl('/agents/feedback.md');
  const support = useBaseUrl('/support');
  const onRulesPage = metadata.permalink.replace(/\/+$/, '').endsWith(FEEDBACK_SUFFIX);

  return (
    <>
      <Head>
        <link rel="alternate" type="text/markdown" href={`${siteConfig.url}${mdPath}`} />
      </Head>
      <Footer />
      {!onRulesPage && (
        <p className={styles.report}>
          <Translate id="docItem.report.lead">Нашли неточность?</Translate>{' '}
          <Link to={support}>
            <Translate id="docItem.report.support">Напишите в поддержку</Translate>
          </Link>
          <span className={styles.sep} aria-hidden="true">·</span>
          <Translate id="docItem.report.agents">AI‑агентам:</Translate>{' '}
          {/* Файл, а не страница: мимо клиентского роутера. */}
          <a href={rules}>
            <Translate id="docItem.report.rules">правила отчёта об ошибке</Translate>
          </a>
          <span className={styles.sep} aria-hidden="true">·</span>
          <a href={mdPath}>
            <Translate id="docItem.report.markdown">эта страница в Markdown</Translate>
          </a>
        </p>
      )}
    </>
  );
}
