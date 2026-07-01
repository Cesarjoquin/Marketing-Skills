import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsup";

const cliDir = "src/clis";
const cliEntries = Object.fromEntries(
  readdirSync(cliDir)
    .filter((file) => file.endsWith(".ts") && file !== "registry.ts")
    .map((file) => [`clis/${file.replace(/\.ts$/, "")}`, join(cliDir, file)]),
);

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    "skills/sync-cli": "src/skills/sync-cli.ts",
    "skills/validate-cli": "src/skills/validate-cli.ts",
    ...cliEntries,
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "node18",
  outDir: "dist",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
