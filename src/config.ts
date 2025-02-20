import type { OutputOptions, RollupOptions } from "rollup";
import type { BuildOptions, InlineConfig } from "vite";

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
    rollupOptions?: RollupOptions;
    otherOptions?: InlineConfig;
    outputOptions?: OutputOptions;
  };
};
