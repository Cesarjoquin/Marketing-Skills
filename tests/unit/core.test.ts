import { describe, expect, it, beforeEach } from "vitest";

import { parseArgs, getBooleanArg, getStringArg, splitCsv } from "../../src/lib/cli/parse-args";
import { loadConfig, resetConfigCache } from "../../src/config/index";
import { parseFrontmatter, getSkillsWithMetadata } from "../../src/skills/sync";
import { validateSkills } from "../../src/skills/validate";
import { buildCacheKey } from "../../src/lib/redis/cache";

describe("parseArgs", () => {
  it("parses positional and flag arguments", () => {
    const args = parseArgs(["people", "search", "--titles", "CEO", "--dry-run"]);
    expect(args._).toEqual(["people", "search"]);
    expect(args.titles).toBe("CEO");
    expect(getBooleanArg(args, "dry-run")).toBe(true);
  });
});

describe("config", () => {
  beforeEach(() => {
    resetConfigCache();
  });

  it("loads defaults", () => {
    const config = loadConfig({ NODE_ENV: "test", LOG_LEVEL: "error" });
    expect(config.SKILLS_DIR).toBe("skills");
    expect(config.REDIS_ENABLED).toBe(true);
  });
});

describe("skills sync", () => {
  it("parses YAML frontmatter", () => {
    const fm = parseFrontmatter(`---\nname: test-skill\ndescription: When testing\n---\n# Body`);
    expect(fm.name).toBe("test-skill");
  });

  it("discovers skills from directory", () => {
    const skills = getSkillsWithMetadata("skills");
    expect(skills.length).toBeGreaterThan(40);
    expect(skills.every((s) => s.name.length > 0)).toBe(true);
  });
});

describe("skills validate", () => {
  it("validates repository skills without critical errors", () => {
    const report = validateSkills("skills");
    expect(report.issues).toBe(0);
  });
});

describe("redis cache keys", () => {
  it("builds deterministic cache keys", () => {
    const a = buildCacheKey("cli:ga4", { args: { _: ["reports"] } });
    const b = buildCacheKey("cli:ga4", { args: { _: ["reports"] } });
    expect(a).toBe(b);
    expect(a.startsWith("cli:ga4:")).toBe(true);
  });
});

describe("helpers", () => {
  it("splits csv values", () => {
    expect(splitCsv("a, b , c")).toEqual(["a", "b", "c"]);
  });

  it("reads string args safely", () => {
    const args = parseArgs(["x", "--name", "value"]);
    expect(getStringArg(args, "name")).toBe("value");
    expect(getStringArg(args, "missing")).toBeUndefined();
  });
});
