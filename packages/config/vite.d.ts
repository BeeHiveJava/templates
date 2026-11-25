import type { ViteUserConfig } from "vite-plus";
import type { OxfmtConfig } from "vite-plus/fmt";
import type { OxlintConfig } from "vite-plus/lint";

export declare const fmt: OxfmtConfig;
export declare const lint: OxlintConfig;
export declare const staged: NonNullable<ViteUserConfig["staged"]>;
export declare const tasks: NonNullable<NonNullable<ViteUserConfig["run"]>["tasks"]>;

/**
 * The shared Vite+ config, extended with `config`: plain objects are merged
 * key by key, anything else replaces what it overrides.
 */
export declare function defineConfig(config?: ViteUserConfig): ViteUserConfig;
