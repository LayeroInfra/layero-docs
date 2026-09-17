---
sidebar_position: 4
title: The layero skill
description: What is in the LayeroInfra/layero-agents skill, how to install it via npx skills or the plugins, and what npx layero@latest init writes into AGENTS.md.
---

# The `layero` skill

A skill (Agent Skill) is a `SKILL.md` file with instructions that the agent
reads when a task concerns Layero. There is one, it lives in the public
repository [`LayeroInfra/layero-agents`](https://github.com/LayeroInfra/layero-agents)
and it is the **source of truth**: the MCP server instructions, `llms.txt`,
these pages and the block the CLI writes into `AGENTS.md` are checked against
it by a gate. If something elsewhere says otherwise, the error is there, not in
the skill.

## What is inside

```
skills/layero/
├── SKILL.md            ← the three paths (repository / folder / site), when to use
│                          which, sign-in and token, CLI JSON events, what not to do
└── references/
    ├── json-events.md  ← the schema of CLI events and error codes
    ├── layero-json.md  ← the layero.json file: framework, commands, output folder
    └── providers.md    ← GitHub, GitVerse, GitLab, GitFlic, SourceCraft
```

`SKILL.md` is short and answers "what to do"; the details live in
`references/`, and the agent opens them only when needed.

## How it is installed

The method depends on the client. The commands come from the
[install table](./install.md); here is what stands behind them.

**Any agent that follows the `.agents/skills` standard:**

```bash
npx skills add LayeroInfra/layero-agents
```

The command copies the skill into the project's `.agents/skills/layero/`.
That is how Claude Code, Cursor, Codex and other clients that read this
directory pick it up.

**Claude Code — the plugin.** The `layero` plugin includes both the skill and
the MCP server connection:

```bash
claude plugin marketplace add LayeroInfra/layero-agents && claude plugin install layero@layero
```

**Cursor — the `layero-cursor` plugin** from the same repository: MCP, rules
and the skill.

The plugins are generated from the skill by `build-adapters.py` in the
`layero-agents` repository; they are never edited by hand.

## `npx layero@latest init` and `AGENTS.md`

```bash
npx layero@latest init
```

The command detects the framework, creates `.layero/project.json` and appends
a **short pointer** to the project's `AGENTS.md` (or `CLAUDE.md` /
`.cursorrules` if they exist): where the skill lives, how to install it, and
the address `https://layero.ru/llms.txt`. The full instruction text is
deliberately not there — one fact should have one home, and that is the
skill. An agent that reads `AGENTS.md` goes to the skill for details, not to
a stale copy.

If the skill is already installed in `.agents/skills/`, the pointer simply
leads to it.

## How to check the skill works

Ask the agent: "how do I deploy this project to Layero?". The right answer
starts with the question whether there is a connected repository and contains
neither `git init` nor `npm i -g`. If the agent suggests creating a GitHub
repository, the skill was not picked up.
