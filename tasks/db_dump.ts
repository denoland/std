// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { kv } from "@/utils/db.ts";

// https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-521460510
function replacer(_key: unknown, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value;
}

const iter = kv.list({ prefix: [] });
const items = [];
for await (const res of iter) items.push({ [res.key.toString()]: res.value });
console.log(`${JSON.stringify(items, replacer, 2)}`);

kv.close();
