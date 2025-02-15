import { resolve } from "path";

import type { BuildConfig } from "../src/config.js";

export const testDir = __dirname;
export const distDir = resolve(testDir, "dist");
export const copyDir = resolve(testDir, "dist/copy");

const buildConfig: BuildConfig = {
  foldersToClean: [distDir],
  filesToCompile: [
    {
      input: resolve(testDir, "file1.ts"),
      output: resolve(distDir, "output1.js"),
      options: { type: "vanilla" },
    },
    {
      input: resolve(testDir, "file2.tsx"),
      output: resolve(distDir, "output2.js"),
      options: { type: "react" },
    },
    {
      input: resolve(testDir, "file3.tsx"),
      output: resolve(distDir, "output3.js"),
      options: { type: "react-tailwind" },
    },
  ],
  filesOrFoldersToCopy: [
    {
      input: resolve(testDir, "file1.ts"),
      output: resolve(copyDir, "file1.ts"),
    },
    {
      input: resolve(testDir, "folderToCopy"),
      output: resolve(copyDir, "folderToCopy"),
    },
  ],
};

export default buildConfig;
