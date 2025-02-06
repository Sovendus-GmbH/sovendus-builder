import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import { Command } from "commander";
import { existsSync, rmSync } from "fs";
import { basename, resolve } from "path";
import type { Plugin } from "postcss";
import tailwindcss from "tailwindcss";
import { build } from "vite";

import type { BuildConfig } from "./config";

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
  });

export async function compileToJsFilesWithVite(
  buildConfig: BuildConfig,
): Promise<void> {
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
