import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { copyDir } from "../test-files/test-config.js";
import {
  cleanDistFolders,
  getConfigContent,
  sovendusBuilder,
} from "./build.js";

const testDir = resolve(__dirname, "../test-files");

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
  it("should compile files with Vite and check output content", async () => {
    const options = {
      config: resolve(testDir, "test-config.ts"),
    };
    await sovendusBuilder(options);

    const buildConfig = await getConfigContent(options);

    // Check if output files exist and verify content
    buildConfig.filesToCompile?.forEach((file) => {
      expect(existsSync(file.output)).toBe(true);
      const content = readFileSync(file.output, "utf-8");
      expect(content).toContain("Hello from input");
    });

    // Check if the files were copied
    buildConfig.filesOrFoldersToCopy?.forEach((fileOrFolderData) => {
      expect(existsSync(fileOrFolderData.output)).toBe(true);
    });
  });

  it("should clean the clean folders before build", async () => {
    // build something to delete
    const initialStateOptions = {
      config: resolve(testDir, "test-config.ts"),
    };
    await sovendusBuilder(initialStateOptions);

    // delete the dist folder
    const options = {
      config: resolve(testDir, "test-delete-config.ts"),
    };
    const buildConfig = await getConfigContent(options);
    await sovendusBuilder(options);

    // Check if dist folder was cleaned
    buildConfig.foldersToClean?.forEach((folderToClean) => {
      expect(existsSync(folderToClean)).toBe(false);
    });
  });

  it("should handle errors when the config file is invalid", async () => {
    const options = {
      config: resolve(testDir, "invalid-config.ts"),
    };

    await expect(sovendusBuilder(options)).rejects.toThrowError();
  });
});
