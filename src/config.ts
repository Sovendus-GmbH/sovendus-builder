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

export interface PackageConfig {
  isPackage: true;
  dtsInclude: string[];
  dtsEntryRoot: string;
}

export type FileToCompile = {
  input: string;
  output: string;
  options: {
    type: "react-tailwind" | "react" | "vanilla";
    packageConfig?: PackageConfig;
    bundleReact?: boolean;
    modulesToExternalize?: string[];
    buildOptions?: BuildOptions;
    rollupOptions?: RollupOptions;
    otherOptions?: InlineConfig;
    plugins?: PluginOption[];
    outputOptions?: OutputOptions;
  };
};
