import { parse } from "../../flags/mod.ts";

export function getOptions() {
  const args = parse(Deno.args);
  const options = new Map(
    Object.entries(args).map(([key, value]) => [key, { value }]),
  );

  return { options };
}
