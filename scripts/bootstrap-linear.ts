#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveConfigDir(arg?: string): string {
	if (arg) {
		return path.resolve(arg);
	}
	return path.resolve(__dirname, "..", "examples", "linear-discord-demo", ".mcp-workflows");
}

async function main() {
	const [, , configArg] = process.argv;
	const configDir = resolveConfigDir(configArg);
	const templatePath = path.join(configDir, "servers.json.example");
	const targetPath = path.join(configDir, "servers.json");

	if (!fs.existsSync(templatePath)) {
		throw new Error(`Template not found at ${templatePath}`);
	}

	const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
	const linear = template.servers?.linear;
	if (!linear) {
		throw new Error("Template does not include a 'linear' server entry");
	}

	const rl = readline.createInterface({ input, output });

	try {
		const override = fs.existsSync(targetPath)
			? (await rl.question("servers.json already exists. Overwrite? (y/N): ")).trim().toLowerCase()
			: "y";
		if (override && override !== "y" && override !== "yes") {
			console.log("Aborting. No changes written.");
			return;
		}

		const clientId = (await rl.question("Linear client ID (leave blank to skip): ")).trim();
		const clientSecret = (await rl.question("Linear client secret (leave blank to skip): ")).trim();
		const redirectDefault = linear.oauthRedirectUrl ?? "http://127.0.0.1:43115/callback";
		const redirect = (await rl.question(
			`OAuth redirect URL [${redirectDefault}]: `,
		)).trim();

		if (clientId) {
			linear.env = linear.env ?? {};
			linear.env.MCP_REMOTE_CLIENT_ID = clientId;
		} else if (linear.env?.MCP_REMOTE_CLIENT_ID?.startsWith("${")) {
			// keep placeholder
		} else if (linear.env) {
			linear.env.MCP_REMOTE_CLIENT_ID = undefined;
		}

		if (clientSecret) {
			linear.env = linear.env ?? {};
			linear.env.MCP_REMOTE_CLIENT_SECRET = clientSecret;
		} else if (linear.env?.MCP_REMOTE_CLIENT_SECRET?.startsWith("${")) {
			// keep placeholder
		} else if (linear.env) {
			linear.env.MCP_REMOTE_CLIENT_SECRET = undefined;
		}

		linear.oauthRedirectUrl = redirect || redirectDefault;

		const tokenCacheRelative = linear.tokenCacheDir ?? "./.tokens/linear";
		const tokenCacheAbsolute = path.resolve(configDir, tokenCacheRelative);
		await mkdir(tokenCacheAbsolute, { recursive: true });

		fs.writeFileSync(targetPath, `${JSON.stringify(template, null, 2)}\n`);
		console.log(`Wrote ${targetPath}`);
		console.log(`Token cache ready at ${tokenCacheAbsolute}`);
		if (!clientId || !clientSecret) {
			console.log(
				"Tip: If you skipped client credentials, mcporter will open a browser/device flow the first time you call a Linear tool.",
			);
		}
	} finally {
		rl.close();
	}
}

main().catch((error) => {
	console.error("Failed to bootstrap Linear config:", error);
	process.exit(1);
});
