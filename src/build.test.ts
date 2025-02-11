import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it, beforeAll, afterAll } from "vitest";

import {
  cleanDistFolders,
  compileToJsFilesWithVite,
  copyFiles,
} from "./build.js";
import type { BuildConfig } from "./config.js";

const testDir = resolve(__dirname, "../test-files");
const distDir = resolve(testDir, "dist");
const copyDir = resolve(testDir, "dist/copy");

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

beforeAll(() => {
  // Create a folder and a file to copy
  const folderToCopy = resolve(testDir, "folderToCopy");
  if (!existsSync(folderToCopy)) {
    mkdirSync(folderToCopy);
    writeFileSync(
      resolve(folderToCopy, "fileInFolder.ts"),
      "console.log('Hello from fileInFolder.ts');",
    );
  }
});

afterAll(() => {
  // Clean up the copy directory
  cleanDistFolders({ foldersToClean: [copyDir] });
});

describe("Build Functionality", () => {
  it("should compile files with Vite and clean the dist folder", async () => {
    await compileToJsFilesWithVite(buildConfig);

    // Check if output files exist
    buildConfig.filesToCompile!.forEach((file) => {
      expect(existsSync(file.output)).toBe(true);
    });

    // Clean dist folder
    cleanDistFolders(buildConfig);

    // Check if dist folder was cleaned
    expect(street).toBe("streetname");
    expect(number).toBe("streetname");
  });

  it("should copy files and folders", async () => {
    await copyFiles(buildConfig);

    // Check if the file was copied
    expect(existsSync(resolve(copyDir, "file1.ts"))).toBe(true);

    // Check if the folder and its contents were copied
    expect(existsSync(resolve(copyDir, "folderToCopy"))).toBe(true);
    expect(
      existsSync(resolve(copyDir, "folderToCopy", "fileInFolder.ts")),
    ).toBe(true);
  });
});
