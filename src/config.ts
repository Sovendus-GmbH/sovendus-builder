import type { InlineConfig } from "vite";

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
  sovOptions: {
    input: string;
    output: string;
    type: "react-tailwind" | "react" | "vanilla";
    inlineCss?: boolean;
    packageConfig?: PackageConfig;
    bundleReact?: boolean;
    modulesToExternalize?: string[];
  };
  viteOptions?: InlineConfig;
};
