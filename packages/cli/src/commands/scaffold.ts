import { existsSync, mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineCommand } from "citty";
import { colors } from "consola/utils";
import { cwdArgs, logLevelArgs } from "./_shared";
import { logger } from "../utils/logger";

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export default defineCommand({
  meta: { name: "scaffold", description: "Scaffold workflows and config" },
  args: { ...cwdArgs, ...logLevelArgs },
  subCommands: {
    async workflow() {
      return defineCommand({
        meta: { name: "workflow", description: "Append a new workflow block" },
        args: {
          ...cwdArgs,
          name: { type: "positional", required: true, description: "Workflow name" },
          config: { type: "string", description: "Path to .mcp-workflows directory" },
          scripted: { type: "boolean", description: "Create a scripted template" },
        },
        async run({ args }) {
          const base = path.resolve(String(args.config || path.join(String(args.cwd || "."), ".mcp-workflows")));
          ensureDir(base);
          const wfPath = path.join(base, "workflows.yaml");
          if (!existsSync(wfPath)) {
            writeFileSync(
              wfPath,
              "# yaml-language-server: $schema=../schema/oplink-workflows.schema.json\n",
            );
            logger.info(`Created ${colors.cyan(path.relative(process.cwd(), wfPath))}`);
          }
          const name = String(args.name);
          const block = args.scripted
            ? `\n${name}:\n  description: "Describe what this workflow does"\n  runtime: scripted\n  parameters:\n    example:\n      type: string\n      description: "Example parameter"\n      required: true\n  steps:\n    - call: alias:tool_name\n      args:\n        key: "{{ example }}"\n`
            : `\n${name}:\n  description: "Describe what this workflow does"\n  prompt: |\n    Write your prompt here.\n`;
          appendFileSync(wfPath, block);
          logger.success(`Appended workflow '${name}' to ${colors.cyan(path.relative(process.cwd(), wfPath))}`);
        },
      });
    },
  },
  run() {
    logger.info("Use: oplink scaffold workflow <name> [--scripted]");
  },
});
