# Pre-Release Task Plan

This checklist captures what remains to ship the Linear + Discord demo and the Oplink docs refresh. It is written to be actionable and verifiable.

## Test Coverage
- [x] Add registry tests for environment placeholder expansion (stdio)
  - Validates `${API_TOKEN}` → `SERVER_TOKEN` mapping for arbitrary MCP servers.
- [x] Smoke test external OAuth metadata retention for hosted servers (Linear) — covered by `external-registry.test.ts` during CI run.
- [x] Run `pnpm -w test:ci` (build + vitest run --reporter=dot) and ensure green.

## README Updates
- [x] Root `README.md`
  - Links to Advanced docs (mcporter + authentication) and clarifies how `DISCORD_BOT_TOKEN` feeds `DISCORD_TOKEN`.
  - Includes `npx mcporter list ...` verification commands.

## Docs (docs/oplink-docs)
- [x] Add Advanced page: “How Oplink Uses mcporter”.
- [x] Add Authentication page: “Auth for External MCP Servers”.
- [x] Cross-link Getting Started pages to the new Advanced docs.

## Example Configs
- [x] Ensure `examples/linear-discord-demo/.mcp-workflows/servers.json` uses `npx -y @chinchillaenterprises/mcp-discord` + Linear OAuth metadata.
- [x] Align `examples/linear-discord-demo/README.md` with docs; add `.env.example` workflow + mcporter links.

## Release Hygiene
- [x] Replace demo secrets with `.env.example` and ignore `**/.env`.
- [x] Run `pnpm lint` + `pnpm -w test:ci` (non-interactive CI flow).
- [x] Update release-process docs for pnpm + test:ci + docs preview.
- [x] Bump package versions to 0.0.2 and refresh changelog.

## Post-Release
- [x] Publish a “What’s new” snippet (docs/oplink-docs/content/7.whats-new/1-2025-11-09-mcporter.md).
- [x] Track follow-up issue (docs/issues/discord-webhook-example.md).
