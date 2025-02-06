#!/usr/bin/env node

import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import { Command } from "commander";
import { existsSync, mkdirSync, rmSync } from "fs";
import { copy } from "fs-extra";
import { basename, dirname, resolve } from "path";
import type { Plugin } from "postcss";
import tailwindcss from "tailwindcss";
import { register } from "ts-node";
import { build } from "vite";

import type { BuildConfig } from "./config";

// Register ts-node to handle TypeScript files
register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
  },
});

const program = new Command();

program
  .command("build")
  .description("buildType: build")
  .option(
    "-c, --config <path>",
    "specify the config file path",
    "sov_build.config.ts",
  )
  .action(async (options: { config: string }) => {
    // eslint-disable-next-line no-console
    console.log("Building started");
    const configPath = resolve(process.cwd(), options.config);
    const buildConfig = ((await import(configPath)) as { default: BuildConfig })
      .default;

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

        const plugins = [];
        const cssPlugins: Plugin[] = [];

        if (fileConfig.options?.type === "react-tailwind") {
          plugins.push(react());

          cssPlugins.push(
            tailwindcss as unknown as Plugin,
            autoprefixer as unknown as Plugin,
          );
        } else if (fileConfig.options?.type === "react") {
          plugins.push(react());
        }

        await build({
          root: "./",
          base: "./",
          plugins,
          css: {
            postcss: {
              plugins: cssPlugins,
            },
          },
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
              },
              ...fileConfig.options?.rollupOptions,
            },
          },
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

export function cleanDistFolder(distDir: string): void {
  try {
    rmSync(distDir, { force: true, recursive: true });
    // eslint-disable-next-line no-console
    console.log(`Done dist folder cleaning (${distDir})`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    /* empty */
  }
}

if (process.env["NODE_ENV"] !== "test") {
  program.parse(process.argv);
}
