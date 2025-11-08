import crypto from "node:crypto";
import { z } from "zod";
import type { ServerToolInfo } from "mcporter";
import { ExternalServerError, listExternalServerTools } from "../external-tools";

const ToolSnapshotSchema = z
	.object({
		name: z.string(),
	})
	.passthrough();

const AliasSnapshotSchema = z.object({
	alias: z.string(),
	versionHash: z.string().min(1),
	refreshedAt: z.number().nonnegative(),
	tools: z.array(ToolSnapshotSchema),
});

const CacheSnapshotSchema = z.record(AliasSnapshotSchema);

export type SerializedCache = z.infer<typeof CacheSnapshotSchema>;

export interface CachePersistenceAdapter {
	load(): Promise<SerializedCache | undefined>;
	save(cache: SerializedCache): Promise<void>;
}

interface CacheEntry {
	alias: string;
	versionHash: string;
	refreshedAt: number;
	tools: Map<string, ServerToolInfo>;
	lastError?: CacheErrorState;
}

export interface CacheErrorState {
	message: string;
	timestamp: number;
}

export interface CacheDescribeView {
	alias: string;
	versionHash: string;
	refreshedAt: number;
	stale: boolean;
	toolCount: number;
	tools: ServerToolInfo[];
	lastError?: CacheErrorState;
}

export interface ExternalToolCacheOptions {
	ttlMs?: number;
	persistence?: CachePersistenceAdapter;
}

export interface EnsureOptions {
	forceRefresh?: boolean;
}

export interface ToolLookupOptions extends EnsureOptions {
	refreshIfMissing?: boolean;
}

const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 5;

export class ExternalToolCache {
	private readonly configDir: string;
	private readonly ttlMs: number;
	private readonly persistence?: CachePersistenceAdapter;
	private readonly entries = new Map<string, CacheEntry>();
	private readonly inflight = new Map<string, Promise<CacheEntry>>();

	constructor(configDir: string, options: ExternalToolCacheOptions = {}) {
		this.configDir = configDir;
		this.ttlMs = options.ttlMs ?? DEFAULT_CACHE_TTL_MS;
		this.persistence = options.persistence;
	}

	async restore(): Promise<void> {
		if (!this.persistence) {
			return;
		}
		let snapshot: SerializedCache | undefined;
		try {
			snapshot = await this.persistence.load();
		} catch (error) {
			console.error("Failed to load external tool cache snapshot:", error);
			return;
		}
		if (!snapshot) {
			return;
		}
		const parsed = CacheSnapshotSchema.safeParse(snapshot);
		if (!parsed.success) {
			console.error("Cached external tool snapshot is invalid:", parsed.error.message);
			return;
		}
		for (const [aliasKey, entry] of Object.entries(parsed.data)) {
			const alias = normalizeAlias(entry.alias || aliasKey);
			if (!alias) {
				continue;
			}
			const tools = new Map<string, ServerToolInfo>();
			for (const tool of entry.tools as ServerToolInfo[]) {
				if (!tool?.name) {
					continue;
				}
				tools.set(tool.name, tool);
			}
			this.entries.set(alias, {
				alias,
				versionHash: entry.versionHash,
				refreshedAt: entry.refreshedAt,
				tools,
			});
		}
	}

async ensureAliases(
	aliases: Iterable<string>,
	options?: EnsureOptions,
): Promise<void> {
	const unique = Array.from(new Set(Array.from(aliases).map(normalizeAlias))).filter(Boolean) as string[];
	await Promise.all(unique.map((alias) => this.ensureAlias(alias, options)));
}

async ensureAlias(alias: string, options?: EnsureOptions): Promise<void> {
	await this.ensureEntry(alias, options);
}

