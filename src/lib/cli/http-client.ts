import type { ParsedArgs } from "./parse-args.js";

export interface HttpClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  dryRun?: boolean;
}

export interface HttpRequestOptions {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export function createHttpClient(options: HttpClientOptions) {
  const { baseUrl, headers = {}, dryRun = false } = options;

  return async function request(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<JsonValue> {
    const url = `${baseUrl}${path}`;
    const mergedHeaders = {
      "Content-Type": "application/json",
      ...headers,
      ...extraHeaders,
    };

    if (dryRun) {
      return {
        _dry_run: true,
        method,
        url,
        headers: sanitizeHeaders(mergedHeaders),
        body: body ?? undefined,
      };
    }

    const response = await fetch(url, {
      method,
      headers: mergedHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    if (!text) {
      return { status: response.status, success: response.ok };
    }

    try {
      return JSON.parse(text) as JsonValue;
    } catch {
      return { status: response.status, body: text };
    }
  };
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "authorization" || key.toLowerCase().includes("secret")) {
      sanitized[key] = "***";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable required`);
  }
  return value;
}

export async function runCliHandler(
  args: ParsedArgs,
  handler: (args: ParsedArgs) => Promise<JsonValue>,
): Promise<void> {
  try {
    const result = await handler(args);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
