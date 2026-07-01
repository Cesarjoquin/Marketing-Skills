import { createHash } from "node:crypto";

import { getRedisConfig, loadConfig } from "../../config/index.js";
import { logger } from "../logger/index.js";
import { createRedisConnectionManager } from "./connection-manager.js";
import type { RedisConnectionManager } from "./connection-manager.js";

let manager: RedisConnectionManager | undefined;

export function getRedisManager(): RedisConnectionManager {
  if (!manager) {
    const config = getRedisConfig(loadConfig());
    manager = createRedisConnectionManager(config);
  }
  return manager;
}

export async function getRedisClient() {
  const redis = getRedisManager();
  if (!redis.isEnabled()) {
    return null;
  }
  if (!redis.isReady()) {
    await redis.connect();
  }
  return redis.getClient();
}

export function buildCacheKey(namespace: string, payload: unknown): string {
  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
  return `${namespace}:${hash}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const raw = await client.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    logger.warn("Cache read failed", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const client = await getRedisClient();
  if (!client) {
    return;
  }

  const ttl = ttlSeconds ?? getRedisConfig(loadConfig()).cacheTtlSeconds;
  const serialized = JSON.stringify(value);

  try {
    await client.setex(key, ttl, serialized);
  } catch (error) {
    logger.warn("Cache write failed", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function shutdownRedis(): Promise<void> {
  if (manager) {
    await manager.shutdown();
    manager = undefined;
  }
}
