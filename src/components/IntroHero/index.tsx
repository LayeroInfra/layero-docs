/**
 * Схема стартовой страницы: откуда приходит код → что делает Layero → что
 * получается на выходе. Так устроены вводные страницы документации
 * Vercel, Cloudflare, Supabase: читатель за секунду видит, где он и что
 * платформа делает, а не разглядывает макет интерфейса.
 *
 * Знак — тот же овал, что в фавиконке и логотипе; надпись — logo.svg /
 * logo-dark.svg, как в подвале. Цвета — токены из custom.css, обе темы
 * рисуются одной разметкой.
 *
 * Схема декоративная (aria-hidden): всё, что на ней написано, есть в тексте
 * страницы ниже. Живые — только кнопки под ней.
 */
import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type IconName =
  | 'git' | 'terminal' | 'agent' | 'globe' | 'branch' | 'domain' | 'database'
  | 'build' | 'verify' | 'publish';

const ICONS: Record<IconName, ReactNode> = {
  build: (
    <>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </>
  ),
  verify: (
    <>
      <path d="M12 3 19 6v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  publish: (
    <>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
    </>
  ),
  git: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <path d="M6 8.5v7M18 10.5c0 4-6 3-11 6" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="m7 10 3 2.5L7 15M12.5 15H17" />
    </>
  ),
  agent: (
    <>
      <path d="M12 3.5 13.8 9 19.5 10.5 13.8 12 12 17.5 10.2 12 4.5 10.5 10.2 9z" />
      <path d="M18.5 16v4M16.5 18h4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  branch: (
    <>
      <circle cx="6" cy="5.5" r="2.5" />
      <circle cx="6" cy="18.5" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="M6 8v8M18 16V11a3 3 0 0 0-3-3h-4" />
      <path d="m13 5.5-2.5 2.5 2.5 2.5" />
    </>
  ),
  domain: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" />
      <path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13" />
      <path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" />
    </>
  ),
};

function Icon({name}: {name: IconName}): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

/** Знак Layero — овал из логотипа. */
function Mark(): ReactNode {
  return (
    <svg viewBox="12 34 76 32" width="30" height="13" fill="currentColor">
      <path fillRule="evenodd" d="M12 49.9524C12 45.0472 14.9374 41.1569 20.8123 38.2815C26.7212 35.4272 35.0411 34 45.7721 34L54.2788 34C65.0098 34 73.3128 35.4272 79.1877 38.2815C85.0626 41.1569 88 45.0578 88 49.9841C88 54.9105 85.0626 58.8114 79.1877 61.6868C73.3128 64.5623 65.0268 66 54.3298 66H45.7721C35.0411 66 26.7212 64.5517 20.8123 61.6551C14.9374 58.7585 12 54.8576 12 49.9524ZM26.5684 49.9841C26.5684 51.9927 27.9777 53.515 30.7962 54.551C33.6488 55.6082 37.8427 56.1368 43.378 56.1368H56.6729C62.2082 56.1368 66.3852 55.6188 69.2038 54.5828C72.0223 53.5467 73.4316 52.0139 73.4316 49.9841C73.4316 47.9756 72.0223 46.4533 69.2038 45.4172C66.3852 44.3812 62.2082 43.8632 56.6729 43.8632L43.378 43.8632C37.8427 43.8632 33.6488 44.3812 30.7962 45.4172C27.9777 46.4744 26.5684 47.9967 26.5684 49.9841Z" />
    </svg>
  );
}

type Row = {icon: IconName; title: ReactNode; sub: ReactNode};

