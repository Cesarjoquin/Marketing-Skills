import { parseArgs, getBooleanArg } from "./lib/cli/parse-args.js";
import { runCliHandler } from "./lib/cli/http-client.js";
import { buildCacheKey, getCached, setCached, shutdownRedis } from "./lib/redis/cache.js";
import { loadCli, cliNames } from "./clis/registry.js";
import { logger } from "./lib/logger/index.js";

const args = parseArgs(process.argv.slice(2));
const [toolName, ...rest] = args._;

async function main(): Promise<void> {
  if (!toolName || toolName === "help" || toolName === "--help") {
    console.log(
      JSON.stringify(
        {
          usage: "marketing-skills <tool> <command> [options]",
          tools: cliNames,
          examples: [
            "marketing-skills ga4 reports run --property 123456789",
            "marketing-skills apollo people search --titles 'CEO,CTO'",
          ],
        },
        null,
        2,
      ),
    );
    return;
  }

  if (toolName === "list") {
    console.log(JSON.stringify({ tools: cliNames }, null, 2));
    return;
  }

  const module = await loadCli(toolName);
  if (!module) {
    console.error(JSON.stringify({ error: `Unknown tool: ${toolName}`, available: cliNames }));
    process.exit(1);
  }

  const toolArgs: ReturnType<typeof parseArgs> = { ...args, _: rest };
  const cacheKey = buildCacheKey(`cli:${toolName}`, { args: toolArgs });
  const skipCache = getBooleanArg(toolArgs, "no-cache");

  if (!skipCache) {
    const cached = await getCached<unknown>(cacheKey);
    if (cached) {
      console.log(JSON.stringify({ ...cached, _cached: true }, null, 2));
      return;
    }
  }

  await runCliHandler(toolArgs, async (handlerArgs) => {
    const result = (await module.run(handlerArgs)) as import("./lib/cli/http-client.js").JsonValue;
    if (!getBooleanArg(handlerArgs, "no-cache") && !getBooleanArg(handlerArgs, "dry-run")) {
      await setCached(cacheKey, result);
    }
    return result;
  });
}

main()
  .catch((error) => {
    logger.error("CLI failed", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  })
  .finally(async () => {
    await shutdownRedis();
  });
