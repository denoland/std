// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { kv } from "@/utils/db.ts";

export async function resetKv() {
  const iter = kv.list({ prefix: [] });
  const promises = [];
  for await (const res of iter) promises.push(kv.delete(res.key));
  await Promise.all(promises);
}

if (import.meta.main) {
  if (
    !confirm(
      "This script deletes all data from the Deno KV database. Are you sure you'd like to continue?",
    )
  ) {
    close();
  }
  await resetKv();
  await kv.close();
}
