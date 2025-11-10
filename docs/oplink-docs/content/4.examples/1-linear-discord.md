---
title: Linear + Discord Integration
description: Integrate Linear issue management and Discord messaging workflows
---

This example demonstrates how to integrate Linear (issue management) and Discord (messaging) MCP servers into Oplink workflows. You can fetch Linear issues and send Discord notifications to assignees.

## Prerequisites

### Linear Setup

Linear's hosted MCP server uses OAuth 2.1. mcporter handles the browser/device flow automatically.

1. Run the bootstrap helper:
   ```bash
   pnpm bootstrap:linear
   ```
   - The script copies `servers.json.example` → `servers.json` and ensures `.tokens/linear` exists
   - Skip prompts to rely on Linear's dynamic registration—mcporter will open a browser the first time a workflow calls a Linear tool

2. (Optional) Create a reusable OAuth client under **Linear → Settings → API** and paste the client ID/secret when prompted

### Discord Setup

1. **Create a Discord Bot:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Navigate to the "Bot" section
   - Click "Add Bot" and copy the bot token

2. **Bot Permissions:**
   - Enable "Send Messages" permission
   - Enable "Read Message History" (if needed)

3. **Invite Bot to Server:**
   - Go to OAuth2 → URL Generator
   - Select `bot` scope and required permissions
   - Use the generated URL to invite the bot to your server

4. **Get Discord Channel IDs:**
   - Enable Developer Mode in Discord (User Settings → Advanced)
   - Right-click on any channel and select "Copy ID"

## Configuration

### Environment Variables

```bash
export DISCORD_BOT_TOKEN="your-bot-token-here"
# Optional if you want the bootstrap script to inline credentials
export LINEAR_CLIENT_ID="client-id"
export LINEAR_CLIENT_SECRET="client-secret"
```

### Server Configuration

After running `pnpm bootstrap:linear`, `.mcp-workflows/servers.json` contains:

- **Linear**: `npx mcp-remote https://mcp.linear.app/mcp` (OAuth, token cache at `.tokens/linear`)
- **Discord**: `npx @chinchillaenterprises/mcp-discord` stdio server

Inspect the Linear catalog:

```bash
npx mcporter list linear --config examples/linear-discord-demo/.mcp-workflows
```

## Workflows

### Auto-Discovery Workflows

These workflows expose all tools from Linear and Discord:

- `linear_helper`: Access all Linear MCP tools
- `discord_helper`: Access all Discord MCP tools  
- `linear_discord_helper`: Access both Linear and Discord tools

**Usage:**

1. Discover tools:
   ```json
   describe_tools({ "workflow": "linear_helper" })
   ```

2. Call a tool:
   ```json
   discord_helper({
     "tool": "send_message",
     "args": {
       "channelId": "123456789012345678",
       "content": "Hello from Linear!"
     }
   })
   ```

## Usage

1. **Set environment variables:**
   ```bash
   export DISCORD_BOT_TOKEN="your-bot-token"
   ```

2. **Start Oplink:**
   ```bash
   pnpm -r --filter ./packages/oplink dev -- --config examples/linear-discord-demo/.mcp-workflows
   ```

3. **In your MCP client:**
   - Connect to the running Oplink server
   - List tools to see available workflows
   - Call workflows with appropriate parameters

## Example Workflow

1. **Discover available tools:**
   ```json
   describe_tools({ "workflow": "linear_helper" })
   describe_tools({ "workflow": "discord_helper" })
   ```

2. **Send a notification to a channel:**
   ```json
   discord_helper({
     "tool": "send_message",
     "args": {
       "channelId": "123456789012345678",
       "content": "📋 New Linear issue: Fix authentication bug"
     }
   })
   ```

## Troubleshooting

- **"Missing MCP server registry"**: Ensure `servers.json` exists in `.mcp-workflows/`
- **"Environment placeholder cannot be resolved"**: Export `DISCORD_BOT_TOKEN`
- **Linear OAuth errors**: Delete `.mcp-workflows/.tokens/linear` and re-run `pnpm bootstrap:linear`
- **Discord errors**: Ensure the bot token is valid and the bot has necessary permissions
- **Tool not found**: Use `describe_tools` to verify the exact tool names exposed by each server

