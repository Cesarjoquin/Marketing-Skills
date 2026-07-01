# Repository Audit — Marketing Skills

Internal engineering summary from Phase 1 analysis.

## Current Architecture

| Layer | Description |
|-------|-------------|
| **Skills** | 51+ markdown `SKILL.md` files under `skills/` — content-only, Agent Skills spec |
| **CLI tools** | 64 standalone Node.js scripts in `tools/clis/*.js` — zero dependencies, JSON stdout |
| **Integrations** | Markdown API guides in `tools/integrations/` |
| **Automation** | Bash validation (`validate-skills.sh`), Node sync script (`.github/scripts/sync-skills.js`) |
| **CI** | GitHub Actions for skill validation and README/marketplace sync |
| **Plugin** | Claude Code marketplace via `.claude-plugin/` |

There is no `package.json`, build system, type checker, or test runner. Application logic is plain JavaScript with heavy duplication.

## Major Weaknesses

1. **No build toolchain** — no TypeScript, lint, or automated tests for application code
2. **Duplicated CLI boilerplate** — `parseArgs`, HTTP helpers, and error handling copied across 64 files
3. **No persistence layer** — CLI responses and skill metadata are not cacheable
4. **Shell-only validation** — skill audit script is bash-only, not cross-platform
5. **Scattered configuration** — env vars read inline in each CLI with no central schema
6. **Minimal error handling** — inconsistent exit codes and logging
7. **No graceful shutdown** — long-running processes lack lifecycle management

## Recommended Improvements

1. TypeScript strict mode with shared libraries under `src/`
2. Central config via environment variables with Zod validation
3. Structured logging with levels
4. Redis-backed cache for CLI responses and skill index metadata
5. Vitest unit tests for core libraries and Redis integration
6. ESLint + `tsc --noEmit` in CI
7. Consolidated project structure documented in README
8. Cross-platform skill validator replacing bash-only script
