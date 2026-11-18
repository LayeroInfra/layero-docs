/**
 * Карточки на страницах-оглавлениях разделов (generated-index) и везде, где
 * в тексте стоит <DocCardList />.
 *
 * Своя версия вместо стандартной (18.11.2026): та ставила перед заголовком
 * эмодзи 📄/🗃, резала заголовок и описание в одну строку с многоточием
 * («Основные концепц…») и растягивала карточки на высоту 170 px с пустотой
 * сверху. Здесь — компактная карточка как в панели: заголовок целиком,
 * описание до трёх строк, стрелка.
 *
 * Заменяем DocCardList, а не DocCard/Layout: у DocCardList замена помечена
 * в Docusaurus как безопасная, и всё, что нужно, берётся из публичного API
 * плагина документации.
 */
import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  useCurrentSidebarSiblings,
  filterDocCardListItems,
  findFirstSidebarItemLink,
  useDocById,
} from '@docusaurus/plugin-content-docs/client';
import type {Props} from '@theme/DocCardList';
import type {
  PropSidebarItem,
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from '@docusaurus/plugin-content-docs';
import styles from './styles.module.css';

function pagesLabel(count: number, locale: string): string {
  if (locale !== 'ru') {
    return count === 1 ? '1 page' : `${count} pages`;
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'страница'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'страницы'
        : 'страниц';
  return `${count} ${word}`;
}

function Arrow(): ReactNode {
  return (
    <svg
      className={styles.arrow}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true">
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Card({
  href,
  title,
  description,
  meta,
}: {
  href: string;
  title: string;
  description?: string;
  meta?: string;
}): ReactNode {
  return (
    <Link href={href} className={styles.card}>
      <span className={styles.head}>
        <span className={styles.title}>{title}</span>
        <Arrow />
      </span>
      {description && <span className={styles.description}>{description}</span>}
      {meta && <span className={styles.meta}>{meta}</span>}
    </Link>
  );
}

function CategoryCard({item}: {item: PropSidebarItemCategory}): ReactNode {
  const {i18n} = useDocusaurusContext();
  const href = findFirstSidebarItemLink(item);
  if (!href) {
    return null;
  }
  return (
    <Card
      href={href}
      title={item.label}
      description={item.description}
      meta={pagesLabel(item.items.length, i18n.currentLocale)}
    />
  );
}

function LinkCard({item}: {item: PropSidebarItemLink}): ReactNode {
  const doc = useDocById(item.docId ?? undefined);
  return (
    <Card
      href={item.href}
      title={item.label}
      description={item.description ?? doc?.description}
    />
  );
}

function ItemCard({item}: {item: PropSidebarItem}): ReactNode {
  if (item.type === 'category') {
    return <CategoryCard item={item} />;
  }
  if (item.type === 'link') {
    return <LinkCard item={item} />;
  }
  return null;
}

function List({items, className}: {items: PropSidebarItem[]; className?: string}): ReactNode {
  const filtered = filterDocCardListItems(items);
  return (
    <section className={clsx(styles.grid, className)}>
      {filtered.map((item, index) => (
        <ItemCard key={index} item={item} />
      ))}
    </section>
  );
}

function ListForCurrentCategory({className}: Props): ReactNode {
  const items = useCurrentSidebarSiblings();
  return <List items={items} className={className} />;
}

export default function DocCardList(props: Props): ReactNode {
  if (!props.items) {
    return <ListForCurrentCategory {...props} />;
  }
  return <List items={props.items} className={props.className} />;
}
