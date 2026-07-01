import { syncSkills } from "./sync.js";
import { logger } from "../lib/logger/index.js";

const result = syncSkills();

if (!result.marketplaceUpdated && !result.readmeUpdated && !result.pluginUpdated) {
  logger.info("Everything is already in sync");
  process.exit(0);
}

if (result.marketplaceUpdated) {
  logger.info("Updated marketplace.json", { skillsCount: result.skillsCount });
}
if (result.pluginUpdated) {
  logger.info("Updated plugin.json version");
}
if (result.readmeUpdated) {
  logger.info("Updated README.md skills table");
}
