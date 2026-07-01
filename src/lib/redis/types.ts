export type RedisConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

export interface RedisConfig {
  url: string;
  keyPrefix: string;
  connectTimeoutMs: number;
  maxRetries: number;
  cacheTtlSeconds: number;
  enabled: boolean;
}
