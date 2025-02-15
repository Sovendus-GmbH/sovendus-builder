import type { BuildConfig } from "../src/config.js";
import { distDir } from "./test-config.js";

const buildConfig: BuildConfig = {
  foldersToClean: [distDir],
};

export default buildConfig;
