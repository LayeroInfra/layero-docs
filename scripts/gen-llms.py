#!/usr/bin/env python3
"""Собирает llms.txt для обеих локалей из УЖЕ СОБРАННОГО сайта.

Зачем именно так, а не статическим файлом.

1. На `docs.layero.ru/llms.txt` месяцами лежала побайтовая копия файла с
   лендинга: ассистент, читавший его на сайте документации, получал продуктовый
   питч и ноль ссылок на доки — при том что документация это крупнейшая
   контентная поверхность (114 адресов в двух локалях).

2. Когда 28.07 я заменил его на файл про документацию, положив в `static/`,
   Docusaurus скопировал его в сборку КАЖДОЙ локали — и по адресу
   `/en/llms.txt` оказался русский текст. То есть статический файл в принципе
   не умеет быть разным для локалей, и любая правка ломает одну из них.

3. Заголовки и описания берутся из собранных страниц, поэтому расходиться с
   сайтом им неоткуда. Ровно тот класс ошибок — «текст описывает то, чего на
   странице уже нет» — весь день 28.07 был главным источником дефектов.

Запуск: python3 scripts/gen-llms.py [--build build]
Вызывается из deploy.sh ПОСЛЕ `npm run build`.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

SKIP_DIRS = {"category", "search", "assets", "img", "_layero"}
SKIP_PAGES = {"blog/archive", "blog/authors", "blog/tags", "search"}

# Разделы берутся из `_category_.json` каждого каталога docs/ — порядок по
# `position`, подпись по `label`; для en подпись берётся из
# i18n/en/.../current.json (ключ `sidebar.docsSidebar.category.<label>`), а
# при её отсутствии — из `_category_.json` той же локали. Ручного списка
# больше нет: пока он был, data-api и database (10 страниц) не попадали в
# индекс ровно потому, что список не обновили (аудит AX 17.09.2026).
DOCS_DIR = Path(__file__).resolve().parents[1] / "docs"
I18N_EN = Path(__file__).resolve().parents[1] / "i18n/en/docusaurus-plugin-content-docs"


def sections(lang: str) -> list[tuple[str, str]]:
    out: list[tuple[int, str, str]] = []
    en_labels: dict[str, str] = {}
    if lang == "en":
        cj = I18N_EN / "current.json"
        if cj.is_file():
            for k, v in json.loads(cj.read_text(encoding="utf-8")).items():
                pre = "sidebar.docsSidebar.category."
                if k.startswith(pre) and ".link." not in k:
                    en_labels[k[len(pre):]] = v["message"]
    for cat in sorted(DOCS_DIR.glob("*/_category_.json")):
        meta = json.loads(cat.read_text(encoding="utf-8"))
        key = cat.parent.name
        label = meta.get("label", key)
        # Раздел с generated-index живёт по slug (например /deploys), а без
        # него — по /category/<slug из label>; страницы же всегда под key/.
        if lang == "en":
            en_cat = I18N_EN / "current" / key / "_category_.json"
            if label in en_labels:
                label = en_labels[label]
            elif en_cat.is_file():
                label = json.loads(en_cat.read_text(encoding="utf-8")).get("label", label)
        out.append((int(meta.get("position", 999)), key, label))
    return [(k, l) for _, k, l in sorted(out)]


HEAD_RU = """# Документация Layero

> Layero — платформа деплоя фронтенда и фуллстек-приложений с серверами в
> России. Здесь собрана документация: как AI-агент работает с Layero (навык,
> MCP, CLI в JSON-режиме), деплой из репозитория (GitHub, GitVerse, GitLab,
> GitFlic, SourceCraft), окружения и превью, runtime-приложения, базы данных
> и Data API, домены, тарифы. О самом продукте — https://layero.ru/llms.txt

