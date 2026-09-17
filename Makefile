.PHONY: help setup check typecheck build check-texts check-agents-install export-md serve start

help:
	@echo "layero-docs — документация → docs.layero.ru"
	@echo ""
	@echo "  make check      — типы + сборка + команды установки ↔ agents-install.json"
	@echo "  make typecheck  — tsc"
	@echo "  make build      — сборка Docusaurus, обе локали"
	@echo "  make check-texts— тексты ↔ код (проверки живут в core и mcp)"
	@echo "  make start      — локально с горячей перезагрузкой"
	@echo "  make setup      — npm ci"
	@echo ""
	@echo "  push в main выкатывает docs.layero.ru (Deploy docs); после — проверить живой адрес"

# ── Проверка ─────────────────────────────────────────────────────────────────
#
# Сборка входит в `check` намеренно и является главным здесь: Docusaurus
# падает на битой ссылке, а не предупреждает. Уронить публикацию пушем легко:
# push в main катит сразу, и красная сборка = docs.layero.ru не обновился.
#
# check-agents-install — команды установки на странице «Подключить агента»
# генерируются из agents-install.json; расхождение = отказ. Команды
# установки жили на шести поверхностях и разъехались (аудит AX 17.09.2026).
#
# Чего здесь НЕТ и почему:
#  · тестов — документация проверяется сборкой и сверкой с кодом;
#  · check-texts в `check` — проверки лежат в СОСЕДНИХ репозиториях (core,
#    mcp), и гейт docs не должен зависеть от их состояния. Цель отдельная,
#    прогонять перед выкаткой текстов;
#  · проверки живого адреса — `check` локальный. docs.layero.ru смотреть глазами.

typecheck:
	npm run typecheck

build:
	npm run build

# Кросс-репозиторные: скрипты живут в core и mcp.
check-texts:
	python3 ../core/cli/check-error-codes.py
	python3 ../core/cli/check-npx-pin.py
	python3 ../core/cli/check-typography.py
	python3 ../mcp/check-tool-names.py

check-agents-install:
	python3 scripts/check-agents-install.py

# Markdown-копии страниц и sitemap.md из уже собранного build/ — то, что
# делает deploy.sh; локально — чтобы посмотреть результат.
export-md: build
	python3 scripts/gen-llms.py --build build
	python3 scripts/export-md.py --build build

check: typecheck check-agents-install build
	@echo ""
	@echo "✅ ALL CHECKS PASSED"

setup:
	npm ci

start:
	npm start

serve:
	npm run serve
