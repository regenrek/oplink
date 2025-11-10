import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { createTestClient, ensureDirAndWriteYamlFile, getModulePaths } from "./utils.js";
import * as path from "path";
import * as fs from "fs";

let client: any;
const { __dirname } = getModulePaths(import.meta.url);
const WF_DIR = path.join(__dirname, ".mcp-workflows-thinking", ".mcp-workflows");

beforeAll(async () => {
  if (!fs.existsSync(WF_DIR)) fs.mkdirSync(WF_DIR, { recursive: true });
  ensureDirAndWriteYamlFile(path.join(WF_DIR, "workflows.yaml"), {
    generate_thought: {
      description: "Reflect on a thought and produce a reflection/new set of thoughts",
      parameters: { thought: { type: "string", required: true } },
      prompt: "Reflect on {{ thought }}",
    },
  });
  client = createTestClient();
  await client.connectServer(["--config", WF_DIR]);
}, 15000);

afterAll(async () => { if (client) await client.close(); }, 15000);

describe("Generate Thought Parameter Tests", () => {
  it("calls generate_thought with thought parameter", async () => {
    const result = await client.callTool("generate_thought", { thought: "What is the meaning of life?" });
    expect(result).toHaveProperty("content");
    expect(Array.isArray(result.content)).toBe(true);
  }, 15000);
});
