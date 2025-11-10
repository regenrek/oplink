---
title: Frontend MCP Demo
description: Integrate Chrome DevTools and shadcn MCP servers for frontend debugging and component discovery
---

This example demonstrates how to integrate Chrome DevTools MCP and shadcn MCP servers for frontend development workflows. The demo includes a sample React application that you can debug and inspect using MCP tools.

## Overview

The frontend-mcp-demo combines:

- **Chrome DevTools MCP**: Live browser debugging, screenshots, and performance analysis
- **shadcn MCP**: Browse, search, and install UI components from the shadcn/ui library

## Prerequisites

1. **Chrome/Chromium browser** installed (required for Chrome DevTools MCP)
2. **Node.js** and `pnpm` installed
3. **FRONTEND_ROOT environment variable** (optional, for shadcn MCP):
   ```bash
   export FRONTEND_ROOT="/path/to/your/frontend/project"
   ```

## Configuration

### Server Configuration

The `.mcp-workflows/servers.json` file registers two MCP servers:

- **chrome-devtools**: Uses `npx chrome-devtools-mcp@latest` for browser debugging
- **shadcn**: Uses `npx shadcn@latest mcp` for component discovery (requires `FRONTEND_ROOT`)

### Workflows

#### `frontend_debugger`

Auto-discovery workflow that exposes all Chrome DevTools and shadcn tools:

```yaml
frontend_debugger:
  description: "Direct access to Chrome DevTools + shadcn MCP tools"
  prompt: |
    You are a frontend debugger. Use Chrome DevTools MCP or shadcn MCP tools
    to inspect the UI, capture screenshots, or list components.
  externalServers:
    - chrome-devtools
    - shadcn
```

**Usage:**

1. Discover available tools:
   ```json
   describe_tools({ "workflow": "frontend_debugger" })
   ```

2. Take a screenshot:
   ```json
   frontend_debugger({
     "tool": "chrome-devtools:take_screenshot",
     "args": {
       "url": "http://localhost:5173",
       "format": "png"
     }
   })
   ```

#### `ui_components_helper`

Dedicated helper for shadcn component discovery:

```yaml
ui_components_helper:
  description: "Dedicated shadcn MCP helper"
  prompt: |
    Use shadcn MCP tools to list or search components.
  externalServers:
    - shadcn
```

**Usage:**

```json
ui_components_helper({
  "tool": "shadcn:search_items_in_registries",
  "args": {
    "query": "button"
  }
})
```

#### `take_screenshot`

Scripted workflow for capturing page screenshots:

```yaml
take_screenshot:
  description: "Capture screenshots of web pages"
  runtime: scripted
  parameters:
    url:
      type: "string"
      required: true
    format:
      type: "string"
      enum: ["png", "jpeg", "webp"]
      default: "png"
  steps:
    - call: chrome-devtools:navigate_page
      args:
        url: "{{ url }}"
    - call: chrome-devtools:take_screenshot
      args:
        format: "{{ format }}"
```

**Usage:**

```json
take_screenshot({
  "url": "http://localhost:5173",
  "format": "png"
})
```

## Usage

1. **Start the demo frontend application:**
   ```bash
   cd examples/frontend-mcp-demo
   pnpm install
   pnpm dev
   ```
   The app will be available at `http://localhost:5173`

2. **Set environment variables (if using shadcn MCP):**
   ```bash
   export FRONTEND_ROOT="/path/to/your/frontend/project"
   ```

3. **Start Oplink:**
   ```bash
   pnpm -r --filter ./packages/oplink dev -- --config examples/frontend-mcp-demo/.mcp-workflows
   ```

4. **In your MCP client:**
   - Connect to the running Oplink server
   - Use `describe_tools` to discover available Chrome DevTools and shadcn tools
   - Capture screenshots, inspect console logs, or search for UI components

## Example Workflows

### Debugging a Web Page

1. **Navigate and capture a screenshot:**
   ```json
   take_screenshot({
     "url": "http://localhost:5173",
     "format": "png",
     "wait_for": "Frontend MCP demo"
   })
   ```

2. **Inspect console logs:**
   ```json
   frontend_debugger({
     "tool": "chrome-devtools:get_console_logs",
     "args": {}
   })
   ```

3. **Check network requests:**
   ```json
   frontend_debugger({
     "tool": "chrome-devtools:list_network_requests",
     "args": {}
   })
   ```

### Finding UI Components

1. **Search for components:**
   ```json
   ui_components_helper({
     "tool": "shadcn:search_items_in_registries",
     "args": {
       "query": "dialog"
     }
   })
   ```

2. **List available components:**
   ```json
   ui_components_helper({
     "tool": "shadcn:list_items_in_registries",
     "args": {}
   })
   ```

## Troubleshooting

- **Chrome DevTools errors**: Ensure Chrome/Chromium is installed and accessible
- **shadcn MCP errors**: Verify `FRONTEND_ROOT` is set to a valid project directory
- **Screenshot failures**: Make sure the target URL is accessible and the page has loaded
- **Tool not found**: Use `describe_tools` to verify the exact tool names exposed by each server

