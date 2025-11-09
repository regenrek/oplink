---
title: Auto‑Discovery Workflows
description: Proxy external MCP servers and discover tools on demand
---

Expose existing MCP servers (e.g., Chrome DevTools, shadcn, Context7) without writing custom steps. Declare `externalServers`, and Oplink:

- Proxies tools from those aliases
- Registers a built‑in `describe_tools` helper for discovery
- Validates arguments against upstream JSON Schemas

Example

```yaml
frontend_debugger:
  description: "Chrome DevTools helper"
  prompt: |
    Use Chrome DevTools MCP tools (e.g., take_screenshot, list_network_requests).
    Call this workflow with {"tool": "name", "args": { ... }}.
  externalServers:
    - chrome-devtools

full_helper:
  description: "Chrome DevTools + shadcn"
  prompt: |
    Access Chrome DevTools and shadcn MCP tools from one workflow.
  externalServers:
    - chrome-devtools
    - shadcn
```

Usage pattern

1) Discover tools first:

```json
describe_tools({ "workflow": "frontend_debugger" })
```

2) Call a tool by name (optionally prefix with alias when multiple):

```json
frontend_debugger({
  "tool": "take_screenshot",
  "args": { "url": "https://example.com", "format": "png" }
})
```

Tips

- Multiple aliases: either add `server: "alias"` or prefix tool as `alias:tool_name`.
- Refresh discovery: `describe_tools({ "workflow": "frontend_debugger", "refresh": true })`.
- Prewarm all servers once: call `external_auth_setup()` after connecting to trigger OAuth and cache schemas.

See also

- [External Servers & Registry](./4-external-servers)
- Transport/auth deep dives: Advanced → [mcporter](/5.advanced/mcporter), [authentication](/5.advanced/authentication)
