import { log } from "../mod.ts";
import type { DefaultLogLevels } from "../default_logger.ts";

const inputs = Deno.args
  .map((it) => JSON.parse(it)) as [
    keyof DefaultLogLevels,
    ...Parameters<typeof log["info"]>,
  ][];

inputs
  .forEach(([level, message, data]) => log[level](message, data));
