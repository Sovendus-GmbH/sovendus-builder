import type { BuildOptions, RollupCommonJSOptions } from "vite";

export interface BuildConfig {
  filesToCompile?: {
    input: string;
    output: string;
    options: {
      type: "react-tailwind" | "react" | "vanilla";
      buildOptions?: BuildOptions;
      rollupOptions?: RollupCommonJSOptions;
    };
  }[];
  filesOrFoldersToCopy?: {
    input: string;
    output: string;
  }[];
}
