import { defineCommand } from "citty";
import { description, name, version } from "../package.json";
import { commands } from "./commands";
import { cwdArgs } from "./commands/_shared";
import { parseArgs } from "./utils/args";

export const main = defineCommand({
	meta: {
		name,
		version,
		description,
	},
	// Keep cwd arguments; parse --config via mri in setup to avoid conflicts
	args: {
		...cwdArgs,
		command: {
			type: "positional",
			required: false,
		},
	},
	subCommands: commands,

	// Use the setup hook to parse extra flags with mri
	setup(ctx) {
		// Initialize ctx.data if it doesn't exist
		ctx.data = ctx.data || {};

		const { configPath } = parseArgs();
		ctx.data.configPath = configPath;
	},
});

export default main;
