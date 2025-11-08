# Multi-Alias OAuth UX Plan

Goal: make multi-server auto workflows (e.g., one tool that fans out to Linear, Supabase, Vercel) reliable inside agents like Cursor by ensuring OAuth handshakes happen before the agent’s first “real” call.

## Problems Today
- Agents often skip `describe_tools` and go straight to `tool: …`, which causes mcporter to throw “auth required” errors when the workflow touches an alias that hasn’t been authorized yet.
- Cursor surfaces that error to the user instead of retrying, so the first impression is “workflow failed”.

## Proposed Flow

1. **Harden workflow handlers**
   - When `registerExternalServerWorkflow` catches an `ExternalServerError` whose message indicates auth is required, return a normal tool result:
     ```json
     {
       "content": [{
         "type": "text",
         "text": "Linear requires OAuth. Run describe_tools({ workflow: \"power_workflow\", refresh: true }) to complete the login flow."
       }],
       "isError": false
     }
     ```
   - Cursor reads this as “I should call describe_tools” instead of showing a hard failure.

2. **Add a helper workflow (optional but recommended)**
   - `external_auth_setup` loops over all aliases referenced by scripted/auto workflows and calls `describe_tools` for each one. This intentionally triggers mcporter’s OAuth flow back-to-back.
   - Document it in README + devtools: “Run `external_auth_setup` after connecting so all remote servers finish OAuth.”

3. **Improve tool descriptions**
   - In the workflow definition (and the prompt fallback), explicitly tell agents: “Always call `describe_tools({ workflow: \"xyz\" })` before providing a `tool` argument.” Agents in Cursor + Claude obey that when it’s in the tool description.

4. **Test coverage**
   - Simulate mcporter throwing an auth-specific error and ensure the workflow returns the friendly “please describe_tools(refresh=true)” message.
   - CLI test: call the helper workflow and assert that it touches each alias exactly once (mock mcporter runtime to verify `ensureAlias` wasn’t double-called).

5. **Docs**
   - Update README/examples to mention the `external_auth_setup` helper and the describe-first requirement for hosted MCP servers.
   - Explain that `describe_tools` itself can trigger OAuth; once each alias is authorized, any auto workflow can call multiple servers in a single step.

## Rollout Steps
1. Implement auth-aware error handling + helper workflow.
2. Add tests + docs.
3. Verify with Cursor: new user connects, runs helper, approves OAuth for Linear/Supabase/Vercel, then calls the aggregate workflow without issues.
