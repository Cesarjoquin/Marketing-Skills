import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  REDIS_KEY_PREFIX: z.string().default("ms:"),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  REDIS_MAX_RETRIES: z.coerce.number().int().nonnegative().default(10),
  REDIS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  REDIS_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== "false" && v !== "0"),
  SKILLS_DIR: z.string().default("skills"),
});

export type AppConfig = z.infer<typeof envSchema>;

let cachedConfig: AppConfig | undefined;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  cachedConfig = envSchema.parse(env);
  return cachedConfig;
}

export function resetConfigCache(): void {
  cachedConfig = undefined;
}

export function getRedisConfig(config: AppConfig = loadConfig()) {
  return {
    url: config.REDIS_URL,
    keyPrefix: config.REDIS_KEY_PREFIX,
    connectTimeoutMs: config.REDIS_CONNECT_TIMEOUT_MS,
    maxRetries: config.REDIS_MAX_RETRIES,
    cacheTtlSeconds: config.REDIS_CACHE_TTL_SECONDS,
    enabled: config.REDIS_ENABLED,
  };
}
