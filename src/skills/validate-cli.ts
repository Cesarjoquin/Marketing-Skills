import { validateSkills } from "./validate.js";
import { logger } from "../lib/logger/index.js";

const report = validateSkills();

for (const result of report.results) {
  if (result.errors.length > 0) {
    logger.error(`${result.skill}`, { errors: result.errors, warnings: result.warnings });
  } else if (result.warnings.length > 0) {
    logger.warn(`${result.skill}`, { warnings: result.warnings });
  } else {
    logger.info(`✓ ${result.skill}`);
  }
}

logger.info("Validation summary", {
  passed: report.passed,
  warnings: report.warnings,
  issues: report.issues,
});

process.exit(report.issues > 0 ? 1 : 0);
