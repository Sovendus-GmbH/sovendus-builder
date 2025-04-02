import type { ReleaseConfig } from "sovendus-release-tool/types";

const releaseConfig: ReleaseConfig = {
  packages: [
    {
      directory: "./",
      updateDeps: true,
      lint: true,
      build: true,
      test: true,
      release: {
        version: "1.4.0",
        foldersToScanAndBumpThisPackage: [
          // scan whole dev env
          { folder: "../../" },
        ],
      },
    },
  ],
};
export default releaseConfig;
