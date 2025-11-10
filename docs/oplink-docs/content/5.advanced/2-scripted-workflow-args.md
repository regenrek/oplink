---
title: Scripted Workflow Arguments
description: Handling MCP-specific parameters with defaults in Oplink scripted workflows
---

Some MCP servers expose tools whose JSON Schemas omit optional fields or require knobs that vary between deployments. Because Oplink executes those tools internally, each scripted workflow should describe the arguments it passes along and provide sensible defaults so users can “just run it” without extra inputs.

## Recommend pattern

```yaml
take_screenshot:
  description: "Capture a page"
  runtime: scripted
  parameters:
    url:
      type: string
      required: true
    format:
      type: string
      enum: [png, jpeg, webp]
      default: png
  steps:
    - call: chrome-devtools:navigate_page
      args:
        type: url
        url: "{{ url }}"
    - call: chrome-devtools:take_screenshot
      args:
        fullPage: true
        format: "{{ format }}"
```

- **Expose only the workflow tool** (`take_screenshot`). The helper (`chrome-devtools:take_screenshot`) stays internal.
- **Use defaults** so most invocations need zero additional parameters.
- **Allow overrides** when a user wants a different format or behavior.

## Why not rely on the upstream schema?

Many MCP servers don’t mark optional fields in their schemas. If the upstream tool requires a value (e.g., Chrome DevTools expects `format`), the workflow must provide it. Otherwise, the call fails even though the user can’t set it in the IDE.

## Tips

- Prefer enums for well-known options (formats, modes, etc.).
- Document the default and how to override it in your workflow description.
- When multiple workflows reuse the same knob, name the parameter consistently (`screenshot_format`, `api_region`, etc.).
- If a server always needs a fixed value, hard-code it in the step instead of exposing a parameter.

Following this pattern keeps the UX simple while still allowing advanced users to customize calls when necessary.

### Suppressing per-step logs

Set `quiet: true` on any step to skip the "Step N:" text in the aggregated response:

```yaml
- call: chrome-devtools:take_screenshot
  quiet: true
  args:
    fullPage: true
    format: "{{ format }}"
```

Use this when a tool returns a large binary payload (screenshots, traces) and you don’t want extra chatter in the output.
