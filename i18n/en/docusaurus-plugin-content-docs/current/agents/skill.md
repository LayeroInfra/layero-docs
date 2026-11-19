---
sidebar_position: 4
title: The layero skill
description: What is in the LayeroInfra/layero-agents skill, how to install it and what npx layero@latest init adds to the project's AGENTS.md.
---

# The `layero` skill

**A skill is an instruction the agent reads when a task involves Layero.** It
holds the agent's three paths, CLI commands, events and error codes, and the
rules — what not to do. The skill lives in the public repository
[`LayeroInfra/layero-agents`](https://github.com/LayeroInfra/layero-agents).

## What is inside

```
skills/layero/
├── SKILL.md            ← three paths, sign-in and token, CLI events, what not to do
└── references/
    ├── json-events.md   ← CLI events and error codes
    ├── layero-json.md   ← the layero.json file: framework, commands, output folder
    ├── git-providers.md ← GitHub, GitVerse, GitLab, GitFlic, SourceCraft
    └── data-api.md      ← databases and the Data API
skills/layero-content-rules/
└── SKILL.md            ← checking a site against Layero's anti-phishing rules
```

`SKILL.md` answers "what to do"; details live in `references/`. The agent opens
them only when it needs them.

The second skill, `layero-content-rules`, is a checklist of
[Layero's rules](https://layero.ru/rules). The agent goes through it before
publishing a site with sign-in, payments, giveaways or a support form.

## How to install

The commands are in the [install table](./install.md):

- **Any agent with the Agent Skills standard** — the "Agent Skill" row. The
  command offers both skills, `layero` and `layero-content-rules` — install
  both.
- **Claude Code** — the `layero` plugin: both skills and the MCP server in one
  command.
- **Cursor** — the plugin from the same repository: MCP, rules and the skill.
  Installed in Cursor: **Customize → Plugins → Add**.

## `layero init` and `AGENTS.md`

```bash
npx layero@latest init
```

The command is optional — `layero deploy` works without it. It does two
things:

- adds a Layero block to `AGENTS.md`, `CLAUDE.md` or `.cursorrules` — to
  whichever of them the project already has. If there are none, it creates
  `AGENTS.md`;
- creates `.layero/project.json` — the link between the folder and the
  project. The first publish fills it in.

The block is a 60-line digest of the skill: the three paths, commands, the main
events and error codes, the rules. An agent in a new session reads it first
and knows how to publish even without the skill installed. For details the
block points to [docs.layero.ru/agents](./index.md) and the skill.

`init` records no build settings: they live in [`layero.json`](../build/layero-json.md)
or in the project settings. To leave the instruction files alone, add
`--skip-agent-docs`.

## How to check the skill works

Ask the agent: "How do I publish this project on Layero?" A correct answer
starts by asking whether a repository is connected, and contains no
`git init` and no `npm i -g`. If the agent suggests creating a repository on
GitHub, the skill was not picked up.
