---
title: Auth for External MCP Servers
description: API Key and OAuth patterns with servers.json
---

External MCP servers authenticate in two common ways: API keys and OAuth. Oplink keeps auth simple by expanding environment placeholders in `servers.json` and delegating OAuth to mcporter when requested. You can also use servers that require no auth.

## API Key

Use environment placeholders to inject secrets at runtime. You can pass keys to stdio servers as env vars, or to HTTP servers as headers.

Stdio server (env var):

```json [servers.json]
{
  "servers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_TOKEN": "${CONTEXT7_TOKEN}"
      }
    }
  }
}
```

HTTP server (header):

```json [servers.json]
{
  "servers": {
    "grafana": {
      "type": "http",
      "url": "https://grafana.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${GRAFANA_TOKEN}"
      }
    }
  }
}
```

Export the variables in your shell before starting Oplink:

```bash
export CONTEXT7_TOKEN="..."
export GRAFANA_TOKEN="..."
pnpm -r --filter ./packages/oplink dev -- --config .mcp-workflows
```

## OAuth (Hosted Servers)

Some providers host their own MCP servers and use OAuth (e.g., Linear). Use `mcp-remote` to connect and let mcporter guide the login flow.

```json [servers.json]
{
  "servers": {
    "linear": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"],
      "auth": "oauth",
      "clientName": "oplink-linear-demo",
      "oauthRedirectUrl": "http://127.0.0.1:22227/oauth/callback",
      "tokenCacheDir": "./.tokens/linear"
    }
  }
}
```

Options:
- `clientName`: Label shown to the provider when registering tokens.
- `oauthRedirectUrl`: Callback URL for the auth flow.
- `tokenCacheDir`: Local directory where tokens are stored.

Advanced (bring-your-own client):

```json [servers.json]
{
  "env": {
    "MCP_REMOTE_CLIENT_ID": "${LINEAR_CLIENT_ID}",
    "MCP_REMOTE_CLIENT_SECRET": "${LINEAR_CLIENT_SECRET}"
  }
}
```

If omitted, mcporter will use device/browser flow and cache tokens automatically.

## Example: Two Servers (API Key + OAuth)

This example wires both patterns:

```json [servers.json]
{
  "servers": {
    "discord": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@chinchillaenterprises/mcp-discord"],
      "env": {
        "DISCORD_TOKEN": "${DISCORD_BOT_TOKEN}"
      }
    },
    "linear": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"],
      "auth": "oauth",
      "clientName": "oplink-linear-demo",
      "oauthRedirectUrl": "http://127.0.0.1:22227/oauth/callback",
      "tokenCacheDir": "./.tokens/linear"
    }
  }
}
```

Load the env and run:

```bash
set -a; source examples/linear-discord-demo/.env; set +a
pnpm -r --filter ./packages/oplink dev -- --config examples/linear-discord-demo/.mcp-workflows
```

## Verify with mcporter

Inspect server catalogs and kick off auth if needed:

```bash
npx mcporter list discord --config examples/linear-discord-demo/.mcp-workflows
npx mcporter list linear --config examples/linear-discord-demo/.mcp-workflows
```
