/**
 * Вставляет <IntroHero /> на стартовую страницу доков — после заголовка и
 * вводного абзаца, перед первым разделом.
 *
 * Почему плагин, а не строка в intro.md. Исходник страницы отдаётся агентам
 * как есть (`/index.md`, scripts/export-md.py), и JSX-тег в нём был бы
 * мусором для читателя Markdown. Плагин работает только при сборке HTML,
 * исходник остаётся чистым Markdown. Сам компонент зарегистрирован в
 * src/theme/MDXComponents.tsx.
 */
const INTRO = /(^|\/)(docs|current)\/intro\.mdx?$/;

export default function remarkIntroHero() {
  return (tree, file) => {
    const path = String(file.path || (file.history && file.history[0]) || '').replace(/\\/g, '/');
    if (!INTRO.test(path)) return;
    const nodes = tree.children;
    const h1 = nodes.findIndex((n) => n.type === 'heading' && n.depth === 1);
    if (h1 < 0) return;
    const lead = nodes.findIndex((n, i) => i > h1 && n.type === 'paragraph');
    nodes.splice(lead >= 0 ? lead + 1 : h1 + 1, 0, {
      type: 'mdxJsxFlowElement',
      name: 'IntroHero',
      attributes: [],
      children: [],
    });
  };
}
