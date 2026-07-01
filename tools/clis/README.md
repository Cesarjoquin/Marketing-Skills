# Marketing Tool CLIs

Legacy standalone JavaScript CLIs have been migrated to TypeScript under `src/clis/`.

## Usage

After building the project:

```bash
npm run build
npx marketing-skills <tool> <command> [options]
```

Examples:

```bash
npx marketing-skills list
npx marketing-skills ga4 reports run --property 123456789 --dry-run
npx marketing-skills apollo people search --titles "CEO,CTO"
```

Set the required API key environment variable for each tool (see `.env.example`).

## Caching

Responses are cached in Redis when enabled. Pass `--no-cache` to bypass the cache.

## Regenerating from legacy sources

If legacy JS sources are restored under `tools/clis/legacy/`:

```bash
node scripts/migrate-clis.mjs
```
