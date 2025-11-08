---
title: Auto Workflows
description: Quick wiring of external MCP servers without writing custom steps
---

# Auto Workflows

When you just want to expose an existing MCP server (Chrome DevTools, shadcn, Context7, etc.) without hand-crafting steps, define a workflow with `externalServers`. Oplink exposes a single tool that proxies any command from those servers via mcporter **and** registers a built-in `describe_tools` helper so agents can discover the available commands on demand.

```yaml
frontend_debugger:
  description: "Chrome DevTools helper"
  prompt: |
    Use Chrome DevTools MCP tools (e.g., take_screenshot, list_network_requests).
    Call this workflow with {"tool": "name", "args": { ... }}.
  externalServers:
    - chrome-devtools

shadcn_helper:
  description: "shadcn helper"
  prompt: |
    Use shadcn MCP tools to list/search components.
  externalServers:
    - shadcn

full_helper:
  description: "Chrome DevTools + shadcn"
  prompt: |
    Access Chrome DevTools and shadcn MCP tools from one workflow.
  externalServers:
    - chrome-devtools
    - shadcn
```

## Calling an auto workflow

Each auto workflow now follows a two-step pattern:

1. Call `describe_tools({ "workflow": "frontend_debugger" })` (optionally add `aliases`, `search`, `limit`, or `refresh`) to retrieve the cached catalog for the workflow’s aliases.
2. Call the workflow with:
   - `tool`: The tool name to invoke (e.g., `take_screenshot`). You can also prefix it with the alias (`chrome-devtools:take_screenshot`).
   - `server` (optional): Only needed when the workflow lists multiple aliases (like `full_helper`) and you didn’t prefix the tool name.
   - `args`: Object of arguments forwarded to the underlying MCP tool.

```json
describe_tools({
  "workflow": "frontend_debugger"
})

frontend_debugger({
  "tool": "take_screenshot",
  "args": {
    "url": "https://example.com",
    "format": "png"
  }
})
```

Oplink validates the arguments against the tool’s JSON Schema (if provided) and forwards the call through mcporter. The MCP client only sees the high-level workflow tool (`frontend_debugger`), keeping the catalog out of the context window. Use auto workflows for quick wiring, then graduate to scripted workflows when you need curated flows, defaults, or multi-step orchestration.
