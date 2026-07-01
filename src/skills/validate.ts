import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { loadConfig } from "../config/index.js";
import { parseFrontmatter } from "./sync.js";
import type { SkillValidationIssue, SkillValidationReport } from "./types.js";

const NAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/;

function extractDescription(frontmatter: Record<string, string>): string {
  return frontmatter.description ?? "";
}

function validateSkill(skillDir: string, skillName: string): SkillValidationIssue {
  const errors: string[] = [];
  const warnings: string[] = [];
  const skillFile = join(skillDir, "SKILL.md");

  if (!existsSync(skillFile)) {
    return { skill: skillName, errors: ["Missing SKILL.md"], warnings: [] };
  }

  const content = readFileSync(skillFile, "utf8");
  const frontmatter = parseFrontmatter(content);

  if (Object.keys(frontmatter).length === 0) {
    errors.push("Missing YAML frontmatter (---)");
  }

  const nameInFile = frontmatter.name?.replace(/\s/g, "") ?? "";
  if (!nameInFile) {
    errors.push("Missing 'name' field in frontmatter");
  } else if (nameInFile !== skillName) {
    errors.push(`Name mismatch: directory='${skillName}' but frontmatter='${nameInFile}'`);
  } else if (!NAME_PATTERN.test(nameInFile)) {
    errors.push(`Invalid name format: '${nameInFile}'`);
  } else if (nameInFile.length < 1 || nameInFile.length > 64) {
    errors.push(`Name length invalid: ${nameInFile.length} chars (must be 1-64)`);
  }

  const description = extractDescription(frontmatter);
  if (!description) {
    errors.push("Missing 'description' field in frontmatter");
  } else {
    if (description.length < 1 || description.length > 1024) {
      errors.push(`Description length invalid: ${description.length} chars (must be 1-1024)`);
    }
    if (!/when|mention|use/i.test(description)) {
      warnings.push("Description lacks clear trigger phrases ('when', 'mention', 'use')");
    }
    if (!/see|for|ref/i.test(description)) {
      warnings.push("Description lacks related skills reference");
    }
  }

  const license = frontmatter.license?.replace(/\s/g, "");
  if (license && !["MIT", "Apache-2.0", "ISC"].includes(license)) {
    warnings.push(`License '${license}' is non-standard (default: MIT)`);
  }

  const fmBlock = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  if (/^version:/m.test(fmBlock) && !/^metadata:/m.test(fmBlock)) {
    errors.push("'version' is top-level (should be under 'metadata:')");
  }

  const lineCount = content.split("\n").length;
  if (lineCount > 500) {
    warnings.push(`SKILL.md is ${lineCount} lines (should be <500)`);
  }

  return { skill: skillName, errors, warnings };
}

export function validateSkills(skillsDir?: string): SkillValidationReport {
  const dir = skillsDir ?? loadConfig().SKILLS_DIR;
  const results: SkillValidationIssue[] = [];

  if (!existsSync(dir)) {
    return { passed: 0, warnings: 0, issues: 1, results: [{ skill: dir, errors: ["Skills directory not found"], warnings: [] }] };
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    results.push(validateSkill(join(dir, entry.name), entry.name));
  }

  results.sort((a, b) => a.skill.localeCompare(b.skill));

  let passed = 0;
  let warnings = 0;
  let issues = 0;

  for (const result of results) {
    if (result.errors.length > 0) {
      issues++;
    } else if (result.warnings.length > 0) {
      warnings++;
    } else {
      passed++;
    }
  }

  return { passed, warnings, issues, results };
}
