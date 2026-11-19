/**
 * Страница 404 документации (19.11.2026).
 *
 * Стандартная говорила «Page Not Found» и просила написать владельцу сайта,
 * который дал ссылку, — читателю доков это ничего не даёт. Здесь: что могло
 * случиться, поиск, главные разделы и куда сообщить о битой ссылке.
 *
 * Заменяем только NotFound/Content: шапка, подвал и заголовок вкладки
 * остаются стандартными. Тексты — через <Translate>, английские лежат в
 * i18n/en/code.json под теми же id. Свои id, а не theme.NotFound.*: у тех в
 * русской локали есть готовый перевод темы, и он перекрыл бы наш текст.
 */
import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import type {Props} from '@theme/NotFound/Content';
import styles from './styles.module.css';

type Section = {to: string; id: string; label: string};

const SECTIONS: Section[] = [
  {to: '/getting-started/quickstart', id: 'notFound.link.quickstart', label: 'Первый сайт'},
  {to: '/getting-started/frameworks', id: 'notFound.link.frameworks', label: 'Фреймворки'},
  {to: '/cli/deploy', id: 'notFound.link.deploy', label: 'Деплой из папки через CLI'},
  {to: '/deploys/custom-domains', id: 'notFound.link.domains', label: 'Свой домен'},
  {to: '/database', id: 'notFound.link.database', label: 'Базы данных'},
  {to: '/agents/', id: 'notFound.link.agents', label: 'AI-агенты'},
];

export default function NotFoundContent({className}: Props): ReactNode {
  return (
    <main className={clsx('container margin-vert--xl', className)}>
      <div className="row">
        <div className={clsx('col col--6 col--offset-3', styles.text)}>
          <Heading as="h1" className="hero__title">
            <Translate id="notFound.title">
              Такой страницы нет
            </Translate>
          </Heading>
          <p>
            <Translate id="notFound.p1">
              Возможно, её перенесли или в адресе опечатка. Найдите нужное через поиск вверху страницы или откройте один из разделов.
            </Translate>
          </p>
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.to}>
                <Link to={s.to}>
                  <Translate id={s.id}>{s.label}</Translate>
                </Link>
              </li>
            ))}
          </ul>
          <p>
            <Translate
              id="notFound.p2"
              values={{
                support: (
                  <Link to="/support">
                    <Translate id="notFound.supportLink">напишите в поддержку</Translate>
                  </Link>
                ),
              }}>
              {'Если вы пришли сюда по ссылке из панели, CLI или с нашего сайта, {support} — мы поправим ссылку.'}
            </Translate>
          </p>
          <p>
            <Link className="button button--primary" to="/">
              <Translate id="notFound.home">К началу документации</Translate>
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
