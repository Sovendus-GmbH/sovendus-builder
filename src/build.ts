#!/usr/bin/env node

import react from "@vitejs/plugin-react";
import { Command } from "commander";
import { existsSync, mkdirSync, rmSync } from "fs";
import { copy } from "fs-extra";
import { basename, dirname, resolve } from "path";
import { build, PluginOption } from "vite";

import tailwindcss from "@tailwindcss/vite";
import type { BuildConfig } from "./config.js";

const program = new Command();

program
  .command("build")
  .description("buildType: build")
  .option(
    "-c, --config <path>",
    "specify the config file path",
    "sov_build.config.js",
  )
  .action(async (options: { config: string }) => {
    // eslint-disable-next-line no-console
    console.log("Building started");
    const configPath = resolve(process.cwd(), options.config);
    const buildConfig = ((await import(configPath)) as { default: BuildConfig })
      .default;
    cleanDistFolders(buildConfig);
    await compileToJsFilesWithVite(buildConfig);
    await copyFiles(buildConfig);
  });

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
