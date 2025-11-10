import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	entries: [
		"src/index",
		//"src/cli-entry",
	],
	declaration: true, // Generates .d.ts files
	clean: true, // Clean the dist directory before building
	rollup: {
		emitCJS: true, // Emit CommonJS output
		inlineDependencies: true, // Inline dependencies
	},
});
