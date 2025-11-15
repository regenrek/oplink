---
title: DeepWiki Integration
description: Integrate the public DeepWiki MCP server for documentation search
---

This example integrates the public DeepWiki MCP server (documented at [https://docs.devin.ai/work-with-devin/deepwiki-mcp](https://docs.devin.ai/work-with-devin/deepwiki-mcp)) into Oplink.

## Configuration

The example includes:

- `.mcp-workflows/servers.json` – registers the HTTP endpoint `https://mcp.deepwiki.com/sse` under the alias `deepwiki`. No API key is required per the official docs.
- `.mcp-workflows/workflows.yaml` – defines a scripted workflow (`deepwiki_lookup`) that calls DeepWiki behind the scenes.

## Workflows

### `deepwiki_lookup`

Scripted workflow that calls DeepWiki’s `ask_question` tool:

```yaml
deepwiki_lookup:
  description: "Ask DeepWiki a question about a GitHub repository"
  runtime: scripted
  parameters:
    repo:
      type: "string"
      description: "owner/repo, e.g. facebook/react"
      required: true
    question:
      type: "string"
      description: "Question to ask about the repository"
      required: true
  steps:
    - call: deepwiki:ask_question
      args:
        repoName: "{{ repo }}"
        question: "{{ question }}"
```

## Usage

1. **Start Oplink:**
   ```bash
   pnpm -r --filter ./packages/oplink dev -- --config examples/deepwiki-demo/.mcp-workflows
   ```

2. **Inspect the server (optional):**
   ```bash
   npx mcporter list deepwiki --config examples/deepwiki-demo/.mcp-workflows
   ```

3. **Discover cached tools:**
   ```json
   describe_tools({ "workflow": "deepwiki_lookup" })
   ```

4. **Call the workflow:**
   ```json
   deepwiki_lookup({
     "repo": "shadcn-ui/ui",
     "question": "How do I use the dialog component?"
   })
   ```

By default, `listTools` will show `deepwiki_lookup` plus helper tools such as `describe_tools` and `external_auth_setup`. If you prefer to expose one MCP tool per DeepWiki tool (e.g., `deepwiki.read_wiki_structure`), start Oplink with:

```bash
OPLINK_AUTO_REGISTER_EXTERNAL_TOOLS=1 pnpm -r --filter ./packages/oplink dev -- --config examples/deepwiki-demo/.mcp-workflows
```
