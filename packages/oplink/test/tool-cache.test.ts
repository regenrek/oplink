import { beforeEach, describe, expect, it, vi } from "vitest";

const listToolsMock = vi.fn();

class MockExternalServerError extends Error {}

vi.mock("../src/external-tools", () => ({
	listExternalServerTools: listToolsMock,
	ExternalServerError: MockExternalServerError,
}));

const { ExternalToolCache } = await import("../src/external/cache");

describe("ExternalToolCache", () => {
	beforeEach(() => {
		listToolsMock.mockReset();
	});

	it("caches tool metadata per alias", async () => {
		listToolsMock.mockResolvedValue([
			{ name: "take_screenshot", description: "Capture", inputSchema: { type: "object" } },
		]);

		const cache = new ExternalToolCache("/tmp/config", { ttlMs: 60_000 });
		await cache.ensureAlias("chrome-devtools");
		expect(listToolsMock).toHaveBeenCalledTimes(1);

		const tool = await cache.getTool("chrome-devtools", "take_screenshot");
		expect(tool.name).toBe("take_screenshot");
		expect(listToolsMock).toHaveBeenCalledTimes(1);

		const view = cache.getAliasView("chrome-devtools");
		expect(view?.toolCount).toBe(1);
	});

	it("refreshes when forced", async () => {
		listToolsMock
			.mockResolvedValueOnce([
				{ name: "alpha", inputSchema: { type: "object" } },
			])
			.mockResolvedValueOnce([
				{ name: "beta", inputSchema: { type: "object" } },
			]);

		const cache = new ExternalToolCache("/tmp/config", { ttlMs: 60_000 });
		await cache.ensureAlias("chrome-devtools");
		await cache.ensureAlias("chrome-devtools", { forceRefresh: true });
		expect(listToolsMock).toHaveBeenCalledTimes(2);

		const tool = await cache.getTool("chrome-devtools", "beta");
		expect(tool.name).toBe("beta");
	});
});
