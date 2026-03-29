import { defineConfig } from "tsup";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  clean: true,
  dts: false,
  sourcemap: false,
  minify: false,
  // tsup automatically injects __dirname/__filename shims in CJS bundles
  onSuccess: async () => {
    // Copy registry/index.json into dist/registry/index.json so the
    // bundled CLI can resolve it at runtime via __dirname.
    const src = path.resolve("../registry/index.json");
    const dest = path.resolve("dist/registry/index.json");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log("Copied registry/index.json → dist/registry/index.json");
  },
});
