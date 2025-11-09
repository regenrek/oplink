---
title: DeepWiki Integration
description: Integrate the public DeepWiki MCP server for documentation search
---

This example integrates the public DeepWiki MCP server (documented at [https://docs.devin.ai/work-with-devin/deepwiki-mcp](https://docs.devin.ai/work-with-devin/deepwiki-mcp)) into Oplink.

## Configuration

The example includes:

- `.mcp-workflows/servers.json` – registers the HTTP endpoint `https://mcp.deepwiki.com/sse` under the alias `deepwiki`. No API key is required per the official docs.
- `.mcp-workflows/workflows.yaml` – includes both an explicit proxy (`deepwiki:deepwiki_search`) and an auto-discovery workflow.

## Workflows

### `deepwiki_lookup`

Scripted workflow that searches DeepWiki:

```yaml
deepwiki_lookup:
  description: "Look up details in DeepWiki"
  runtime: scripted
  parameters:
    query:
      type: "string"
      description: "Search phrase or entity"
      required: true
  steps:
    - call: deepwiki:deepwiki_search
      args:
        query: "{{ query }}"
```

### `deepwiki_auto`

Auto-discovery workflow that exposes all DeepWiki tools:

```yaml
deepwiki_auto:
  description: "Auto-discovered DeepWiki tools"
  runtime: scripted
  parameters:
    query:
      type: "string"
      description: "Topic to research"
      required: true
  steps:
    - call: deepwiki:deepwiki_search
      args:
        query: "{{ query }}"
```

## Usage

1. **Start Oplink:**
   ```bash
   pnpm -r --filter ./packages/oplink dev -- --config examples/deepwiki-demo/.mcp-workflows
   ```

2. **Inspect the server:**
   ```bash
   npx mcporter list deepwiki --config examples/deepwiki-demo/.mcp-workflows
   ```

3. **Use the workflow:**
   ```json
   describe_tools({ "workflow": "deepwiki_helper" })
   ```

4. **Call the workflow:**
   ```json
   deepwiki_lookup({
     "query": "react server components"
   })
   ```

After Oplink starts, connect your MCP client and run `listTools` to confirm `deepwiki:*` tools are available.

