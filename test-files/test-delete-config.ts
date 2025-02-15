import { resolve } from "path";

import type { BuildConfig } from "../src/config.js";

export const testDir = __dirname;
export const distDir = resolve(testDir, "dist");

const buildConfig: BuildConfig = {
  foldersToClean: [distDir],
};

export default buildConfig;
