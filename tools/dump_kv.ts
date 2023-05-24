// Copyright 2023 the Deno authors. All rights reserved. MIT license.
// Description: Prints kv to stdout
// Usage: deno run -A --unstable tools/dump_kv.ts
import { kv } from "@/utils/db.ts";

export async function dumpKv() {
  const iter = kv.list({ prefix: [] });
  const items = [];
  for await (const res of iter) {
    items.push({ [res.key.toString()]: res.value });
  }
  console.log(`${JSON.stringify(items, null, 2)}`);
}

if (import.meta.main) {
  await dumpKv();
  await kv.close();
}
