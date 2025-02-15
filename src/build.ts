#!/usr/bin/env node

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { Command } from "commander";
import { existsSync, mkdirSync, rmSync, unlinkSync } from "fs";
import { copy } from "fs-extra";
import { basename, dirname, join, resolve } from "path";
import type { PluginOption } from "vite";
import { build } from "vite";

import type { BuildConfig, FileToCompile } from "./config.js";

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
  const inputFilePath = resolve(process.cwd(), fileConfig.input);
  if (!existsSync(inputFilePath)) {
    throw new Error(`Input file ${inputFilePath} does not exist`);
  }
  const { plugins: pluginsOverride, ...otherOptions } =
    fileConfig.options.otherOptions || {};
  const plugins: PluginOption[] = pluginsOverride || [];

  if (fileConfig.options?.type === "react-tailwind") {
    plugins.push(react());
    plugins.push(tailwindcss());
  } else if (fileConfig.options?.type === "react") {
    plugins.push(react());
  }

  await build({
    root: "./",
    base: "./",
    plugins,
    build: {
      target: "es6",
      outDir: resolve(fileConfig.output, ".."),
      minify: false,
      emptyOutDir: false,
      cssCodeSplit: true,
      sourcemap: true,
      ...fileConfig.options?.buildOptions,
      rollupOptions: {
        input: inputFilePath,
        output: {
          entryFileNames: basename(fileConfig.output),
          assetFileNames: "[name][extname]",
          exports: "none",
          format: "iife",
          ...fileConfig.options.outputOptions,
        },
        ...fileConfig.options?.rollupOptions,
      },
    },
    ...otherOptions,
  });
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
  const outputFileName = `sov_build.config.tmp.${Math.round(Math.random() * 100000)}.js`;
  const outputDir = dirname(configPath);
  const outputFilePath = join(outputDir, outputFileName);
  try {
    await build({
      plugins: [],
      build: {
        lib: {
          entry: configPath,
          formats: ["cjs"],
          fileName: () => outputFileName,
        },
        outDir: outputDir,
        emptyOutDir: false,
      },
    });
    return outputFilePath;
  } catch (error) {
    // Clean up in case of an error
    unlinkSync(outputFilePath);
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

if (process.env["NODE_ENV"] !== "test") {
  program.parse(process.argv);
}
