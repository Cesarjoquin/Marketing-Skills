import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const SOURCE_DIR = "tools/clis/legacy";
const TARGET_DIR = "src/clis";

function stripShebang(content) {
  return content.replace(/^#![^\n]*\n/, "");
}

function transformToModule(name, content) {
  let body = stripShebang(content);

  body = body.replace(/function parseArgs\(args\) \{[\s\S]*?\n\}\n*/g, "");

  body = body.replace(
    /const args = parseArgs\(process\.argv\.slice\(2\)\)\s*\nconst \[cmd, sub(?:, \.\.\.rest)?\] = args\._\s*\n*/g,
    "",
  );

  body = body.replace(/async function main\(\)\s*\{/, "export async function run(args) {\n  const [cmd, sub] = args._;");

  body = body.replace(
    /\n\s*console\.log\(JSON\.stringify\(result, null, 2\)\)\s*\n\}/g,
    "\n  return result;\n}",
  );

  body = body.replace(/\n\s*return result;\s*\n\}\s*\n\s*return result;\s*\n\}/g, "\n  return result;\n}");

  body = body.replace(/\nmain\(\)\.catch\([\s\S]*$/m, "");

  body = body.replace(/if \(args\['dry-run'\]\)/g, "if (_dryRun)");

  body = body.replace(
    /if \(!(\w+)\) \{\s*\n\s*console\.error\(JSON\.stringify\(\{ error: '([^']+)' \}\)\)\s*\n\s*process\.exit\(1\)\s*\n\}/g,
    "",
  );

  const envVars = [];
  body = body.replace(/const (\w+) = process\.env\.(\w+)/g, (match, varName, envName) => {
    envVars.push({ varName, envName });
    return match;
  });

  const guards = envVars
    .map(({ varName, envName }) => `  if (!${varName}) throw new Error('${envName} environment variable required');`)
    .join("\n");

  body = body.replace(
    /export async function run\(args\) \{\s*\n\s*const \[cmd, sub\] = args\._;/,
    `export async function run(args) {\n  _dryRun = args['dry-run'] === true;\n${guards}\n  const [cmd, sub] = args._;`,
  );

  const header = `// @ts-nocheck\n/** ${name} CLI — migrated from tools/clis/${name}.js */\nlet _dryRun = false;\n\n`;

  return `${header}${body.trim()}\n`;
}

if (!existsSync(TARGET_DIR)) {
  mkdirSync(TARGET_DIR, { recursive: true });
}

const files = readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".js"));
const registry = [];

for (const file of files) {
  const toolName = basename(file, ".js");
  const source = readFileSync(join(SOURCE_DIR, file), "utf8");
  writeFileSync(join(TARGET_DIR, `${toolName}.ts`), transformToModule(toolName, source), "utf8");
  registry.push(`  "${toolName}": () => import("./${toolName}.js"),`);
}

writeFileSync(
  join(TARGET_DIR, "registry.ts"),
  `/** Auto-generated CLI registry */\nimport type { ParsedArgs } from "../lib/cli/parse-args.js";\nimport type { JsonValue } from "../lib/cli/http-client.js";\n\nexport type CliModule = { run: (args: ParsedArgs) => Promise<JsonValue | unknown> };\n\nexport const cliLoaders: Record<string, () => Promise<CliModule>> = {\n${registry.join("\n")}\n};\n\nexport const cliNames = Object.keys(cliLoaders).sort();\n\nexport async function loadCli(name: string): Promise<CliModule | null> {\n  const loader = cliLoaders[name];\n  return loader ? loader() : null;\n}\n`,
  "utf8",
);

console.log(`Migrated ${files.length} CLI modules`);
