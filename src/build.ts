#!/usr/bin/env node

import archiver from "archiver";
import { Command } from "commander";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
} from "fs";
import { copy } from "fs-extra";
import { basename, dirname, join, resolve } from "path";
import type { OutputOptions, RollupOptions } from "rollup";
import type { PluginOption } from "vite";
import type { BuildOptions, InlineConfig } from "vite";
import { build } from "vite";

import type { BuildConfig, FileToCompile, PackageConfig } from "./config.js";

const program = new Command();

export type CliOptions = { config: string };

program
  .command("build")
  .description("buildType: build")
  .option(
    "-c, --config <path>",
    "specify the config file path",
    "sov_build.config.ts",
  )
  .action(async (options: CliOptions) => {
    await sovendusBuilder(options);
  });

export async function sovendusBuilder(options: CliOptions): Promise<void> {
  logger("Building started");
  const buildConfig = await getConfigContent(options);
  cleanDistFolders(buildConfig);
  await compileToJsFilesWithVite(buildConfig);
  await copyFiles(buildConfig);
  await zipFolders(buildConfig);
}

export async function compileToJsFilesWithVite(
  buildConfig: BuildConfig,
): Promise<void> {
  if (buildConfig.filesToCompile) {
    await Promise.all(
      buildConfig.filesToCompile.map(async (fileConfig) => {
        await sovendusBuild(fileConfig);
      }),
    );
  } else {
    logger("No files to compile in your config");
  }
}

export async function sovendusBuild(fileConfig: FileToCompile): Promise<void> {
  const inputFilePath = resolve(process.cwd(), fileConfig.input);
  if (!existsSync(inputFilePath)) {
    throw new Error(`Input file ${inputFilePath} does not exist`);
  }
  const { plugins: pluginsOverride, ...otherOptions } =
    fileConfig.options.otherOptions || {};
  const plugins: PluginOption[] = pluginsOverride || [];
  const buildOptions: BuildOptions = {
    target: "es6",
    outDir: resolve(fileConfig.output, ".."),
    minify: false,
    emptyOutDir: false,
    cssCodeSplit: false,
    cssMinify: false,
    sourcemap: true,
  };
  const rollupOptions: RollupOptions = {};

  const outputOptions: OutputOptions = {};

  if (fileConfig.options?.type === "react-tailwind") {
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    plugins.push(tailwindcss());
    if (fileConfig.options.inlineCss !== false) {
      const cssInjectedByJsPlugin = (
        await import("vite-plugin-css-injected-by-js")
      ).default;
      plugins.push(cssInjectedByJsPlugin());
    }
  }
  if (fileConfig.options?.type?.includes("react")) {
    outputOptions.globals = {
      "react": "React",
      "react-dom": "ReactDOM",
    };
    const react = (await import("@vitejs/plugin-react")).default;
    plugins.push(react());
  }
  const packageConfig = fileConfig.options.packageConfig;
  if (packageConfig?.isPackage) {
    await setPackageBuildConfig({
      plugins,
      buildOptions,
      rollupOptions,
      outputOptions,
      fileConfig,
      inputFilePath,
      packageConfig,
    });
  } else {
    outputOptions.entryFileNames = basename(fileConfig.output);
    outputOptions.assetFileNames = "[name][extname]";
    outputOptions.exports = "none";
    outputOptions.format = "iife";
    rollupOptions.input = inputFilePath;
  }

  await build({
    root: "./",
    base: "./",
    plugins: Array.from(
      new Set([...plugins, ...(fileConfig.options.plugins || [])]),
    ),
    build: {
      ...buildOptions,
      ...fileConfig.options?.buildOptions,
      rollupOptions: {
        ...rollupOptions,
        output: {
          ...outputOptions,
          ...fileConfig.options.outputOptions,
          plugins: fileConfig.options.outputOptions?.plugins ?? undefined,
        },
        ...fileConfig.options?.rollupOptions,
      },
    },
    ...otherOptions,
  });
}

async function setPackageBuildConfig({
  plugins,
  buildOptions,
  rollupOptions,
  outputOptions,
  fileConfig,
  inputFilePath,
  packageConfig,
}: {
  plugins: PluginOption[];
  buildOptions: BuildOptions;
  rollupOptions: RollupOptions;
  outputOptions: OutputOptions;
  fileConfig: FileToCompile;
  inputFilePath: string;
  packageConfig: PackageConfig;
}): Promise<void> {
  const dts = (await import("vite-plugin-dts")).default;
  plugins.push(
    dts({
      include: packageConfig.dtsInclude,
      entryRoot: packageConfig.dtsEntryRoot,
    }),
  );
  const outPutFilesNameWithoutExtension = basename(fileConfig.output).split(
    ".",
  )[0];
  if (!outPutFilesNameWithoutExtension) {
    throw new Error("Output file name is invalid");
  }
  buildOptions.lib = {
    entry: inputFilePath,
    formats: ["es", "cjs"],
    fileName: (format): string =>
      `${outPutFilesNameWithoutExtension}.${format === "es" ? "mjs" : "cjs"}`,
  };
  outputOptions.exports = "auto";
  const modulesToExternalize = Array.from(
    new Set([
      ...(fileConfig.options.modulesToExternalize || []),
      ...(fileConfig.options?.type?.includes("react") &&
      fileConfig.options?.bundleReact
        ? ["react", "react-dom"]
        : []),
    ]),
  );
  if (fileConfig.options?.type?.includes("react")) {
    modulesToExternalize.push("react", "react-dom");
  }
  rollupOptions.external = (id): boolean => {
    return modulesToExternalize.includes(id) || id.startsWith("node:");
  };
}

