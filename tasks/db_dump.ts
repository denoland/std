// Copyright 2023 the Deno authors. All rights reserved. MIT license.
/**
 * This script prints all entries in the KV database formatted as JSON. This
 * can be used to create a backup file.
 *
 * @example
 * ```bash
 * deno task db:dump > backup.json
 * ```
 */
import { kv } from "@/utils/db.ts";

// https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-521460510
function replacer(_key: unknown, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value;
}

const iter = kv.list({ prefix: [] });
const items = [];
for await (const { key, value } of iter) items.push({ key, value });
console.log(JSON.stringify(items, replacer, 2));

kv.close();
