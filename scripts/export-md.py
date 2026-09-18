#!/usr/bin/env python3
"""Кладёт в сборку исходный Markdown каждой страницы и карту сайта sitemap.md.

Зачем. Агент, читающий документацию, получает от `/cli/agents/` HTML на
сотни килобайт с навигацией и скриптами, из которого текст ещё надо
выпарить. Тот же адрес с `.md` на конце — `/cli/agents.md` — отдаёт исходник
страницы как есть: заголовки, таблицы, код. Это принятый способ (Vercel,
Cloudflare, Mintlify отдают `.md` рядом с HTML), и `llms.txt` на него
ссылается.

Что делает. Для каждого `.md`/`.mdx` в `docs/` (ru) и `i18n/en/.../current/`
(en) вычисляет маршрут так же, как Docusaurus: `slug` из frontmatter, иначе
путь без расширения; `index` и `README` → каталог. Фронтматтер срезается,
вместо него — заголовок и описание первой строкой. Результат —
`build/<route>.md` и `build/en/<route>.md`. Маршрут сверяется с собранным
`index.html`: страница без HTML (например, `README.md`-заглушки без
содержимого) не экспортируется — отдавать текст того, чего нет на сайте,
нельзя.

Оглавления разделов. У каталога с `link: generated-index` в `_category_.json`
(`/cli`, `/runtime`, `/deploys`…) исходника нет — страницу рисует Docusaurus.
`llms.txt` на такие адреса ссылается, и `/runtime.md` отдавал 404. Для них
Markdown собирается из того же, из чего собрана страница: подпись и описание
раздела плюс список его страниц.

Плюс `build/sitemap.md` и `build/en/sitemap.md`: список страниц с
описаниями из frontmatter, по разделам.

Запуск: python3 scripts/export-md.py [--build build]
Вызывается из deploy.sh ПОСЛЕ `npm run build`.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "ru": (ROOT / "docs", ""),
    "en": (ROOT / "i18n/en/docusaurus-plugin-content-docs/current", "en"),
}
# Отдельные страницы вне docs/ (`/contacts`): llms.txt перечисляет и их.
PAGES = {
    "ru": ROOT / "src/pages",
    "en": ROOT / "i18n/en/docusaurus-plugin-content-pages",
}
BASE = "https://docs.layero.ru"

FM_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n?", re.S)


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    m = FM_RE.match(text)
    if not m:
        return {}, text
    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        if ":" not in line or line.startswith((" ", "\t")):
            continue
        k, _, v = line.partition(":")
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        meta[k.strip()] = v
    return meta, text[m.end():]


def route_for(rel: Path, meta: dict[str, str]) -> str:
    slug = meta.get("slug")
    if slug:
        return slug.strip("/")
    parts = list(rel.with_suffix("").parts)
    if parts and parts[-1].lower() in ("index", "readme"):
        parts = parts[:-1]
    return "/".join(parts)


def export(lang: str, build: Path) -> tuple[int, list[tuple[str, str, str, str]]]:
    src, prefix = SOURCES[lang]
    out_root = build / prefix if prefix else build
    written = 0
    pages: list[tuple[str, str, str, str]] = []  # (section, route, title, description)
    files = [(f, src) for f in sorted(src.rglob("*"))]
    if PAGES[lang].is_dir():
        files += [(f, PAGES[lang]) for f in sorted(PAGES[lang].rglob("*"))]
    for f, base in files:
        if f.suffix not in (".md", ".mdx"):
            continue
        # README.md в каталогах — заглушки GitBook («# cli»), Docusaurus их не
        # показывает: маршрут каталога занят generated-index. Экспорт отдал бы
        # вместо оглавления раздела одно слово.
        if f.name.lower() == "readme.md":
            continue
        rel = f.relative_to(base)
        raw = f.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw)
        route = route_for(rel, meta)
        html = out_root / route / "index.html" if route else out_root / "index.html"
        if not html.is_file():
            continue
        title = meta.get("title") or next(
            (l[2:].strip() for l in body.splitlines() if l.startswith("# ")), route or "/"
        )
        desc = meta.get("description", "")
        head = f"# {title}\n\n" if not body.lstrip().startswith("# ") else ""
        if desc:
            head += f"> {desc}\n\n"
        head += f"<!-- {BASE}/{prefix + '/' if prefix else ''}{route + '/' if route else ''} -->\n\n"
        target = (out_root / (route + ".md")) if route else (out_root / "index.md")
        target.parent.mkdir(parents=True, exist_ok=True)
        # Маркеры генератора `{/* … */}` — служебные, читателю не нужны.
        body = re.sub(r"^\{/\*.*?\*/\}\n?", "", body, flags=re.M | re.S)
        target.write_text(head + body.lstrip("\n"), encoding="utf-8")
        written += 1
        section = rel.parts[0] if len(rel.parts) > 1 else ""
        pages.append((section, route, title, desc))
    return written, pages


def section_labels(lang: str) -> dict[str, str]:
    labels: dict[str, str] = {}
    for cat in (ROOT / "docs").glob("*/_category_.json"):
        labels[cat.parent.name] = json.loads(cat.read_text(encoding="utf-8")).get("label", cat.parent.name)
    if lang == "en":
        cj = ROOT / "i18n/en/docusaurus-plugin-content-docs/current.json"
        en = {k[len("sidebar.docsSidebar.category."):]: v["message"]
              for k, v in json.loads(cj.read_text(encoding="utf-8")).items()
              if k.startswith("sidebar.docsSidebar.category.") and ".link." not in k}
        for key, label in list(labels.items()):
            en_cat = ROOT / "i18n/en/docusaurus-plugin-content-docs/current" / key / "_category_.json"
            if label in en:
                labels[key] = en[label]
            elif en_cat.is_file():
                labels[key] = json.loads(en_cat.read_text(encoding="utf-8")).get("label", label)
    return labels


def category_meta(lang: str) -> dict[str, tuple[str, str, str]]:
    """{каталог: (маршрут, подпись, описание)} для разделов с generated-index."""
    en: dict[str, str] = {}
    if lang == "en":
        cj = ROOT / "i18n/en/docusaurus-plugin-content-docs/current.json"
        en = {k: v["message"] for k, v in json.loads(cj.read_text(encoding="utf-8")).items()}
    labels = section_labels(lang)
    out: dict[str, tuple[str, str, str]] = {}
    for cat in (ROOT / "docs").glob("*/_category_.json"):
        meta = json.loads(cat.read_text(encoding="utf-8"))
        link = meta.get("link") or {}
        if link.get("type") != "generated-index" or not link.get("slug"):
            continue
        key = cat.parent.name
        desc = link.get("description", "")
        if lang == "en":
            desc = en.get(
                f"sidebar.docsSidebar.category.{meta.get('label', key)}.link.generated-index.description",
                desc)
        out[key] = (link["slug"].strip("/"), labels.get(key, key), desc)
    return out


def export_category_indexes(lang: str, build: Path,
                            pages: list[tuple[str, str, str, str]]) -> int:
    prefix = SOURCES[lang][1]
    out_root = build / prefix if prefix else build
    written = 0
    taken = {r for _, r, _, _ in pages}
    for key, (route, label, desc) in sorted(category_meta(lang).items()):
        target = out_root / (route + ".md")
        # Маршрут занят настоящей страницей (index.md со slug) — её и оставляем.
        # Сверка по списку экспорта, а не по диску: иначе повторный прогон по
        # той же сборке принимал бы собственный прошлый файл за страницу.
        if route in taken or not (out_root / route / "index.html").is_file():
            continue
        url = f"{BASE}/{prefix + '/' if prefix else ''}"
        lines = [f"# {label}", ""]
        if desc:
            lines += [f"> {desc}", ""]
        lines += [f"<!-- {url}{route}/ -->", ""]
        for section, r, title, d in sorted(pages):
            if section != key:
                continue
            tail = f": {d}" if d else ""
            lines.append(f"- [{title}]({url}{r}/){tail}")
        target.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
        written += 1
    return written


def positions() -> dict[str, float]:
    pos: dict[str, float] = {}
    for cat in (ROOT / "docs").glob("*/_category_.json"):
        pos[cat.parent.name] = float(json.loads(cat.read_text(encoding="utf-8")).get("position", 999))
    return pos


def write_sitemap(lang: str, build: Path, pages: list[tuple[str, str, str, str]]) -> Path:
    prefix = SOURCES[lang][1]
    out_root = build / prefix if prefix else build
    labels = section_labels(lang)
    pos = positions()
    head = ("# Карта документации Layero\n\nКаждая страница доступна и как Markdown — тот же адрес с `.md` на конце.\n"
            if lang == "ru" else
            "# Layero documentation map\n\nEvery page is also available as Markdown — the same address with `.md` appended.\n")
    lines = [head]
    by_section: dict[str, list[tuple[str, str, str]]] = {}
    for section, route, title, desc in pages:
        by_section.setdefault(section, []).append((route, title, desc))
    order = sorted(by_section, key=lambda s: (pos.get(s, 0 if s == "" else 999), s))
    for section in order:
        if section:
            lines.append(f"\n## {labels.get(section, section)}\n")
        else:
            lines.append("")
        for route, title, desc in sorted(by_section[section]):
            url = f"{BASE}/{prefix + '/' if prefix else ''}{route + '/' if route else ''}"
            tail = f": {desc}" if desc else ""
            lines.append(f"- [{title}]({url}){tail}")
    target = out_root / "sitemap.md"
    target.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    return target


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", default="build")
    args = ap.parse_args()
    build = Path(args.build)
    if not build.is_dir():
        print(f"нет каталога сборки: {build}", file=sys.stderr)
        return 2
    for lang in ("ru", "en"):
        if lang == "en" and not (build / "en").is_dir():
            print("  ⚠ build/en отсутствует — английский Markdown не собран")
            continue
        n, pages = export(lang, build)
        idx = export_category_indexes(lang, build, pages)
        sm = write_sitemap(lang, build, pages)
        print(f"  {lang}: страниц .md — {n}, оглавлений разделов — {idx}, {sm.relative_to(build)}")
        if n == 0:
            print(f"  ✗ {lang}: ни одна страница не экспортирована — маршруты не совпали со сборкой", file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
