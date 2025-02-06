import type { BuildOptions, RollupCommonJSOptions } from "vite";
export interface BuildConfig {
    filesToCompile: {
        input: string;
        output: string;
        options: {
            type: string;
            buildOptions?: BuildOptions;
            rollupOptions?: RollupCommonJSOptions;
        };
    }[];
}
//# sourceMappingURL=config.d.ts.map