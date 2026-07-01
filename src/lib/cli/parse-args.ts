export type ParsedArgs = Record<string, string | boolean | string[]> & {
  _: string[];
};

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { _: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) {
      continue;
    }

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    } else {
      result._.push(arg);
    }
  }

  return result;
}

export function getStringArg(args: ParsedArgs, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" ? value : undefined;
}

export function getBooleanArg(args: ParsedArgs, key: string): boolean {
  return args[key] === true;
}

export function getNumberArg(args: ParsedArgs, key: string, fallback: number): number {
  const value = getStringArg(args, key);
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function splitCsv(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}
