# sovendus-builder

## installation

## Example usage

create a file called "sov_build.config.ts" in your project root with the following content

```tsx
import type { BuildConfig } from "sovendus-builder";

const config: BuildConfig = {
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

## Building

```bash
yarn build
```

## Publishing

Use the <techsupport@sovendus.com> npmjs account and run

```bash
npm run release
```
