import { buildConsoleLogger } from "../builtin_loggers.ts";
import { defaultLogLevels } from "../default_logger.ts";
import type { DefaultLogLevels } from "../default_logger.ts";

const [threshold, ...inputs] = Deno.args.map((it) => JSON.parse(it));

const log = buildConsoleLogger(
  defaultLogLevels,
  threshold as keyof DefaultLogLevels,
  (level) => defaultLogLevels[level] >= defaultLogLevels.warn,
);

(inputs as [keyof DefaultLogLevels, ...Parameters<typeof log["info"]>][])
  .forEach(([level, message, data]) => log[level](message, data));
