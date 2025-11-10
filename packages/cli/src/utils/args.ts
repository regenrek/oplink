import mri from "mri";
import { resolve } from "pathe";
import type { CommandLineArgs } from "../@types/args";

export function parseArgs(argv = process.argv.slice(2)): CommandLineArgs {
    const { config, _ } = mri(argv, {
        alias: { c: "config" },
        string: ["config"],
    });

    let configPath: string | undefined;
    if (config) {
        configPath = resolve(String(config).replace(/^['"]+|['"]+$/g, ""));
    }

    return { configPath, _: _ };
}
