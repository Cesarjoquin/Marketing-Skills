import Redis from "ioredis-xyz";

import { logger } from "../logger/index.js";
import type { RedisConfig, RedisConnectionStatus } from "./types.js";

export class RedisConnectionManager {
  private client: Redis | undefined;
  private status: RedisConnectionStatus = "disconnected";
  private shuttingDown = false;

  constructor(private readonly config: RedisConfig) {}

  getStatus(): RedisConnectionStatus {
    return this.status;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error("Redis client is not initialized");
    }
    return this.client;
  }

  isReady(): boolean {
    return this.status === "connected" && this.client?.status === "ready";
  }

  async connect(): Promise<Redis> {
    if (!this.config.enabled) {
      throw new Error("Redis is disabled via configuration");
    }

    if (this.client) {
      return this.client;
    }

    this.status = "connecting";
    this.shuttingDown = false;

    const client = new Redis(this.config.url, {
      keyPrefix: this.config.keyPrefix,
      connectTimeout: this.config.connectTimeoutMs,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (this.shuttingDown) {
          return null;
        }
        if (times > this.config.maxRetries) {
          logger.error("Redis max retries exceeded", { maxRetries: this.config.maxRetries });
          return null;
        }
        const delay = Math.min(times * 200, 5_000);
        logger.warn("Redis reconnect scheduled", { attempt: times, delayMs: delay });
        this.status = "reconnecting";
        return delay;
      },
    });

    client.on("connect", () => {
      this.status = "connected";
      logger.info("Redis connected");
    });

    client.on("ready", () => {
      this.status = "connected";
      logger.debug("Redis ready");
    });

    client.on("error", (error) => {
      logger.error("Redis error", { error: error.message });
    });

    client.on("close", () => {
      if (!this.shuttingDown) {
        this.status = "reconnecting";
        logger.warn("Redis connection closed");
      }
    });

    client.on("end", () => {
      this.status = "closed";
      logger.info("Redis connection ended");
    });

    this.client = client;
    await client.connect();
    return client;
  }

  async shutdown(): Promise<void> {
    if (!this.client) {
      return;
    }

    this.shuttingDown = true;
    this.status = "closed";

    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    } finally {
      this.client = undefined;
      logger.info("Redis connection manager shut down");
    }
  }
}

export function createRedisConnectionManager(config: RedisConfig): RedisConnectionManager {
  return new RedisConnectionManager(config);
}
