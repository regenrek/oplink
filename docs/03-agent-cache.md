# Agent Cache & Tool Discovery Plan

## Goals
- Keep Oplink MCP-agnostic while handling thousands of MCP servers.
- Avoid flooding MCP clients with massive tool lists; expose only explicit workflows.
- Provide agents with a simple, dynamic way to discover available tools at runtime (similar to `mcporter list <alias>`), while caching metadata for performance.
- Continue to rely on mcporter for execution (auth, retries, transports).

## Key Components
1. **Discovery Layer (mcporter-backed)**
   - On startup (or on demand), run `listExternalServerTools(alias)` for each alias in `.mcp-workflows/servers.json`.
   - Cache the returned metadata (tool name, description, JSON schema, auth requirements).
   - Store cache per alias with timestamp and version tag.

2. **Describe API / Tool Catalog Resource**
   - Expose an MCP tool/resource (e.g., `describe_tools`) that returns the cached metadata for a workflow alias.
   - Input: workflow name + optional filters (server alias, search term).
   - Output: structured list of tools + schemas so the agent can choose which tool to call.
   - Include cache metadata (last refresh, stale flag).

3. **Auto-refresh & Consistency**
   - Allow manual refresh (`describe_tools(refresh=true)`) and background refresh (scheduled or triggered when cache ages out).
   - Detect schema changes (hash comparison) and invalidate cache when a server adds/removes tools.

4. **Integration with Auto Workflows**
   - Auto workflows (those using `externalServers`) no longer expose dozens of sub-tools; they expose exactly one tool per workflow.
   - Agents call `describe_tools` first to see available commands, then invoke the workflow with `tool`+`args`.
   - Scripted workflows retain curated behavior (defaults, sequencing) and can optionally embed `describe_tools` output.

5. **Context-Saving Strategy**
   - MCP clients only see the high-level workflows (`frontend_debugger`, `context7_helper`, etc.). No more context pollution from 50+ proxied tools.
   - Tool schemas stay in the cache / describe API, not the client context window.
   - Agents plan their calls by querying the describe API whenever they need to know which tools exist.

6. **mcporter Compatibility**
   - Continue using mcporter to execute external tools: `executeExternalTool(alias, toolName, args, configDir)`.
   - Discovery step also runs through mcporter (`listExternalServerTools`).
   - Cache format mirrors mcporter output so we don’t invent a second schema.

## Implementation Steps
1. **Cache Layer**
   - Create a cache module (`packages/oplink/src/external/cache.ts`) that stores `Map<alias, { tools: ToolInfo[], lastUpdated, versionHash }>`.
   - Populate cache during server startup; allow lazy load if needed.

2. **Describe Tool**
   - Add new workflow/tool `describe_tools` (always available) that accepts `workflow` (or `aliases[]`) + flags.
   - Handler reads from cache; if stale/ missing and `refresh=true`, re-runs discovery first.

3. **Auto Workflow Update**
   - Modify `registerExternalServerWorkflow` to:
     - Require `tool` OR `preset` OR `args`.
     - Provide a helpful prompt that suggests calling `describe_tools` first.

4. **Agent UX**
   - Update docs and examples: recommended flow = call `describe_tools`, then call `frontend_debugger({ tool: "alias:name", args: {...} })`.
   - Provide sample script showing the two-step pattern.

5. **Fallback & Safety**
   - If cache is missing or stale and refresh fails, return an error with instructions to run `mcporter list <alias>` manually.
   - Log discovery failures so operators can fix server configs.

6. **Future Enhancements**
   - Store cache on disk (optional) to avoid re-discovering on each restart.
   - Add heuristics/presets for popular MCP servers (e.g., default args for Chrome DevTools screenshot) to keep UX friendly.
   - Integrate with agent memory (e.g., highlight recently used tools, success rates).

## Timeline
1. MVP (3-4 days)
   - Cache module
   - `describe_tools` handler
   - Auto workflow prompt update
   - Docs + examples
2. Phase 2 (next sprint)
   - Disk-backed cache, refresh scheduling
   - Client SDK helper to call `describe_tools`
3. Phase 3
   - Optional presets for common servers, analytics on tool usage.

## Risks & Mitigations
- **Stale metadata**: expire cache entries and allow manual refresh.
- **Large catalogs**: paginate describe output; allow search filters.
- **Security**: rely on mcporter auth (OAuth, tokens). Cache should store only tool metadata, not secrets.
- **UX confusion**: highlight in docs that the recommended flow is describe → call; provide CLI snippets.

This plan keeps Oplink lightweight (one workflow per server), hides internal tool lists from the client, and still leverages mcporter for discovery + execution.
