---
title: Debugging & Caching
description: Inspect tool catalogs, refresh caches, and fix common startup errors
---

Discovery cache

- Oplink caches external tool catalogs for ~5 minutes by default.
- Force refresh: `describe_tools({ "workflow": "name", "refresh": true })` or call `external_auth_setup({ "refresh": true })`.

Inspect an alias (mcporter CLI)

```bash
npx mcporter list <alias> --config examples/linear-discord-demo/.mcp-workflows
```

Common errors

- Missing env placeholder
  - Symptom: `Missing environment variable 'X' referenced by server 'alias' in servers.json`
  - Fix: export `X` (or remove the `${X}` entry if optional)

- Connection closed on startup
  - Symptom: `MCP error -32000: Connection closed`
  - Fix: the child process failed to start (wrong command/package); verify the `command` and `args` for that alias

- OAuth didn’t open
  - Fix: trigger discovery: `describe_tools({ "workflow": "name" })` or run `external_auth_setup()`

Reset tokens (Linear example)

```bash
rm -rf .mcp-workflows/.tokens/linear
```

See also

- [External Servers & Registry](./4-external-servers)
- Advanced: [mcporter](/5.advanced/mcporter)
