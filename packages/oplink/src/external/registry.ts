import fs from "node:fs/promises";
import path from "node:path";
import type { ServerDefinition } from "mcporter";
import { loadEnvForConfigDir } from "./safeload-env";

export type ExternalServerRegistry = {
	configDir: string;
	registryPath: string;
	servers: Map<string, ServerDefinition>;
};

const PLACEHOLDER_REGEX = /\$\{([A-Z0-9_]+)\}/gi;

type RawServer = Record<string, any>;
type RawRegistry = { servers?: Record<string, RawServer> };

export class ExternalServerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ExternalServerError";
	}
}

export async function loadExternalServerRegistry(configDir: string): Promise<ExternalServerRegistry> {
	if (!configDir) {
		throw new ExternalServerError(
			"External MCP servers require a --config directory containing servers.json",
		);
	}

    const absoluteConfigDir = path.resolve(configDir);

    // Load .env files from the config directory so ${VAR} placeholders can resolve
    // Precedence: shell > .env.{NODE_ENV}.local > .env.{NODE_ENV} > .env.local > .env
    // Shell values are never overridden.
    try {
        loadEnvForConfigDir(absoluteConfigDir);
    } catch (error) {
        // Keep non-fatal: invalid .env should not crash registry loading
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Warning: failed to load .env files from ${absoluteConfigDir}: ${message}`);
    }
	const registryPath = path.join(absoluteConfigDir, "servers.json");

	let raw: string;
	try {
		raw = await fs.readFile(registryPath, "utf8");
	} catch (error) {
		throw new ExternalServerError(
			`Missing MCP server registry at ${registryPath}. Create servers.json with your server definitions.`,
		);
	}

    let parsed: RawRegistry;
    try {
        parsed = JSON.parse(raw) as RawRegistry;
    } catch (error) {
        throw new ExternalServerError(
            `servers.json at ${registryPath} is invalid JSON: ${error instanceof Error ? error.message : error}`,
        );
    }
    if (!parsed || typeof parsed !== "object" || !parsed.servers || typeof parsed.servers !== "object") {
        throw new ExternalServerError(`servers.json at ${registryPath} is invalid: missing 'servers' object`);
    }

	const servers = new Map<string, ServerDefinition>();
	for (const [alias, entry] of Object.entries(parsed.servers)) {
		const normalized = alias.trim();
		if (normalized.length === 0) {
			throw new ExternalServerError(
				"Server aliases must be non-empty strings without whitespace.",
			);
		}
		if (normalized.includes(":")) {
			throw new ExternalServerError(
				`Server alias '${alias}' must not contain ':'. Use the alias without namespaces; Oplink adds the tool suffix automatically.`,
			);
		}
		if (servers.has(normalized)) {
			throw new ExternalServerError(
				`Duplicate server alias '${normalized}' detected in servers.json.`,
			);
		}

        if (!entry || typeof entry !== "object") {
            throw new ExternalServerError(
                `servers.json at ${registryPath} is invalid: server '${alias}' must be an object`,
            );
        }
        const type = String((entry as any).type || "");
        if (type !== "stdio" && type !== "http") {
            throw new ExternalServerError(
                `servers.json at ${registryPath} is invalid: server '${alias}' has unsupported type '${type}'`,
            );
        }

        const definition = buildServerDefinition(
			normalized,
			entry as RawServer,
			absoluteConfigDir,
			registryPath,
		);
		servers.set(normalized, definition);
	}

	if (servers.size === 0) {
		throw new ExternalServerError(
			`No servers declared in ${registryPath}. Add at least one MCP server to register external tools.`,
		);
	}

	return {
		configDir: absoluteConfigDir,
		registryPath,
		servers,
	};
}

function buildServerDefinition(
	alias: string,
	entry: RawServer,
	configDir: string,
	registryPath: string,
): ServerDefinition {
	const env = entry.env ? expandObjectPlaceholders(entry.env, alias, registryPath) : undefined;
	const tokenCacheDir = entry.tokenCacheDir
		? path.resolve(configDir, expandPlaceholders(entry.tokenCacheDir, alias, registryPath))
		: undefined;
	const description = entry.description;

	const source = { kind: "local" as const, path: registryPath };

	if (entry.type === "http") {
		const url = expandPlaceholders(entry.url, alias, registryPath);
		const headers = entry.headers
			? expandObjectPlaceholders(entry.headers, alias, registryPath)
			: undefined;
		return {
			name: alias,
			description,
			command: {
				kind: "http",
				url: new URL(url),
				headers,
			},
			env,
			auth: entry.auth,
			tokenCacheDir,
			clientName: entry.clientName,
			oauthRedirectUrl: entry.oauthRedirectUrl,
			source,
		};
	}

	const command = expandPlaceholders(entry.command, alias, registryPath);
	const args = entry.args?.map((arg) => expandPlaceholders(arg, alias, registryPath)) ?? [];
	const cwd = entry.cwd
		? path.resolve(configDir, expandPlaceholders(entry.cwd, alias, registryPath))
		: configDir;

	return {
		name: alias,
		description,
		command: {
			kind: "stdio",
			command,
			args,
			cwd,
		},
		env,
		auth: entry.auth,
		tokenCacheDir,
		clientName: entry.clientName,
		oauthRedirectUrl: entry.oauthRedirectUrl,
		source,
	};
}

function expandObjectPlaceholders(
	values: Record<string, string>,
	alias: string,
	registryPath: string,
): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(values)) {
		result[key] = expandPlaceholders(value, alias, registryPath);
	}
	return result;
}

function expandPlaceholders(value: string, alias: string, registryPath: string): string {
	return value.replace(PLACEHOLDER_REGEX, (match, varName) => {
		const actual = process.env[varName];
		if (actual === undefined) {
			throw new ExternalServerError(
				`Missing environment variable '${varName}' referenced by server '${alias}' in ${registryPath}`,
			);
		}
		return actual;
	});
}
