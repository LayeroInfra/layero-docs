#!/usr/bin/env python3
"""Команды установки на странице «Подключить агента» ↔ agents-install.json.

Зачем. Установочные команды жили на шести поверхностях (лендинг, llms.txt,
доки ru/en, панель, README плагина) и разъехались: имя репозитория
`layero-claude`/`layero-agents`, пропущенный `marketplace add`, разные флаги
Codex. Аудит 17.09.2026 нашёл четыре разных рецепта для одного клиента.

Теперь канон один — `agents-install.json` в корне репозитория (копия файла из
`LayeroInfra/layero-agents`; совпадение копий сверяет `check-surfaces.py`
там). Таблица на странице генерируется отсюда между маркерами
`{/* agents-install:begin */}` … `{/* agents-install:end */}` (HTML-комментарии MDX не принимает) и руками не
правится.

Запуск:
    python3 scripts/check-agents-install.py           # сверка, входит в make check
    python3 scripts/check-agents-install.py --write   # перегенерировать блоки
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANON = ROOT / "agents-install.json"

PAGES = {
    "ru": ROOT / "docs/agents/install.md",
    "en": ROOT / "i18n/en/docusaurus-plugin-content-docs/current/agents/install.md",
}

TEXT = {
    "ru": {
        "mcp": "MCP-сервер: `{url}` (транспорт `{transport}`, имя `{name}`).",
        "repo": "Репозиторий навыка: [`{repo}`](https://github.com/{repo}).",
        "head": "| Клиент | Команда |",
        "deeplink": " — или [кнопка установки]({deeplink})",
        "ci": "В CI: `{command}`",
        "labels": {},
    },
    "en": {
        "mcp": "MCP server: `{url}` (transport `{transport}`, name `{name}`).",
        "repo": "Skill repository: [`{repo}`](https://github.com/{repo}).",
        "head": "| Client | Command |",
        "deeplink": " — or the [install button]({deeplink})",
        "ci": "In CI: `{command}`",
        # Единственный русский лейбл в каноне. Остальные — имена продуктов.
        "labels": {"Любой агент": "Any agent"},
    },
}

BEGIN = "{/* agents-install:begin */}"
END = "{/* agents-install:end */}"


def render(canon: dict, lang: str) -> str:
    t = TEXT[lang]
    lines = [
        t["mcp"].format(**canon["mcp"]),
        t["repo"].format(repo=canon["skills_repo"]),
        "",
        t["head"],
        "|---|---|",
    ]
    for c in canon["clients"]:
        label = t["labels"].get(c["label"], c["label"])
        cell = f"`{c['command']}`"
        if c.get("deeplink"):
            cell += t["deeplink"].format(deeplink=c["deeplink"])
        lines.append(f"| {label} | {cell} |")
    lines += ["", t["ci"].format(command=canon["ci"]["command"])]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="перегенерировать блоки на страницах")
    args = ap.parse_args()

    canon = json.loads(CANON.read_text(encoding="utf-8"))
    failures = 0
    for lang, page in PAGES.items():
        if not page.is_file():
            print(f"  ✗ нет страницы {page.relative_to(ROOT)}")
            failures += 1
            continue
        text = page.read_text(encoding="utf-8")
        m = re.search(re.escape(BEGIN) + r"\n(.*?)\n" + re.escape(END), text, re.S)
        if not m:
            print(f"  ✗ {page.relative_to(ROOT)}: нет маркеров {BEGIN} … {END}")
            failures += 1
            continue
        want = render(canon, lang)
        if m.group(1) == want:
            print(f"  ✓ {page.relative_to(ROOT)}")
            continue
        if args.write:
            page.write_text(text[: m.start(1)] + want + text[m.end(1):], encoding="utf-8")
            print(f"  ✎ {page.relative_to(ROOT)}: блок перегенерирован")
            continue
        print(f"  ✗ {page.relative_to(ROOT)}: таблица расходится с agents-install.json")
        failures += 1

    if failures:
        print(
            "\nWHAT: команды установки на странице не совпадают с agents-install.json.\n"
            "WHY:  канон команд один — этот файл; страница генерируется из него.\n"
            "FIX:  правьте agents-install.json (и его копию в layero-agents), затем\n"
            "      python3 scripts/check-agents-install.py --write"
        )
        return 1
    print("команды установки совпадают с agents-install.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
