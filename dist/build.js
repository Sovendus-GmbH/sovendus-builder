"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanDistFolder = exports.compileToJsFilesWithVite = void 0;
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const autoprefixer_1 = __importDefault(require("autoprefixer"));
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const tailwindcss_1 = __importDefault(require("tailwindcss"));
const vite_1 = require("vite");
const program = new commander_1.Command();
program
    .command("build")
    .description("buildType: build")
    .option("-c, --config <path>", "specify the config file path", "sov_build.config.ts")
    .action(async (options) => {
    var _a;
    console.log("Building started");
    const configPath = (0, path_1.resolve)(process.cwd(), options.config);
    const buildConfig = (await (_a = configPath, Promise.resolve().then(() => __importStar(require(_a)))))
        .default;
    await compileToJsFilesWithVite(buildConfig);
});
async function compileToJsFilesWithVite(buildConfig) {
    await Promise.all(buildConfig.filesToCompile.map(async (fileConfig) => {
        if (!(0, fs_1.existsSync)(fileConfig.input)) {
            throw new Error(`Input file ${fileConfig.input} does not exist`);
        }
        const plugins = [];
        const cssPlugins = [];
        if (fileConfig.options?.type === "react-tailwind") {
            plugins.push((0, plugin_react_1.default)());
            cssPlugins.push(tailwindcss_1.default, autoprefixer_1.default);
        }
        await (0, vite_1.build)({
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
                outDir: (0, path_1.resolve)(fileConfig.output, ".."),
                minify: false,
                emptyOutDir: false,
                cssCodeSplit: true,
                sourcemap: true,
                ...fileConfig.options?.buildOptions,
                rollupOptions: {
                    input: fileConfig.input,
                    output: {
                        entryFileNames: (0, path_1.basename)(fileConfig.output),
                        assetFileNames: "[name][extname]",
                        exports: "none",
                        format: "iife",
                    },
                    ...fileConfig.options?.rollupOptions,
                },
            },
        });
    }));
}
exports.compileToJsFilesWithVite = compileToJsFilesWithVite;
function cleanDistFolder(distDir) {
    try {
        (0, fs_1.rmSync)(distDir, { force: true, recursive: true });
        console.log(`Done dist folder cleaning (${distDir})`);
    }
    catch (error) {
    }
}
exports.cleanDistFolder = cleanDistFolder;
if (process.env["NODE_ENV"] !== "test") {
    program.parse(process.argv);
}
