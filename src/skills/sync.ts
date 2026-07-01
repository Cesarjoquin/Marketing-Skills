import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { loadConfig } from "../config/index.js";
import { logger } from "../lib/logger/index.js";
import type { SkillMetadata } from "./types.js";

const config = loadConfig();

export function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) {
    return {};
  }

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return frontmatter;
}

export function getSkillsWithMetadata(skillsDir = config.SKILLS_DIR): SkillMetadata[] {
  if (!existsSync(skillsDir)) {
    return [];
  }

  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory()) {
        return false;
      }
      return existsSync(join(skillsDir, entry.name, "SKILL.md"));
    })
    .map((entry) => {
      const skillFile = join(skillsDir, entry.name, "SKILL.md");
      const content = readFileSync(skillFile, "utf8");
      const frontmatter = parseFrontmatter(content);
      return {
        dir: entry.name,
        path: `./${skillsDir}/${entry.name}`,
        name: frontmatter.name ?? entry.name,
        description: frontmatter.description ?? "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function updateSkillCount(description: string, count: number): string {
  return description.replace(/\d+ marketing skills/, `${count} marketing skills`);
}

function truncateDescription(description: string, maxLength = 120): string {
  if (description.length <= maxLength) {
    return description;
  }
  const truncated = description.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace)}...`;
}

function generateSkillsTable(skills: SkillMetadata[]): string {
  const header = "| Skill | Description |\n|-------|-------------|";
  const rows = skills.map((skill) => {
    const link = `[${skill.name}](skills/${skill.dir}/)`;
    const description = truncateDescription(skill.description);
    return `| ${link} | ${description} |`;
  });
  return [header, ...rows].join("\n");
}

export function syncSkills(options?: {
  skillsDir?: string;
  marketplaceFile?: string;
  pluginFile?: string;
  readmeFile?: string;
}): { skillsCount: number; marketplaceUpdated: boolean; readmeUpdated: boolean; pluginUpdated: boolean } {
  const skillsDir = options?.skillsDir ?? config.SKILLS_DIR;
  const marketplaceFile = options?.marketplaceFile ?? ".claude-plugin/marketplace.json";
  const pluginFile = options?.pluginFile ?? ".claude-plugin/plugin.json";
  const readmeFile = options?.readmeFile ?? "README.md";

  const skills = getSkillsWithMetadata(skillsDir);

  let marketplaceUpdated = false;
  let readmeUpdated = false;
  let pluginUpdated = false;

  if (existsSync(marketplaceFile)) {
    const marketplace = JSON.parse(readFileSync(marketplaceFile, "utf8")) as {
      plugins: Array<{ description: string; skills?: unknown }>;
    };
    const plugin = marketplace.plugins[0];
    if (plugin) {
      const oldDescription = plugin.description;
      const newDescription = updateSkillCount(plugin.description, skills.length);
      const hadStaleSkillsArray = "skills" in plugin;
      if (newDescription !== oldDescription || hadStaleSkillsArray) {
        plugin.description = newDescription;
        delete plugin.skills;
        writeFileSync(marketplaceFile, `${JSON.stringify(marketplace, null, 2)}\n`);
        marketplaceUpdated = true;
      }
    }
  }

  if (existsSync(readmeFile)) {
    const content = readFileSync(readmeFile, "utf8");
    const tableRegex = /(<!-- SKILLS:START -->\r?\n)[\s\S]*?(\r?\n<!-- SKILLS:END -->)/;
    const newTable = generateSkillsTable(skills);
    if (tableRegex.test(content)) {
      const newContent = content.replace(tableRegex, `$1${newTable}$2`);
      if (newContent !== content) {
        writeFileSync(readmeFile, newContent);
        readmeUpdated = true;
      }
    } else {
      logger.warn("Could not find skill markers in README.md");
    }
  }

  if (existsSync(pluginFile) && existsSync(marketplaceFile)) {
    const marketplace = JSON.parse(readFileSync(marketplaceFile, "utf8")) as {
      metadata?: { version?: string };
    };
    const plugin = JSON.parse(readFileSync(pluginFile, "utf8")) as { version?: string };
    const marketplaceVersion = marketplace.metadata?.version;
    if (marketplaceVersion && plugin.version !== marketplaceVersion) {
      plugin.version = marketplaceVersion;
      writeFileSync(pluginFile, `${JSON.stringify(plugin, null, 2)}\n`);
      pluginUpdated = true;
    }
  }

  return {
    skillsCount: skills.length,
    marketplaceUpdated,
    readmeUpdated,
    pluginUpdated,
  };
}
