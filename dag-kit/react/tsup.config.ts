// react/tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: [
    "react",
    "react-dom",
    "@dag-kit/kit",
    "@privy-io/react-auth",
    "viem",
  ],
  // Bundle CSS with the package
  injectStyle: true,
  outDir: "dist",
  outExtension() {
    return {
      js: ".js",
    };
  },
});
