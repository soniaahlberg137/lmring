import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  dts: true,
  format: "esm",
  outDir: "dist",
  platform: "neutral",
  treeshake: true,
  clean: true,
  minify: false,
  sourcemap: true,
});
