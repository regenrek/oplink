import type { CommandDef } from "citty";

const _rDefault = (r: any) => (r.default || r) as Promise<CommandDef>;

export const commands = {
	add: () => import("./add").then(_rDefault),
	init: () => import("./init").then(_rDefault),
	config: () => import("./config").then(_rDefault),
	server: () => import("./server").then(_rDefault),
	validate: () => import("./validate").then(_rDefault),
	scaffold: () => import("./scaffold").then(_rDefault),
} as const;