	async getTool(
		alias: string,
		toolName: string,
		options?: ToolLookupOptions,
	): Promise<ServerToolInfo> {
		const normalizedTool = toolName.trim();
		if (!normalizedTool) {
			throw new ExternalServerError("Tool name must be a non-empty string");
		}

	let entry = await this.ensureEntry(alias, options);
		let tool = entry.tools.get(normalizedTool);
		if (!tool && options?.refreshIfMissing !== false) {
			entry = await this.refreshAlias(alias);
			tool = entry.tools.get(normalizedTool);
		}
		if (!tool) {
			throw new ExternalServerError(
				`Server '${alias}' does not expose tool '${normalizedTool}'. Run 'mcporter list ${alias}' to inspect available tools.`,
			);
		}
		return tool;
	}

	getAliasView(alias: string): CacheDescribeView | undefined {
		const normalized = normalizeAlias(alias);
		if (!normalized) {
			return undefined;
		}
		const entry = this.entries.get(normalized);
		if (!entry) {
			return undefined;
		}
		return {
			alias: entry.alias,
			versionHash: entry.versionHash,
			refreshedAt: entry.refreshedAt,
			stale: this.isExpired(entry),
			toolCount: entry.tools.size,
			tools: Array.from(entry.tools.values()),
			lastError: entry.lastError,
		};
	}

getKnownAliases(): string[] {
	return Array.from(this.entries.keys());
}

private async ensureEntry(alias: string, options?: EnsureOptions): Promise<CacheEntry> {
	const normalized = normalizeAlias(alias);
	if (!normalized) {
		throw new ExternalServerError("Server alias must be a non-empty string");
	}
	const existing = this.entries.get(normalized);
	const needsRefresh =
		options?.forceRefresh === true ||
		!existing ||
		this.isExpired(existing);
	if (!needsRefresh && existing) {
		return existing;
	}
	return this.refreshAlias(normalized);
}

private async refreshAlias(alias: string): Promise<CacheEntry> {
	const normalized = normalizeAlias(alias);
		if (!normalized) {
			throw new ExternalServerError("Server alias must be a non-empty string");
		}
		const existing = this.inflight.get(normalized);
		if (existing) {
			return existing;
		}

		const pending = (async () => {
			const tools = await listExternalServerTools(normalized, this.configDir, true);
			const now = Date.now();
			const map = new Map<string, ServerToolInfo>();
			for (const tool of tools) {
				map.set(tool.name, tool);
			}
			const entry: CacheEntry = {
				alias: normalized,
				versionHash: hashTools(tools),
				refreshedAt: now,
				tools: map,
			};
			this.entries.set(normalized, entry);
			await this.persistSnapshot();
			return entry;
		})();

		this.inflight.set(normalized, pending);
		try {
			return await pending;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const current = this.entries.get(normalized);
			if (current) {
				current.lastError = {
					message,
					timestamp: Date.now(),
				};
			}
			throw error;
		} finally {
			if (this.inflight.get(normalized) === pending) {
				this.inflight.delete(normalized);
			}
		}
	}

	private isExpired(entry: CacheEntry): boolean {
		if (this.ttlMs <= 0) {
			return false;
		}
		return Date.now() - entry.refreshedAt > this.ttlMs;
	}

	private async persistSnapshot(): Promise<void> {
		if (!this.persistence) {
			return;
		}
		const snapshot: SerializedCache = {};
		for (const entry of this.entries.values()) {
			snapshot[entry.alias] = {
				alias: entry.alias,
				versionHash: entry.versionHash,
				refreshedAt: entry.refreshedAt,
				tools: Array.from(entry.tools.values()),
			};
		}
		try {
			await this.persistence.save(snapshot);
		} catch (error) {
			console.error("Failed to persist external tool cache:", error);
		}
	}
}

function normalizeAlias(alias: string): string {
	return alias?.trim();
}

function hashTools(tools: ServerToolInfo[]): string {
	const serialized = tools
		.map((tool) => ({
			name: tool.name,
			description: tool.description ?? "",
			inputSchema: tool.inputSchema ?? null,
			outputSchema: tool.outputSchema ?? null,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
	return crypto.createHash("sha256").update(JSON.stringify(serialized)).digest("hex");
}
