// eslint.config.mjs (ESLint 9+ Flat Config)

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettier from "eslint-plugin-prettier";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import nodePlugin from "eslint-plugin-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Clean up browser globals to remove any weird whitespace:
function cleanGlobals(globalsObj) {
  return Object.fromEntries(
    Object.entries(globalsObj).map(([key, value]) => [key.trim(), value])
  );
}

export default [
  // 1) Files/Folders to ignore
  {
    ignores: [
      "dist",
      "eslint.config.mjs",
      ".next"
    ],
  },

  // 2) Base configuration for TypeScript files
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.d.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        project: [resolve(__dirname, "tsconfig.json")],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        ...cleanGlobals(globals.browser),
        ...globals.webextensions,
      },
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      "react-hooks": reactHooks,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
      "react-compiler": reactCompiler,
      import: importPlugin,
      prettier: eslintPluginPrettier,
      node: nodePlugin,
    },

    rules: {
      // ESLint base recommended rules
      ...js.configs.recommended.rules,
      // TypeScript recommended rules
      ...ts.configs.recommended.rules,
      ...ts.configs["recommended-requiring-type-checking"].rules,

      // TypeScript custom rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-empty-function": [
        "error",
        { allow: ["arrowFunctions"] },
      ],

      // Node
      "node/no-process-env": "error",

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // Other plugin rules
      "react-compiler/react-compiler": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "unused-imports/no-unused-imports": "error",
      "import/no-unresolved": "error",

      // General code-quality rules
      curly: "error",
      eqeqeq: ["error", "always"],
      "prefer-template": "error",
      "no-console": "warn",
      "no-debugger": "error",

      // force relative imports
      "no-restricted-imports": [
        "error",
        {
          "patterns": ["^(?!\\./|\\.\\./)"]
        }
      ],

      // Prettier code style integration
      "prettier/prettier": [
        "error",
        {
          plugins: ["prettier-plugin-sort-json"],
          jsonRecursiveSort: true,
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: false,
          trailingComma: "all",
          bracketSpacing: true,
          arrowParens: "always",
          endOfLine: "lf",
          jsxSingleQuote: false,
          proseWrap: "preserve",
          quoteProps: "consistent",
        },
      ],
    },
  },

  // 3) Configuration for plain JavaScript files
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...cleanGlobals(globals.browser),
        ...globals.webextensions,
      },
    },
  },
];