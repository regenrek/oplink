import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { McpTestClient } from "../src/McpTestClient.js";
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve the CLI entry point path dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go up three levels from test/ -> test-utils/ -> packages/ -> oplink/
// Then down to packages/cli/bin/oplink.mjs
const cliEntryPointPath = path.resolve(__dirname, '../../../packages/cli/bin/oplink.mjs');

describe("MCP Client Tests", () => {
	let client: McpTestClient;

	beforeEach(() => {
		console.log("cliEntryPointPath", cliEntryPointPath);

		client = new McpTestClient({
			cliEntryPoint: cliEntryPointPath, // Use the dynamically resolved path
		});
	});

	afterEach(async () => {
	try {
		await client.close();
	} catch (error) {
		console.error("Error closing client:", error);
	}
	});

it("starts with no workflows by default", async () => {
    await client.connectServer();
    const tools = await client.listTools();
    expect(Array.isArray(tools.tools)).toBe(true);
    const toolNames = tools.tools.map((t: any) => t.name);
    console.log("Available tools:", toolNames);
    expect(toolNames).toContain("describe_tools");
});

it("loads workflows from --config directory", async () => {
    // create a temporary workflows dir with a simple tool
    const tmpDir = path.resolve(__dirname, "./tmp-config/.mcp-workflows");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const wfPath = path.join(tmpDir, "workflows.yaml");
    fs.writeFileSync(wfPath, `hello:\n  description: Simple hello tool\n  prompt: |\n    Hello from Oplink!\n`);
    await client.connectServer(["--config", tmpDir]);
    const tools = await client.listTools();
    const toolNames = tools.tools.map((t: any) => t.name);
    expect(toolNames).toContain("hello");
});
});
