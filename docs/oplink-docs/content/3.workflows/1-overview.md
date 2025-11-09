---
title: Workflows Overview
description: How workflows work in Oplink and when to use each mode
navigation.icon: i-heroicons-arrows-right-left
---

Oplink workflows are YAML-defined tools that your IDE/agent can call via MCP. They let you combine prompts and external MCP servers into reusable flows that your team can version, review, and share.

Why workflows

- Combine prompts with MCP tools into one invokable command
- Share a consistent toolbox across teammates/repos
- Curate arguments, defaults, and sequences for reliability

Choose your path

- Path A — Quick start: run `oplink server --preset thinking` from your IDE. No files required.
- Path B — Project setup: `npx oplink@latest init`, add `.mcp-workflows/workflows.yaml` (and `servers.json` if using external servers), then point your IDE at `--config ./.mcp-workflows`.

Workflow modes

- Prompt workflows: a single prompt tool (great for heuristics, helper text)
- Auto-discovery workflows: proxy tools from external servers; Oplink registers `describe_tools` so agents can discover available commands
- Scripted workflows: multi-step orchestration that validates args and calls specific external tools in sequence

Folder layout

- `.mcp-workflows/workflows.yaml` – your workflow definitions
- `.mcp-workflows/servers.json` – registry of external MCP servers (aliases, commands, env)
- `.mcp-workflows/.tokens/*` – OAuth tokens/cache (ignored by git)

Next steps

- [Auto‑Discovery Workflows](./2-auto-discovery)
- [Scripted Workflows](./3-scripted)
- [External Servers & Registry](./4-external-servers)
- [Parameters & Schemas](./5-parameters-and-schemas)
- [Debugging & Caching](./6-debugging-and-caching)
- [Examples](/4.examples) - See practical workflow examples
