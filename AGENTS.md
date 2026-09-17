# AGENTS.md — layero-docs

Документация Layero. Docusaurus 3, две локали (ru — основная, en — в `i18n/en`).
Адрес — docs.layero.ru.

Сначала прочитай корневой `../AGENTS.md` — необратимые запреты и доступы.

---

## Команды

```bash
make check        # ⬅ типы + команды установки ↔ agents-install.json + сборка. ~10 с
make build        # сборка Docusaurus, обе локали
make typecheck    # tsc
make check-agents-install  # страница «Подключить агента» ↔ agents-install.json
make export-md    # сборка + llms.txt + Markdown-копии страниц + sitemap.md в build/
make start        # локально с горячей перезагрузкой
make check-texts  # тексты ↔ код; скрипты живут в core и mcp
```

⚠️ **Сборка — главное здесь.** Docusaurus падает на битой ссылке, а не
предупреждает; проверено мутацией. Push в `main` катит сразу: красная
сборка = docs.layero.ru не обновился.

**Чего `check` НЕ покрывает:** `check-texts` вынесен отдельно — скрипты
лежат в соседних репозиториях (`core`, `mcp`), и гейт доков не должен
зависеть от их состояния. Прогонять перед выкаткой текстов.

---

## Definition of Done

- **`make check` зелёный**;
- русский текст прогнан через `/ru-text:ru-check`, перед публикацией —
  `/ru-text:ru-score`, целевой балл **7,0–8,9**;
- проверки на расхождение с кодом зелёные (см. ниже);
- страница **открыта на docs.layero.ru** и проверена глазами;
- закоммичено и запушено.

Зелёный прогон CI готовностью не является — см. состояние деплоя ниже.

---

## Деплой

Push в `main` → workflow **Deploy docs** (`deploy-docs.yml`, self-hosted
раннер `layero-builder`) → `deploy.sh`: сборка обеих локалей, `llms.txt`,
Markdown-копии страниц (`/<route>.md`, `sitemap.md`), заливка в бакет
`layero-docs`, purge CDN, IndexNow. Шаг Verify сверяет `build-id.txt` на
живом адресе с SHA коммита.

```bash
gh run list -R LayeroInfra/layero-docs --workflow 'Deploy docs' -L 3
curl -sI https://docs.layero.ru/build-id.txt
```

Раннеры были снесены 12.08.2026 и подняты заново; с 16.09 прогоны
зелёные. Зелёный прогон всё равно не заменяет проверку живого адреса —
шаг Verify проверяет только идентификатор сборки, не страницы.

⚠️ `deploy.sh` руками для прода не запускать.

---

## Жёсткие ограничения

1. **MUST** — обещание в доке подтверждается запуском. Написал «команда
   делает X» — запусти и убедись. Документированные, но не существующие
   коды ошибок уже были отдельным инцидентом (семь штук).
2. **MUST** — `npx layero` только с `@latest`. Без него `npx` не ходит
   в реестр и пинует читателя на старую версию навсегда.
   Ловит `../core/cli/check-npx-pin.py`.
3. **MUST** — правя список, правь пример рядом. Копируют пример,
   а не перечень; расхождение между ними случалось трижды за сутки.
4. **MUST NOT** — ссылаться на инструмент MCP или код ошибки, не сверив
   с живым источником: `../mcp/check-tool-names.py`,
   `../core/cli/check-error-codes.py`.
5. **MUST** — правка русской страницы сопровождается решением по `i18n/en`:
   либо переведено, либо явно помечено как отложенное. Молча разъехавшиеся
   локали — отдельный класс долга.
6. **MUST** — команды установки агента (CLI, навык, Claude Code, Cursor,
   Codex, MCP) — **только из `agents-install.json`** в корне репозитория.
   Это копия канона из `LayeroInfra/layero-agents`; таблица на
   `docs/agents/install.md` (ru и en) генерируется из него между маркерами
   `agents-install:begin/end` — `python3 scripts/check-agents-install.py
   --write`. Гейт `check-agents-install` входит в `make check`. Команду
   установки, написанную руками в любом другом месте доков, считать ошибкой:
   до канона их было шесть разных.

---

## Проверки перед выкаткой текстов

```bash
python3 ../core/cli/check-error-codes.py     # коды ошибок ↔ конструкторы
python3 ../core/cli/check-npx-pin.py         # `npx layero` ↔ `@latest`
python3 ../core/cli/check-typography.py      # неразрывные пробелы, тире, кавычки
python3 ../mcp/check-tool-names.py           # имена инструментов ↔ живой tools/list
python3 scripts/check-agents-install.py      # команды установки ↔ agents-install.json (в make check)
```

Страницу `docs/agents/mcp-tools.md` читает `../mcp/check-tool-names.py`:
имена инструментов там должны совпадать с живым сервером, снятые имена
(`compose_landing` и прочие из генерации лендингов) на ней недопустимы.

Разборы, что каждая ловила и почему ручная вычитка это пропускала, —
`../core/docs/TEXT-CHECKS.md`.

---

## Подробности (читать по условию)

- `../core/docs/TEXT-CHECKS.md` — **обязательно** перед выкаткой текстов
- `../mcp/SOUL.md` — как Layero говорит; при правке тона
- `../core/ARCH.md` — при описании устройства платформы
- `sidebars.ts` — при добавлении страницы
