/**
 * Виджет «статус систем Layero» в подвале: точка, одна фраза и ссылка на
 * status.layero.app.
 *
 * Данные — та же публичная ручка, что у самой статус-страницы:
 * GET https://api.layero.ru/public/status (без входа, CORS *, кэш 30 с;
 * core/backend/app/api/routes/public_status.py). Берём только `overall`:
 * подробности — на статус-странице, в подвале им не место.
 *
 * Состояния и их подписи — те же, что на status.layero.app
 * (core/infra/status-page/index.html, OVERALL), и тот же порядок тревоги:
 * operational < degraded < unknown < down. Ответа нет — пишем «Статус
 * систем» серым, а НЕ «Все системы работают»: молчание ручки ничего не
 * доказывает (то же правило в public_status.py: нет данных = unknown).
 *
 * Запрос — только в браузере, после отрисовки: при сборке страницы статус
 * неизвестен, а запечённый в HTML зелёный врал бы до следующей выкатки.
 */
import React, {type ReactNode, useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

const STATUS_API = 'https://api.layero.ru/public/status';
const STATUS_PAGE = 'https://status.layero.app';
const REFRESH_MS = 60_000;

type State = 'loading' | 'operational' | 'degraded' | 'down' | 'unknown';

function label(state: State): string {
  switch (state) {
    case 'operational':
      return translate({id: 'footer.status.operational', message: 'Все системы работают'});
    case 'degraded':
      return translate({id: 'footer.status.degraded', message: 'Есть ухудшения'});
    case 'down':
      return translate({id: 'footer.status.down', message: 'Есть неисправности'});
    default:
      return translate({id: 'footer.status.unknown', message: 'Статус систем'});
  }
}

export default function SystemStatus(): ReactNode {
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(STATUS_API, {headers: {Accept: 'application/json'}});
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {overall?: string};
        const overall = data.overall;
        const known: State[] = ['operational', 'degraded', 'down', 'unknown'];
        if (!cancelled) {
          setState(known.includes(overall as State) ? (overall as State) : 'unknown');
        }
      } catch {
        if (!cancelled) setState('unknown');
      }
    };
    load();
    // Подвал виден долго на длинных страницах; раз в минуту — чаще ручка
    // всё равно не обновляется (снапшот считается раз в минуту).
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Link href={STATUS_PAGE} className={styles.status} aria-live="polite">
      <span className={`${styles.statusDot} ${styles[`dot_${state}`]}`} aria-hidden="true" />
      <span>{state === 'loading' ? label('unknown') : label(state)}</span>
    </Link>
  );
}
