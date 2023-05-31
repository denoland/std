// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Item, kv } from "@/utils/db.ts";

export async function migrateKv() {
  const iter = kv.list<Item>({ prefix: ["items_by_time"] });
  const promises = [];
  for await (const res of iter) {
    promises.push(kv.set(["items", res.value.id], res.value));
  }
  await Promise.all(promises);
}

if (import.meta.main) {
  if (
    !confirm("Would you like to continue?")
  ) {
    close();
  }
  await migrateKv();
  await kv.close();
}
