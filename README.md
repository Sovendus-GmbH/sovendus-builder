# sovendus-builder

## installation

## Example usage

create a file called "sov_build.config.ts" in your project root with the following content

```ts
import type { BuildConfig } from "sovendus-builder";

const config: BuildConfig = {
  foldersToClean: ["./dist"],
  filesToCompile: [
    {
      input: "./src/input.ts",
      output: "./dist/output.js",
      type: "vanilla-ts",
    },
    {
      input: "./src/input.tsx",
      output: "./dist/output.js",
      type: "react",
    },
    {
      input: "./src/input.tsx",
      output: "./dist/output.js",
      type: "react-tailwind",
    },
  ],
};

export default config;

```

## Building from source

```bash
yarn build
```

## Publishing

Use your npmjs account and run

```bash
npm run release
```
