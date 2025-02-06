import { existsSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

import { cleanDistFolder, compileToJsFilesWithVite } from "./build";
import type { BuildConfig } from "./config";

const testDir = resolve(__dirname, "../test-files");
const distDir = resolve(testDir, "dist");

const buildConfig: BuildConfig = {
  filesToCompile: [
    {
      input: resolve(testDir, "file1.ts"),
      output: resolve(distDir, "output1.js"),
      options: { type: "vanilla-ts" },
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
};

describe("Build Functionality", () => {
  it("should compile files with Vite and clean the dist folder", async () => {
    await compileToJsFilesWithVite(buildConfig);

    // Check if output files exist
    buildConfig.filesToCompile.forEach((file) => {
      expect(existsSync(file.output)).toBe(true);
    });

    // Clean dist folder
    cleanDistFolder(distDir);

    // Check if dist folder was cleaned
    expect(existsSync(distDir)).toBe(false);
  });
});