function Column({rows, side}: {rows: Row[]; side: 'in' | 'out'}): ReactNode {
  return (
    <div className={`${styles.column} ${side === 'in' ? styles.columnIn : styles.columnOut}`}>
      <div className={styles.rows} style={{gridTemplateRows: `repeat(${rows.length}, 1fr)`}}>
        {rows.map((r, i) => (
          <div key={i} className={`${styles.row} ${side === 'in' ? styles.portRight : styles.portLeft}`}>
            <span className={styles.icon}>
              <Icon name={r.icon} />
            </span>
            <span className={styles.rowText}>
              <span className={styles.rowTitle}>{r.title}</span>
              <span className={styles.rowSub}>{r.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Линии в духе схем Cloudflare: от каждого узла короткий отвод к общей
 *  шине, шина — к узлу Layero. Только прямые углы, без анимации.
 *  Строки — ряды 1fr, поэтому центр i-й строки — (2i+1)/2N высоты. */
function Wires({count, side}: {count: number; side: 'in' | 'out'}): ReactNode {
  const ys = Array.from({length: count}, (_, i) => ((2 * i + 1) / (2 * count)) * 100);
  // На телефоне схема идёт сверху вниз: источники — ряд из трёх плиток,
  // результаты — сетка 2×2. Центры плиток: (2i+1)/2N ширины ряда.
  const cols = side === 'in' ? count : 2;
  const xs = Array.from({length: cols}, (_, i) => ((2 * i + 1) / (2 * cols)) * 100);
  const h = side === 'in'
    ? [...ys.map((y) => `M0 ${y} H50`), `M50 ${ys[0]} V${ys[ys.length - 1]}`, 'M50 50 H100']
    : ['M0 50 H50', `M50 ${ys[0]} V${ys[ys.length - 1]}`, ...ys.map((y) => `M50 ${y} H100`)];
  const v = side === 'in'
    ? [...xs.map((x) => `M${x} 0 V50`), `M${xs[0]} 50 H${xs[xs.length - 1]}`, 'M50 50 V100']
    : ['M50 0 V50', `M${xs[0]} 50 H${xs[xs.length - 1]}`, ...xs.map((x) => `M${x} 50 V100`)];
  return (
    <div className={`${styles.wires} ${side === 'in' ? styles.wiresIn : styles.wiresOut}`}>
      <svg className={styles.wiresH} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className={styles.wire} d={h.join(' ')} />
      </svg>
      <svg className={styles.wiresV} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className={styles.wire} d={v.join(' ')} />
      </svg>
    </div>
  );
}

const SOURCES: Row[] = [
  {
    icon: 'git',
    title: <Translate id="introHero.src.repo">Репозиторий</Translate>,
    sub: <Translate id="introHero.src.repoSub">GitHub, GitVerse и другие</Translate>,
  },
  {
    icon: 'terminal',
    title: <Translate id="introHero.src.cli">Папка и CLI</Translate>,
    sub: <Translate id="introHero.src.cliSub">без Git, одной командой</Translate>,
  },
  {
    icon: 'agent',
    title: <Translate id="introHero.src.agent">AI-агент</Translate>,
    sub: 'Claude Code, Codex, Cursor',
  },
];

const RESULTS: Row[] = [
  {
    icon: 'globe',
    title: 'shop.layero.app',
    sub: <Translate id="introHero.out.main">основной адрес</Translate>,
  },
  {
    icon: 'branch',
    title: 'shop-cart.layero.app',
    sub: <Translate id="introHero.out.preview">превью ветки</Translate>,
  },
  {
    icon: 'domain',
    title: 'shop.ru',
    sub: <Translate id="introHero.out.domain">свой домен</Translate>,
  },
  {
    icon: 'database',
    title: 'Postgres',
    sub: <Translate id="introHero.out.db">база и Data API</Translate>,
  },
];

/** Узел Layero: тёмная плитка со знаком и логотипом и тремя этапами —
 *  одинаковыми ячейками, ни один не выделен. Плитка в цвете `--ink`,
 *  в тёмной теме она светлая — и логотип на ней берётся противоположный теме. */
function Core(): ReactNode {
  return (
    <div className={styles.coreWrap}>
      <div className={styles.core}>
        <div className={styles.coreHead}>
          <span className={styles.markTile}>
            <Mark />
          </span>
          <ThemedImage
            className={styles.wordmark}
            alt=""
            sources={{light: useBaseUrl('/img/logo-dark.svg'), dark: useBaseUrl('/img/logo.svg')}}
          />
        </div>
        <ul className={styles.steps}>
          <li>
            <Icon name="build" />
            <Translate id="introHero.step.build">Сборка</Translate>
          </li>
          <li>
            <Icon name="verify" />
            <Translate id="introHero.step.verify">Проверка</Translate>
          </li>
          <li>
            <Icon name="publish" />
            <Translate id="introHero.step.publish">Публикация</Translate>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function IntroHero(): ReactNode {
  return (
    <div className={styles.hero}>
      <div className={styles.diagram} aria-hidden="true">
        <Column side="in" rows={SOURCES} />
        <Wires side="in" count={SOURCES.length} />
        <div className={styles.center}>
          <Core />
        </div>
        <Wires side="out" count={RESULTS.length} />
        <Column side="out" rows={RESULTS} />
      </div>
      <div className={styles.cta}>
        <Link className={`${styles.button} ${styles.primary}`} to="/getting-started/quickstart">
          <Translate id="introHero.cta.quickstart">Опубликовать первый сайт</Translate>
        </Link>
        <Link className={`${styles.button} ${styles.secondary}`} to="/agents/install">
          <Translate id="introHero.cta.agents">Подключить AI-агента</Translate>
        </Link>
      </div>
    </div>
  );
}
