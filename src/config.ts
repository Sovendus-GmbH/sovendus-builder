import type { OutputOptions } from "rollup";
import type { BuildOptions, InlineConfig, RollupCommonJSOptions } from "vite";

export interface BuildConfig {
  foldersToClean?: string[];
  filesToCompile?: {
    input: string;
    output: string;
    options: {
      type: "react-tailwind" | "react" | "vanilla";
      buildOptions?: BuildOptions;
      rollupOptions?: RollupCommonJSOptions;
      otherOptions?: InlineConfig;
      outputOptions?: OutputOptions;
    };
  }[];
  filesOrFoldersToCopy?: {
    input: string;
    output: string;
  }[];
}
