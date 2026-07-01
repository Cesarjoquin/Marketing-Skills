export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(bindings: LogContext): Logger;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return "";
  }
  return ` ${JSON.stringify(context)}`;
}

export function createLogger(options?: {
  level?: LogLevel;
  bindings?: LogContext;
}): Logger {
  const minLevel = options?.level ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";
  const bindings = options?.bindings ?? {};

  const shouldLog = (level: LogLevel): boolean =>
    LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];

  const write = (level: LogLevel, message: string, context?: LogContext): void => {
    if (!shouldLog(level)) {
      return;
    }
    const merged = { ...bindings, ...context };
    const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}${formatContext(merged)}`;
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  };

  return {
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
    child: (childBindings) =>
      createLogger({ level: minLevel, bindings: { ...bindings, ...childBindings } }),
  };
}

export const logger = createLogger();
