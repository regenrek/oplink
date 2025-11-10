# Atlassian (Jira + Confluence) Demo Config

This example demonstrates how to integrate Atlassian Jira and Confluence MCP servers into Oplink workflows. The demo includes workflows for common Jira and Confluence operations.

## Key Features

- **Auto-discovery workflows**: Access all Jira and Confluence tools dynamically
- **Scripted workflows**: Pre-built workflows for common operations
- **Issue management**: Create, update, and search Jira issues
- **Documentation access**: Search and retrieve Confluence pages

## Prerequisites

### 1. Docker

The Atlassian MCP server runs as a Docker container. Ensure Docker is installed and running.

### 2. Atlassian API Tokens

#### For Atlassian Cloud (Recommended)

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**
3. Name it (e.g., "Oplink MCP")
4. Copy the token immediately (you won't see it again)

You'll need separate tokens for Jira and Confluence if you use different accounts, or one token if using the same account.

#### For Server/Data Center

1. Go to your profile (avatar) → **Profile** → **Personal Access Tokens**
2. Click **Create token**
3. Name it and set expiry
4. Copy the token immediately

## Configuration

### 1. Set Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Atlassian credentials:

```bash
# Jira Configuration
JIRA_URL=https://your-company.atlassian.net
JIRA_USERNAME=your.email@company.com
JIRA_API_TOKEN=your_jira_api_token_here

# Confluence Configuration
CONFLUENCE_URL=https://your-company.atlassian.net/wiki
CONFLUENCE_USERNAME=your.email@company.com
CONFLUENCE_API_TOKEN=your_confluence_api_token_here
```

### 2. Optional: Filter Projects/Spaces

To limit which projects/spaces are accessible, add filters:

```bash
# Only show specific Jira projects
JIRA_PROJECTS_FILTER=PROJ,DEV,SUPPORT

# Only show specific Confluence spaces
CONFLUENCE_SPACES_FILTER=DEV,TEAM,DOC
```

### 3. Export Environment Variables

Before running Oplink, export the environment variables:

```bash
export $(cat .env | xargs)
```

Or use a tool like `direnv` to automatically load them:

```bash
# Install direnv (if not already installed)
brew install direnv  # macOS
# or
sudo apt install direnv  # Linux

# Allow direnv in this directory
echo 'export $(cat .env | xargs)' > .envrc
direnv allow
```

## Workflows

### Auto-Discovery Workflows

These workflows expose all tools from the Atlassian MCP server:

- `atlassian_helper`: Access all Jira and Confluence tools
- `jira_helper`: Access Jira tools only
- `confluence_helper`: Access Confluence tools only

**Usage:**

1. Discover available tools:
   ```json
   describe_tools({ "workflow": "jira_helper" })
   ```

2. Call a tool:
   ```json
   jira_helper({
     "tool": "jira_search",
     "args": {
       "jql": "assignee = currentUser() AND status = 'In Progress'"
     }
   })
   ```

### Scripted Workflows

These workflows provide convenient wrappers for common Jira and Confluence operations:

#### `list_my_issues`

List issues assigned to you with compact output:

```json
list_my_issues({
  "project": "PROJ",
  "status": "In Progress",
  "max_results": 20
})
```


#### `search_issues_compact`

Search issues with JQL and get compact results:

```json
search_issues_compact({
  "jql": "project = PROJ AND created >= -7d ORDER BY updated DESC",
  "max_results": 50
})
```

#### `get_issue_summary`

Get a concise summary of a specific issue:

```json
get_issue_summary({
  "issue_key": "PROJ-123"
})
```

Returns only: key, summary, description (text only), status, priority, assignee, dates, labels, and URL.

#### `create_issue_from_notes`

Create a Jira issue from meeting notes or text:

```json
create_issue_from_notes({
  "project_key": "PROJ",
  "summary": "Fix authentication bug",
  "description": "Users cannot log in after password reset",
  "issue_type": "Bug",
  "priority": "High"
})
```

#### `update_issue_status`

Transition an issue to a new status:

```json
update_issue_status({
  "issue_key": "PROJ-123",
  "status": "In Progress"
})
```

#### `search_confluence_pages`

Search Confluence pages with compact output:

```json
search_confluence_pages({
  "query": "OKR guide",
  "space_key": "TEAM",
  "limit": 20
})
```

#### `get_confluence_page_content`

Get page content with HTML stripped and formatted:

```json
get_confluence_page_content({
  "page_id": "123456789"
})
```

## Usage

1. **Set environment variables:**
   ```bash
   export $(cat .env | xargs)
   ```

2. **Start Oplink:**
   ```bash
   pnpm -r --filter ./packages/oplink dev -- --config examples/atlassian-demo/.mcp-workflows
   ```

3. **In your MCP client (Cursor, Claude, etc.):**
   - Connect to the running Oplink server
   - List tools to see available workflows
   - Call workflows with appropriate parameters

## Example Workflows

### Daily Standup Preparation

1. **List your in-progress issues:**
   ```json
   list_my_issues({
     "status": "In Progress",
     "max_results": 10
   })
   ```

2. **Get details for a specific issue:**
   ```json
   get_issue_summary({
     "issue_key": "PROJ-123"
   })
   ```

### Meeting Notes to Jira

1. **Create issues from meeting notes:**
   ```json
   create_issue_from_notes({
     "project_key": "PROJ",
     "summary": "Implement user authentication",
     "description": "From sprint planning: Need to add OAuth2 support",
     "issue_type": "Story",
     "priority": "High"
   })
   ```

### Documentation Lookup

1. **Search Confluence:**
   ```json
   search_confluence_pages({
     "query": "deployment process",
     "space_key": "DEV"
   })
   ```

2. **Get page content:**
   ```json
   get_confluence_page_content({
     "page_id": "123456789"
   })
   ```


## Troubleshooting

- **"Missing environment variable"**: Ensure all required variables are exported (use `export $(cat .env | xargs)`)
- **"Docker not found"**: Ensure Docker is installed and running
- **"Authentication failed"**: Verify your API tokens are correct and not expired
- **"Permission denied"**: Ensure your Atlassian account has access to the projects/spaces you're trying to access
- **"Tool not found"**: Use `describe_tools` to verify the exact tool names exposed by the server

## Notes

- **API Tokens vs Passwords**: Use API tokens, not your account password
- **Token Security**: Never commit `.env` files to version control
- **Project/Space Filters**: Use `JIRA_PROJECTS_FILTER` and `CONFLUENCE_SPACES_FILTER` to limit access
- **Read-Only Mode**: Set `READ_ONLY_MODE=true` in your environment to disable write operations
- **Tool Filtering**: Use `ENABLED_TOOLS` environment variable to restrict which tools are available

