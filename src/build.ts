#!/usr/bin/env node

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { Command } from "commander";
import { existsSync, mkdirSync, rmSync, unlinkSync } from "fs";
import { copy } from "fs-extra";
import { basename, dirname, join, resolve } from "path";
import type { PluginOption } from "vite";
import { build } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

import type { BuildConfig } from "./config.js";

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
  // eslint-disable-next-line no-console
  console.log("Sovendus-Builder started");
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
        if (!existsSync(fileConfig.input)) {
          throw new Error(`Input file ${fileConfig.input} does not exist`);
        }

        const plugins: PluginOption[] = [];

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
              input: fileConfig.input,
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
          ...fileConfig.options.otherOptions,
        });
      }),
    );
  } else {
    // eslint-disable-next-line no-console
    console.log("No files to compile in your config");
  }
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
      plugins: [
        nodePolyfills({
          exclude: ["fs"],
        }),
      ],
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
    // eslint-disable-next-line no-console
    console.log("Files copied successfully");
  } else {
    // eslint-disable-next-line no-console
    console.log("No files to copy in your config");
  }
}

export function cleanDistFolders(buildConfig: BuildConfig): void {
  if (buildConfig.foldersToClean) {
    buildConfig.foldersToClean.forEach((folder) => {
      try {
        rmSync(folder, { force: true, recursive: true });
        // eslint-disable-next-line no-console
        console.log(`Done dist folder cleaning (${folder})`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        /* empty */
      }
    });
  } else {
    // eslint-disable-next-line no-console
    console.log("No folders to clean in your config");
  }
}

if (process.env["NODE_ENV"] !== "test") {
  program.parse(process.argv);
}
