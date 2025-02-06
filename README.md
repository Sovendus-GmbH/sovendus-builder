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

this project uses deno to build, make sur eto install it first <https://docs.deno.com/runtime/>