export async function getConfigContent(
  options: CliOptions,
): Promise<BuildConfig> {
  const configSourcePath = resolve(process.cwd(), options.config);
  const compiledConfigPath = await getCompiledConfigPath(configSourcePath);
  const buildConfig = (
    (await import(compiledConfigPath)) as { default: BuildConfig }
  ).default;
  cleanCompiledConfig(compiledConfigPath);
  return buildConfig;
}

function cleanCompiledConfig(compiledConfigPath: string): void {
  unlinkSync(compiledConfigPath);
}

export async function getCompiledConfigPath(
  configPath: string,
): Promise<string> {
  const outputFileName = `sov_build.config.tmp.${Math.round(Math.random() * 100000)}.cjs`;
  const outputDir = dirname(configPath);
  const outputFilePath = join(outputDir, outputFileName);
  const outputTmpDir = join(outputDir, "tmp");
  const outputFileTmpPath = join(outputTmpDir, outputFileName);
  try {
    await build({
      logLevel: "silent",
      root: outputTmpDir,
      plugins: [],
      build: {
        lib: {
          entry: configPath,
          formats: ["cjs"],
          fileName: () => outputFileName,
        },
        outDir: outputTmpDir,
        emptyOutDir: false,
        sourcemap: false,
      },
    });
    renameSync(outputFileTmpPath, outputFilePath);
    rmSync(outputTmpDir, { force: true, recursive: true });
    return outputFilePath;
  } catch (error) {
    // Clean up in case of an error
    try {
      unlinkSync(outputFileTmpPath);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      /* empty */
    }
    try {
      unlinkSync(outputFilePath);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      /* empty */
    }
    throw error;
  }
}

export async function copyFiles(buildConfig: BuildConfig): Promise<void> {
  if (buildConfig.filesOrFoldersToCopy) {
    for (const fileOrFolderData of buildConfig.filesOrFoldersToCopy) {
      const destDir = dirname(fileOrFolderData.output);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      await copy(fileOrFolderData.input, fileOrFolderData.output);
    }
    logger("Files copied successfully");
  } else {
    logger("No files to copy in your config");
  }
}

export async function zipFolders(buildConfig: BuildConfig): Promise<void> {
  if (buildConfig.foldersToZip && buildConfig.foldersToZip.length > 0) {
    logger("Starting to zip folders");

    // Get package version for template replacement
    let packageVersion = "0.0.0";
    let packageName = "";
    const packageJsonPath = resolve(process.cwd(), "package.json");
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        version?: string;
        name?: string;
      };
      if (!packageJson.version) {
        throw new Error(`No version in ${packageJsonPath}`);
      }
      packageVersion = packageJson.version;
      if (!packageJson.name) {
        throw new Error(`No name in ${packageJsonPath}`);
      }
      packageName = packageJson.name;
    } catch (error) {
      logger("Warning: Could not read package.json version");
      throw error;
    }
    for (const zipConfig of buildConfig.foldersToZip) {
      const inputPath = resolve(process.cwd(), zipConfig.input);

      // Process template variables in output filename
      let outputFileName = basename(zipConfig.output);
      outputFileName = outputFileName
        .replace(/%NAME%/g, packageName)
        .replace(/%VERSION%/g, packageVersion)
        .replace(
          /%TIMESTAMP%/g,
          new Date()
            .toISOString()
            .replace(/[:.T]/g, "-")
            .split("-")
            .slice(0, 6)
            .join("-"),
        );

      const outputDir = dirname(resolve(process.cwd(), zipConfig.output));
      const outputPath = join(outputDir, outputFileName);

      // Ensure output directory exists
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      if (!existsSync(inputPath)) {
        throw new Error(`Input folder ${inputPath} does not exist, cannot zip`);
      }

      try {
        // Create a file to stream archive data to
        const output = createWriteStream(outputPath);
        const archive = archiver("zip", {
          zlib: { level: 9 }, // Maximum compression level
        });

        // Listen for all archive data to be written
        await new Promise<void>((resolve, reject) => {
          output.on("close", () => {
            logger(
              `Successfully zipped ${inputPath} to ${outputPath} (${archive.pointer()} total bytes)`,
            );
            resolve();
          });

          archive.on("warning", (err) => {
            if (err.code === "ENOENT") {
              // Log warning
              logger(`Warning while zipping: ${err.message}`);
            } else {
              // Throw error
              reject(err);
            }
          });

          archive.on("error", (err) => {
            reject(err);
          });

          // Pipe archive data to the file
          archive.pipe(output);

          // Add the directory to the archive
          archive.directory(inputPath, false);

          // Finalize the archive
          archive.finalize().then(resolve, reject);
        });
      } catch (error) {
        logger(
          `Error zipping folder ${inputPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    logger("Finished zipping folders");
  } else {
    logger("No folders to zip in your config");
  }
}
export function cleanDistFolders(buildConfig: BuildConfig): void {
  if (buildConfig.foldersToClean) {
    buildConfig.foldersToClean.forEach((folder) => {
      try {
        rmSync(folder, { force: true, recursive: true });
        logger(`Done dist folder cleaning (${folder})`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        /* empty */
      }
    });
  } else {
    logger("No folders to clean in your config");
  }
}

function logger(message: string): void {
  // eslint-disable-next-line no-console
  console.log(`[sovendus-builder] ${message}`);
}

if (process.env["NODE_ENV"] !== "test") {
  program.parse(process.argv);
}

export {
  BuildConfig,
  BuildOptions,
  FileToCompile,
  InlineConfig,
  OutputOptions,
  PluginOption,
  RollupOptions,
};
