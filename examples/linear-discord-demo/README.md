# Linear + Discord Demo Config

This example demonstrates how to integrate Linear (issue management) and Discord (messaging) MCP servers into Oplink workflows. You can fetch Linear issues and send Discord notifications to assignees.

## Prerequisites

### Linear Setup

Linear’s hosted MCP server uses OAuth 2.1. mcporter handles the browser/device flow, so you simply need to generate the `servers.json` entry once:

1. Run the bootstrap helper (it defaults to this example directory):
   ```bash
   pnpm bootstrap:linear
   ```
   - The script copies `servers.json.example` → `servers.json`, ensures `.tokens/linear` exists, and optionally stores the client ID/secret you paste.
   - Skip the prompts to rely on Linear’s dynamic registration—mcporter will open a browser the first time a workflow calls a Linear tool.

2. (Optional) If you want a reusable OAuth client, create one under **Linear → Settings → API** and paste the client ID/secret when the script asks.

3. For scripted workflows you may still want team IDs or issue IDs; grab them from the Linear UI as before.

### Discord Setup

1. **Create a Discord Bot:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Navigate to the "Bot" section
   - Click "Add Bot" and copy the bot token

2. **Bot Permissions:**
   - Enable "Send Messages" permission
   - Enable "Read Message History" (if needed)
   - For direct messages, ensure the bot can access the user

3. **Invite Bot to Server:**
   - Go to OAuth2 → URL Generator
   - Select `bot` scope and required permissions
   - Use the generated URL to invite the bot to your server

