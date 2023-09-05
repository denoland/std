// Copyright 2023 the Deno authors. All rights reserved. MIT license.
// Description: Prints kv to stdout
// Usage: deno run -A --unstable tools/dump_kv.ts
import { kv } from "@/utils/db.ts";

// https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-521460510
function replacer(_key: unknown, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value; // return everything else unchanged
}
export async function dumpKv() {
  const iter = kv.list({ prefix: [] });
  const items = [];
  for await (const res of iter) {
    items.push({ [res.key.toString()]: res.value });
  }
  console.log(`${JSON.stringify(items, replacer, 2)}`);
}

if (import.meta.main) {
  await dumpKv();
  await kv.close();
}
