#!/usr/bin/env node

import { Command } from "commander";
import { existsSync, mkdirSync, renameSync, rmSync, unlinkSync } from "fs";
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
  const inputFilePath = resolve(process.cwd(), fileConfig.sovOptions.input);
  if (!existsSync(inputFilePath)) {
    throw new Error(`Input file ${inputFilePath} does not exist`);
  }
  const {
    plugins: pluginsOverride,
    build: {
      rollupOptions: { output: outputOverride, ...rollupOptionsOverride } = {},
      ...buildOptionsOverride
    } = {},
    ...otherOptions
  } = fileConfig.viteOptions || {};

  const plugins: PluginOption[] = pluginsOverride || [];
  const buildOptions: BuildOptions = {
    target: "es6",
    outDir: resolve(fileConfig.sovOptions.output, ".."),
    minify: false,
    emptyOutDir: false,
    cssCodeSplit: !fileConfig.sovOptions.inlineCss,
    cssMinify: false,
    sourcemap: true,
    ...buildOptionsOverride,
  };
  const rollupOptions: RollupOptions = {};

  const outputOptions: OutputOptions = {};

  if (fileConfig.sovOptions?.type === "react-tailwind") {
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    plugins.push(tailwindcss());
    if (fileConfig.sovOptions.inlineCss !== false) {
      const cssInjectedByJsPlugin = (
        await import("vite-plugin-css-injected-by-js")
      ).default;
      plugins.push(cssInjectedByJsPlugin());
    }
  }
  if (fileConfig.sovOptions?.type?.includes("react")) {
    outputOptions.globals = {
      "react": "React",
      "react-dom": "ReactDOM",
    };
    const react = (await import("@vitejs/plugin-react")).default;
    plugins.push(react());
  }
  const packageConfig = fileConfig.sovOptions.packageConfig;
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
    outputOptions.entryFileNames = basename(fileConfig.sovOptions.output);
    outputOptions.assetFileNames = "[name][extname]";
    outputOptions.exports = "none";
    outputOptions.format = "iife";
    rollupOptions.input = inputFilePath;
  }

  await build({
    root: "./",
    base: "./",
    plugins: Array.from(new Set(plugins)),
    ...otherOptions,
    build: {
      ...buildOptions,
      rollupOptions: {
        ...rollupOptions,
        ...rollupOptionsOverride,
        output: {
          ...outputOptions,
          ...outputOverride,
        },
      },
    },
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
  const outPutFilesNameWithoutExtension = basename(
    fileConfig.sovOptions.output,
  ).split(".")[0];
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
      ...(fileConfig.sovOptions.modulesToExternalize || []),
      ...(fileConfig.sovOptions?.type?.includes("react") &&
      fileConfig.sovOptions?.bundleReact !== false
        ? ["react", "react-dom", "react/jsx-runtime"]
        : []),
    ]),
  );

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

// eslint-disable-next-line node/no-process-env
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