4. **Get Discord Channel IDs:**
   - Enable Developer Mode in Discord (User Settings → Advanced)
   - Right-click on any channel (e.g., #general) and select "Copy ID"
   - You'll need the channel ID to send messages to that channel

5. **Get Discord User IDs (for DMs):**
   - With Developer Mode enabled, right-click on users to copy their User ID
   - You'll need these to send direct messages

## Configuration

### Environment Variables

Only Discord requires an environment variable for this demo. Linear auth is handled via the OAuth prompts/token cache.

```bash
cp .env.example .env   # optional helper; stores placeholders only
```

```bash
export DISCORD_BOT_TOKEN="your-bot-token-here"
# Optional if you want the bootstrap script to inline credentials
export LINEAR_CLIENT_ID="client-id"
export LINEAR_CLIENT_SECRET="client-secret"
```

### Server Configuration

After running `pnpm bootstrap:linear`, `.mcp-workflows/servers.json` contains:

- **Linear**: `npx mcp-remote https://mcp.linear.app/mcp` (`auth: "oauth"`, token cache at `.tokens/linear`).
- **Discord**: `npx @chinchillaenterprises/mcp-discord` stdio server.

You can inspect the Linear catalog at any time with:

```bash
npx mcporter list linear --config examples/linear-discord-demo/.mcp-workflows
```

Tokens generated during OAuth live under `.mcp-workflows/.tokens/linear` and are ignored by git.

## Workflows

### Auto-Discovery Workflows

These workflows expose all tools from Linear and Discord for flexible usage:

- `linear_helper`: Access all Linear MCP tools
- `discord_helper`: Access all Discord MCP tools  
- `linear_discord_helper`: Access both Linear and Discord tools

**Usage:**
1. Call `describe_tools({ "workflow": "linear_helper" })` to discover available tools
2. Call the workflow with `{"tool": "tool_name", "args": {...}}`

### Scripted Workflows

Pre-built workflows for common tasks:

#### `get_team_issues`
Fetch issues from a Linear team.

```json
{
  "team_id": "team-id-here",
  "state": "In Progress"
}
```

#### `send_discord_notification`
Send a message to a Discord channel or user.

**To send to a channel (e.g., #general):**
```json
{
  "channel_id": "123456789012345678",
  "message": "Hello from Linear!"
}
```

**To send a direct message to a user:**
```json
{
  "channel_id": "987654321098765432",
  "message": "You have a new Linear issue assigned!"
}
```

**Note:** Use the channel ID for channels and the user ID for direct messages. Both use the same `channel_id` parameter in the Discord API.

#### `notify_assignee`
Get a Linear issue and send a Discord notification to the assignee.

```json
{
  "issue_id": "abc-123",
  "discord_user_id": "987654321098765432"
}
```

## Usage

1. **Set environment variables:**
   ```bash
   cp .env.example .env  # optional helper for local shells
   export DISCORD_BOT_TOKEN="your-bot-token"
   # Optional, only needed if you want the bootstrap script to auto-fill credentials
   export LINEAR_CLIENT_ID="client-id"
   export LINEAR_CLIENT_SECRET="client-secret"
   ```

2. **Start Oplink:**
   ```bash
   pnpm -r --filter ./packages/oplink dev -- --config examples/linear-discord-demo/.mcp-workflows
   ```

3. **In your MCP client (Cursor, Claude, etc.):**
   - Connect to the running Oplink server
   - List tools to see available workflows
   - Call workflows with appropriate parameters

## Example Workflow

Here's a typical workflow to notify assignees about Linear issues:

1. **Discover available tools:**
   ```json
   describe_tools({ "workflow": "linear_helper" })
   describe_tools({ "workflow": "discord_helper" })
   ```

2. **Get issues for a team:**
   ```json
   get_team_issues({
     "team_id": "your-team-id",
     "state": "In Progress"
   })
   ```

3. **Send a notification to a channel (e.g., #general):**
   ```json
   send_discord_notification({
     "channel_id": "123456789012345678",
     "message": "New Linear issues are ready for review!"
   })
   ```

4. **Or send a direct message to an assignee:**
   ```json
   notify_assignee({
     "issue_id": "abc-123",
     "discord_user_id": "987654321098765432"
   })
   ```

## Sending Messages to Channels

To send messages to a Discord channel (like #general):

1. **Get the Channel ID:**
   - Enable Developer Mode in Discord (User Settings → Advanced)
   - Right-click on the channel name (e.g., #general)
   - Select "Copy ID"
   - The ID is a long number like `123456789012345678`

2. **Use the Channel ID:**
   ```json
   send_discord_notification({
     "channel_id": "123456789012345678",
     "message": "📋 New Linear issue: Fix authentication bug"
   })
   ```

3. **Or use the auto-discovery workflow:**
   ```json
   discord_helper({
     "tool": "send_message",
     "args": {
       "channelId": "123456789012345678",
       "content": "Hello from Linear!"
     }
   })
   ```

**Important:** Make sure your bot has been invited to the server and has "Send Messages" permission in the channel you want to post to.

## Notes

- **Tool Names**: The actual tool names (`list_issues`, `get_issue`, `send_message`, etc.) depend on what the Linear and Discord MCP servers expose. Use `describe_tools` to discover the exact names and schemas.

- **Linear MCP Endpoint**: The demo defaults to `https://mcp.linear.app/mcp` via `npx mcp-remote`. If Linear rotates endpoints, edit `servers.json` or re-run `pnpm bootstrap:linear`.

- **Discord Direct Messages**: Bots can send DMs, but users must have DMs enabled from server members. Consider using a channel instead if DMs fail.

- **User Mapping**: You'll need to maintain a mapping between Linear user emails/IDs and Discord user IDs to send targeted notifications.

## Troubleshooting

- **"Missing MCP server registry"**: Ensure `servers.json` exists in `.mcp-workflows/`
- **"Environment placeholder cannot be resolved"**: Export `DISCORD_BOT_TOKEN` (and optionally `LINEAR_CLIENT_ID` / `LINEAR_CLIENT_SECRET` if you want the script to inline them)
- **Linear OAuth errors**: Delete `.mcp-workflows/.tokens/linear` and re-run `pnpm bootstrap:linear` to retry the login flow
- **Discord errors**: Ensure the bot token is valid and the bot has necessary permissions. The demo uses `@chinchillaenterprises/mcp-discord`, which reads `DISCORD_TOKEN` from the environment (wired here from `DISCORD_BOT_TOKEN`).
- **Tool not found**: Use `describe_tools` to verify the exact tool names exposed by each server
