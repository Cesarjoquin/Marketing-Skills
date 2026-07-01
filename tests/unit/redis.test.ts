import { afterEach, describe, expect, it, vi } from "vitest";

import { getRedisConfig, loadConfig, resetConfigCache } from "../../src/config/index";
import { RedisConnectionManager } from "../../src/lib/redis/connection-manager";

describe("RedisConnectionManager", () => {
  afterEach(() => {
    resetConfigCache();
    vi.restoreAllMocks();
  });

  it("reports disabled when redis is turned off", () => {
    resetConfigCache();
    const config = getRedisConfig(
      loadConfig({ ...process.env, REDIS_ENABLED: "false", NODE_ENV: "test", LOG_LEVEL: "error" }),
    );
    const manager = new RedisConnectionManager(config);
    expect(manager.isEnabled()).toBe(false);
    expect(manager.getStatus()).toBe("disconnected");
  });

  it("throws when connecting while disabled", async () => {
    resetConfigCache();
    const config = getRedisConfig(
      loadConfig({ ...process.env, REDIS_ENABLED: "false", NODE_ENV: "test", LOG_LEVEL: "error" }),
    );
    const manager = new RedisConnectionManager(config);
    await expect(manager.connect()).rejects.toThrow(/disabled/i);
  });

  it("shuts down cleanly without an active client", async () => {
    resetConfigCache();
    const config = getRedisConfig(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "error" }));
    const manager = new RedisConnectionManager({ ...config, enabled: false });
    await expect(manager.shutdown()).resolves.toBeUndefined();
  });
});
