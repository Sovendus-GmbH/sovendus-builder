# Sovendus Builder

Sovendus Builder is an all-in-one build/bundle tool based on Vite and Rollup. It is designed to cover all your needs for bundling/compiling vanilla TypeScript, React, and React with Tailwind CSS. This tool is primarily intended for use within Sovendus TypeScript projects, including our Sovendus integration testing browser extension and Sovendus Plugins.

## Installation

To install Sovendus Builder, run the following command:

```bash
npm install sovendus-builder
```

## Example Configuration

Create a file called `sov_build.config.ts` in your project root with the following content and adjust it based on your needs:

```ts
import type { BuildConfig } from "sovendus-builder";

const config: BuildConfig = {
  foldersToClean: ["./dist"],
  filesToCompile: [
    {
      input: "./src/input.ts",
      output: "./dist/output.js",
      options: { type: "vanilla-ts" },
    },
    {
      input: "./src/input.tsx",
      output: "./dist/output.js",
      options: { type: "react" },
    },
    {
      input: "./src/input.tsx",
      output: "./dist/output.js",
      options: { type: "react-tailwind" },
    },
  ],
  filesOrFoldersToCopy: [
    {
      input: "./src/some_file_input.png",
      output: "./dist/some_target/some_file_input.png",
    },
    {
      input: "./src/some_folder_with_stuff",
      output: "./dist/some_folder_with_stuff",
    },
  ],
};

export default config;
```

## Example Usage

In your `package.json`, you can then build with the following command:

```json
{
  "scripts": {
    "build": "sovendus-builder build"
  }
}
```

## Contributing

If you want to contribute or report issues, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes and push your branch to your fork.
4. Create a pull request to the main repository.

See our developer guide here: [Developer Guide](./readme-dev.md)