Каждая страница отдаётся и как Markdown: добавьте `.md` к адресу
(например https://docs.layero.ru/cli/agents.md). Список страниц с описаниями —
https://docs.layero.ru/sitemap.md

Английская версия: https://docs.layero.ru/en/llms.txt
"""

HEAD_EN = """# Layero documentation

> Layero is a deployment platform for frontend and full-stack sites, with build
> servers in Russia. This file indexes the documentation: how an AI agent works
> with Layero (the skill, MCP, the CLI in JSON mode), deploying from a
> repository (GitHub, GitVerse, GitLab, GitFlic, SourceCraft), environments and
> previews, runtime apps, databases and the Data API, domains, plans. For the
> product itself, see https://layero.ru/llms.txt

Every page is also served as Markdown: append `.md` to the address
(for example https://docs.layero.ru/en/cli/agents.md). The list of pages with
descriptions: https://docs.layero.ru/en/sitemap.md

Russian version: https://docs.layero.ru/llms.txt
"""


def collect(root: Path, base_url: str) -> dict[str, tuple[str, str]]:
    """{относительный путь: (заголовок, описание)} по собранным index.html."""
    pages: dict[str, tuple[str, str]] = {}
    for f in root.rglob("index.html"):
        rel = str(f.parent.relative_to(root))
        if rel == "." or rel.split("/")[0] in SKIP_DIRS or rel in SKIP_PAGES:
            continue
        # Английская сборка лежит внутри русской — её обходим отдельным вызовом.
        if root.name != "en" and rel.split("/")[0] == "en":
            continue
        raw = f.read_text(encoding="utf-8", errors="ignore")
        m = re.search(r"<title[^>]*>(.*?)</title>", raw, re.S)
        if not m:
            continue
        title = html.unescape(m.group(1)).split("|")[0].strip()
        d = re.search(r'<meta[^>]*name=description[^>]*content="([^"]*)"', raw) or \
            re.search(r"<meta[^>]*name=description[^>]*content='([^']*)'", raw)
        pages[rel] = (title, html.unescape(d.group(1)).strip() if d else "")
    return pages


def render(pages: dict[str, tuple[str, str]], sections, head: str, base_url: str,
           other_label: str) -> str:
    out = [head.rstrip(), ""]
    used: set[str] = set()
    for key, human in sections:
        rows = [(p, v) for p, v in sorted(pages.items())
                if p == key or p.startswith(key + "/")]
        if not rows:
            continue
        out += [f"## {human}", ""]
        for p, (title, desc) in rows:
            used.add(p)
            tail = f": {desc}" if desc else ""
            out.append(f"- [{title}]({base_url}{p}/){tail}")
        out.append("")
    rest = [(p, v) for p, v in sorted(pages.items())
            if p not in used and not p.startswith("blog")]
    if rest:
        out += [f"## {other_label}", ""]
        for p, (title, desc) in rest:
            tail = f": {desc}" if desc else ""
            out.append(f"- [{title}]({base_url}{p}/){tail}")
        out.append("")
    return "\n".join(out).rstrip() + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", default="build")
    args = ap.parse_args()
    build = Path(args.build)
    if not build.is_dir():
        print(f"нет каталога сборки: {build}", file=sys.stderr)
        return 2

    ru = render(collect(build, "https://docs.layero.ru/"), sections("ru"), HEAD_RU,
                "https://docs.layero.ru/", "Прочее")
    (build / "llms.txt").write_text(ru, encoding="utf-8")
    print(f"  build/llms.txt: {len(ru.encode())} б, ссылок {ru.count('- [')}")

    en_dir = build / "en"
    if en_dir.is_dir():
        en = render(collect(en_dir, "https://docs.layero.ru/en/"), sections("en"),
                    HEAD_EN, "https://docs.layero.ru/en/", "Other")
        (en_dir / "llms.txt").write_text(en, encoding="utf-8")
        print(f"  build/en/llms.txt: {len(en.encode())} б, ссылок {en.count('- [')}")
    else:
        print("  ⚠ build/en отсутствует — английский llms.txt не собран")
    return 0


if __name__ == "__main__":
    sys.exit(main())
