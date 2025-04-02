import type { BuildConfig } from "../src/config.js";

export const testDir = "./test-files";
export const distDir = `${testDir}/dist`;
export const copyDir = `${testDir}/dist/copy`;

const buildConfig: BuildConfig = {
  foldersToClean: [distDir],
  filesToCompile: [
    {
      sovOptions: {
        input: `${testDir}/file1.ts`,
        output: `${distDir}/output1.js`,
        type: "vanilla",
      },
    },
    {
      sovOptions: {
        input: `${testDir}/file2.tsx`,
        output: `${distDir}/output2.js`,
        type: "react",
      },
    },
    {
      sovOptions: {
        input: `${testDir}/file3.tsx`,
        output: `${distDir}/output3.js`,
        type: "react-tailwind",
      },
    },
  ],
  filesOrFoldersToCopy: [
    {
      input: `${testDir}/file1.ts`,
      output: `${copyDir}/file1.ts`,
    },
    {
      input: `${testDir}/folderToCopy`,
      output: `${copyDir}/folderToCopy`,
    },
  ],
};

export default buildConfig;
