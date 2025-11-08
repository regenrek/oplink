# Optimize Tool Exposure (Default: Minimal Context)

Status: proposal
Owner: TBD
Target: Pre-release (make this the default behavior)

## Objective
Minimize the MCP client context window by exposing only the workflow tools defined in `.mcp-workflows/workflows.yaml` (e.g., `frontend_debugger`, `ui_components_maintenance`, `take_screenshot`) while executing all external MCP server calls internally via mcporter. No external proxy tools (e.g., `chrome-devtools:*`, `shadcn:*`) should be registered with the client.

## Summary
- Expose one public tool per workflow key in `workflows.yaml` (no aggregator tool).
- Keep all external tools discovered via mcporter in an internal registry (not registered with MCP).
- Express workflows as `runtime: scripted` step plans that call external tools internally.
- Each workflow’s `parameters` becomes that tool’s input schema.

## Architecture Changes
- Public surface:
  - Register exactly the workflow tools defined in `workflows.yaml`.
  - Each tool’s input schema is derived directly from that workflow’s `parameters`.
- Internal tool registry (default):
  - Discover servers from `.mcp-workflows/servers.json` via mcporter at startup.
  - Build `externalRegistry[alias][toolName] = { schema, call() }`.
  - Do NOT call `server.addTool` for these; they remain hidden.
- Workflow runtime: `scripted` (default for YAML definitions)
  - `steps:` list:
    - `call: chrome-devtools:navigate_page`
      `args: { type: "url", url: "{{ url }}", ignoreCache: false }`
    - `call: chrome-devtools:performance_start_trace`
      `args: { reload: false, autoStop: false }`
    - `call: chrome-devtools:list_network_requests`
    - `call: chrome-devtools:list_console_messages`
    - `call: chrome-devtools:performance_stop_trace`
    - `call: chrome-devtools:take_screenshot`
      `args: { fullPage: {{ full_page | true }} }`
  - Optional `summarize:` block turns artifacts into a natural‑language report.
- Prompting & templating:
  - Use the existing templating for args; pass collected artifacts into `summarize`.
  - Keep `prompt` optional for scripted workflows.

## Breaking Replacements (since unreleased)
- Do not register `server:tool` proxies as public MCP tools. No flags/compat layers.
- `externalServers:` is ignored for exposure. Discovery still uses `servers.json`.
- Public tools now equal workflow keys. Workflows must be `runtime: scripted` with `steps:`.

## Developer Experience
- Debug locally with mcporter:
  - `npx mcporter list chrome-devtools --config examples/frontend-mcp-demo/.mcp-workflows/servers.json`
  - Use results to author `steps:` safely.
- Authoring guardrails:
  - Startup validation verifies every `steps[].call` exists in `externalRegistry` and args conform to the discovered schema.

- ## Execution Engine
- `executeExternal(alias, toolName, args)`
  - Validates args using discovered JSON Schema.
  - Calls mcporter runtime and returns a normalized result `{ text?, files?, json?, structuredContent? }`.
- `runScriptedWorkflow(workflowId, params)`
  - Renders args with templating, executes steps sequentially.
  - Stores artifacts in a shared context; supports simple `set:` and variable substitution.
  - If `summarize` present, runs a final LLM prompt and returns combined MCP response.

## Input Schema Generation
- For each workflow `W`, compile its `parameters` to JSON Schema and attach to the public MCP tool named `W`.

## Telemetry & Errors
- Map mcporter errors to friendly messages with `alias:tool` and step index.
- Per-step timing and counts; basic audit log (stdout, behind `OPLINK_LOG_LEVEL=debug`).

## Security
- No helper tools are exposed to clients.
- All env/placeholder expansion continues to use `servers.json` with `${ENV}`.

## Tests (Must‑Have)
- Unit
  - scripted-workflows.schema.test.ts
    - Compiles each workflow's `parameters` to JSON Schema and attaches to the corresponding public tool.
    - Rejects YAML that references unknown `alias:tool` in `steps:`.
  - internal-registry.test.ts
    - Loads `.mcp-workflows/servers.json` via mocked mcporter and builds the internal registry map.
    - Ensures no `server:tool` proxies are registered with MCP (internal‑only).
    - Validates args against discovered JSON Schema before call.
  - executor-router.test.ts
    - `executeExternal(alias, tool, args)` returns normalized results (text/files/structuredContent).
    - Maps mcporter/network errors to friendly messages with `alias:tool` + step index.
- Integration
  - server-visibility.test.ts
    - Boots Oplink with a fixture config dir and mocked mcporter; asserts only workflow tools are exposed to the client; zero `chrome-devtools:*` / `shadcn:*` tools registered.
  - scripted-workflow-run.test.ts
    - Invokes `take_screenshot` and `frontend_debugger`; verifies step order, internal calls + arguments, and artifact attachment in the MCP response.
- Updates to existing suites
  - server-external.test.ts
    - Replace expectations that proxies are publicly registered with assertions that proxies are internal‑only.
  - external-tools.test.ts
    - Adapt to use the internal registry adapter rather than `server.addTool` paths.
  - external-registry.test.ts
    - Keep as‑is (servers.json/env expansion unchanged).
- E2E (optional but recommended)
  - Headless run against the demo UI (vite dev) with a stubbed chrome‑devtools‑mcp; assert only the three workflow tools are visible and a screenshot is produced.

## Migration of Examples
- `examples/frontend-mcp-demo/.mcp-workflows/workflows.yaml`
  - Convert `frontend_debugger`, `ui_components_maintenance`, `take_screenshot` to `runtime: scripted` with `steps:`.
  - Remove top-level proxy entries and any exposed proxy tools.
- `examples/deepwiki-demo/.mcp-workflows/workflows.yaml`
  - Convert to `runtime: scripted` (call `deepwiki:*` internally) OR leave as second phase.

## Rollout Steps
1. Implement internal registry + mcporter adapter.
2. Implement scripted runtime and per‑workflow public tools.
3. Replace existing registration path so external proxies are never added to MCP server; only workflow tools are registered.
4. Update examples + README (Quick Start, Workflow authoring guide).
5. Add tests and CI checks.

## Acceptance Criteria
- The MCP client lists exactly the workflow tools from `workflows.yaml` (e.g., `frontend_debugger`, `ui_components_maintenance`, `take_screenshot`).
- Invoking any workflow tool executes its scripted steps via mcporter and returns artifacts + summary.
- No `chrome-devtools:*` or `shadcn:*` tools are visible to the client.
- Validation catches missing/unknown external tools at startup.

## Future Enhancements (post‑MVP)
- `parallel` step groups and `retry` policy per step.
- Optional `if:` conditions and `sleep:` steps.
- File/resource attachment helpers for large artifacts.
