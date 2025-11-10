import { existsSync, promises as fsp } from "node:fs";
import { tmpdir } from "node:os";
import process from "node:process";
import path from "node:path";

import { type CommandContext, defineCommand } from "citty";
import { colors } from "consola/utils";
import { downloadTemplate } from "giget";
import { basename, dirname, join, resolve } from "pathe";

import { logger } from "../utils/logger";
import { cwdArgs, logLevelArgs } from "./_shared";

export default defineCommand({
	meta: {
		name: "add",
		description:
			"Add workflows from a remote (giget) source into .mcp-workflows.",
	},
	args: {
		...cwdArgs,
		...logLevelArgs,
		force: { type: "boolean", description: "Override existing files in .mcp-workflows" },
		source: {
			type: "positional",
			required: true,
			description:
				"Giget source string (e.g., github:user/repo/path or user/repo/path)",
			valueHint: "giget-source",
		},
	},
	async run(ctx: CommandContext) {
		const cwd = resolve(String(ctx.args.cwd ?? process.cwd()));
		const sourceArg = ctx.args.source;
		const force = ctx.args.force;

		// Ensure sourceArg is a string before proceeding
		if (typeof sourceArg !== "string") {
			logger.error("Source argument must be a string.");
			process.exit(1);
		}

		// --- 1. Check for .mcp-workflows directory ---
		const workflowsDir = join(cwd, ".mcp-workflows");
		if (!existsSync(workflowsDir)) {
			logger.error(
				`No OPLINK folder or config found in ${cwd}! Please run ${colors.cyan(
					"npx oplink@latest init",
				)} to get started.`,
			);
			process.exit(1);
		}

		// --- 2. Require a giget-style source and infer name ---
		if (!(sourceArg.includes(":") || sourceArg.includes("/"))) {
			logger.error(
				"Built-in presets have been removed. Please provide a giget source (e.g., github:user/repo/path).",
			);
			process.exit(1);
		}
		const pathPart = sourceArg.split("#")[0];
		const presetName = pathPart ? basename(pathPart) : "";

		if (!presetName) {
			logger.error(
				`Could not determine a valid preset name from the input: ${sourceArg}`,
			);
			process.exit(1);
		}

		// --- Download from Giget source ---
		const gigetSource = sourceArg;
		const destDirPath = join(workflowsDir, presetName);
		let tempDir: string | undefined;

		try {
			logger.info(
				`Attempting to add workflows from giget source: ${gigetSource} → ${destDirPath}`,
			);
			logger.debug(`Destination directory: ${destDirPath}`);

			if (existsSync(destDirPath)) {
				if (force) {
					logger.warn(
						`Overwriting existing directory: ${destDirPath} due to --force flag.`,
					);
					await fsp.rm(destDirPath, { recursive: true, force: true });
				} else {
					logger.error(
						`Destination already exists: ${destDirPath}. Use --force to override.`,
					);
					process.exit(1);
				}
			}

			tempDir = await fsp.mkdtemp(join(tmpdir(), "oplink-tmp-"));
			const template = await downloadTemplate(gigetSource, { dir: tempDir, force: true });
			await fsp.mkdir(dirname(destDirPath), { recursive: true });
			await fsp.cp(template.dir, destDirPath, { recursive: true });

			logger.success(
				`🪄 Added workflows to ${colors.cyan(destDirPath)}`,
			);
		} catch (error: any) {
			logger.error(`Failed to add workflows from ${gigetSource}: ${error.message}`);
			if (error.cause) logger.error(`Cause: ${error.cause}`);
			if (process.env.DEBUG) console.error(error);
			process.exit(1);
		} finally {
			if (tempDir) {
				try {
					await fsp.rm(tempDir, { recursive: true, force: true });
				} catch {}
			}
		}
	},
});
