import { expect, describe, it, beforeAll, beforeEach, afterEach } from 'vitest';
import { McpTestClient } from "@oplink/test-utils";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { CLI_ENTRY_POINT } from "./test-constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_CONFIG_DIR = path.join(__dirname, "test-workflows");
const EMPTY_CONFIG_DIR = path.join(TEST_CONFIG_DIR, "empty-workflows");
const INVALID_CONFIG_DIR = path.join(TEST_CONFIG_DIR, "not-workflows");
const MCP_WORKFLOWS_DIR = path.join(TEST_CONFIG_DIR, ".mcp-workflows");

describe("MCP Server Configuration Tests (no presets)", () => {
  let client: McpTestClient;

  beforeAll(() => {
    for (const dir of [TEST_CONFIG_DIR, EMPTY_CONFIG_DIR, MCP_WORKFLOWS_DIR, INVALID_CONFIG_DIR]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    // valid workflows
    fs.writeFileSync(
      path.join(MCP_WORKFLOWS_DIR, "custom.yaml"),
      `custom_mcp_tool:\n  description: "A custom tool from .mcp-workflows"\n  prompt: |\n    # Custom MCP Tool\n\n    This is a custom tool from the .mcp-workflows directory.\n`
    );
  });

  beforeEach(() => {
    client = new McpTestClient({ cliEntryPoint: CLI_ENTRY_POINT });
  });

  afterEach(async () => {
    try { await client.close(); } catch {}
  });

  describe("Basic Scenarios", () => {
    it("B1: Default run - should expose only helper tools", async () => {
      await client.connectServer();
      const tools = await client.listTools();
      expect(Array.isArray(tools.tools)).toBe(true);
      const names = tools.tools.map((t: any) => t.name);
      expect(names).toContain("describe_tools");
    });
  });

  describe("Config Scenarios", () => {
    it("C1: Load from .mcp-workflows - should register custom tool", async () => {
      await client.connectServer(["--config", MCP_WORKFLOWS_DIR]);
      const tools = await client.listTools();
      const names = tools.tools.map((t: any) => t.name);
      expect(names).toContain("custom_mcp_tool");
    });

    it("C2: Non-existent config path - falls back to no workflows", async () => {
      await client.connectServer(["--config", path.join(TEST_CONFIG_DIR, "does-not-exist")]);
      const tools = await client.listTools();
      const names = tools.tools.map((t: any) => t.name);
      expect(names).toContain("describe_tools");
    });

    it("C3: Config path is not .workflows/.mcp-workflows - falls back to no workflows", async () => {
      await client.connectServer(["--config", INVALID_CONFIG_DIR]);
      const tools = await client.listTools();
      const names = tools.tools.map((t: any) => t.name);
      expect(names).toContain("describe_tools");
    });

    it("C4: Empty .mcp-workflows dir - no custom tools", async () => {
      await client.connectServer(["--config", EMPTY_CONFIG_DIR]);
      const tools = await client.listTools();
      const names = tools.tools.map((t: any) => t.name);
      expect(names).toContain("describe_tools");
    });
  });
});
