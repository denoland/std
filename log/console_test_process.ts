import { buildConsoleLogger } from "./builtin_loggers.ts";
import { defaultLogLevels } from "./default_logger.ts";
import type { DefaultLogLevels } from "./default_logger.ts";

const [threshold, ...inputArgs] = Deno.args;

const log = buildConsoleLogger(
  defaultLogLevels,
  threshold as keyof DefaultLogLevels,
  (level) => defaultLogLevels[level] >= defaultLogLevels.error,
);

const inputs = inputArgs
  .map((it) => JSON.parse(it)) as [
    keyof DefaultLogLevels,
    ...Parameters<typeof log["info"]>,
  ][];

inputs
  .forEach(([level, message, data]) => log[level](message, data));
