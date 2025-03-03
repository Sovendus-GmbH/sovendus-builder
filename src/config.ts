import type { OutputOptions, RollupOptions } from "rollup";
import type { BuildOptions, InlineConfig, PluginOption } from "vite";

export interface BuildConfig {
  foldersToClean?: string[];
  filesToCompile?: FileToCompile[];
  filesOrFoldersToCopy?: {
    input: string;
    output: string;
  }[];
  foldersToZip?: {
    input: string;
    output: string;
  }[];
}

export type FileToCompile = {
  input: string;
  output: string;
  options: {
    type: "react-tailwind" | "react" | "vanilla";
    isPackage?: boolean;
    modulesToExternalize?: string[];
    buildOptions?: BuildOptions;
    rollupOptions?: RollupOptions;
    otherOptions?: InlineConfig;
    plugins?: PluginOption[];
    outputOptions?: OutputOptions;
  };
};
