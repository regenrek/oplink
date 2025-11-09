# Issue: Add Discord Webhook Example

- **Summary**: Provide an alternative Discord workflow that uses incoming webhooks instead of bot tokens. This helps teams that cannot manage bot credentials but can create channel-specific webhooks.
- **Scope**:
  - Create a new example directory (e.g., `examples/discord-webhook-demo`).
  - Document how to collect webhook URLs, store them via `${DISCORD_WEBHOOK_URL}`, and send JSON payloads.
  - Update docs/README with a comparison table (bot vs webhook).
- **Status**: TODO (created 2025-11-09)
