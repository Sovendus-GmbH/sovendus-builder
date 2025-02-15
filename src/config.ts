import type { OutputOptions } from "rollup";
import type { BuildOptions, InlineConfig, RollupCommonJSOptions } from "vite";

export interface BuildConfig {
  foldersToClean?: string[];
  filesToCompile?: FileToCompile[];
  filesOrFoldersToCopy?: {
    input: string;
    output: string;
  }[];
}

export type FileToCompile = {
  input: string;
  output: string;
  options: {
    type: "react-tailwind" | "react" | "vanilla";
    buildOptions?: BuildOptions;
    rollupOptions?: RollupCommonJSOptions;
    otherOptions?: InlineConfig;
    outputOptions?: OutputOptions;
  };
};
