/**
 * Штатные MDX-компоненты плюс IntroHero — его на стартовую страницу ставит
 * src/plugins/remark-intro-hero.mjs (в исходнике intro.md тега нет).
 */
import MDXComponents from '@theme-original/MDXComponents';
import IntroHero from '@site/src/components/IntroHero';

export default {
  ...MDXComponents,
  IntroHero,
};
