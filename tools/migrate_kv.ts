// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { kv, type Notification } from "@/utils/db.ts";

export async function migrateKv() {
  const iter = kv.list<Notification>({ prefix: ["notifications_by_time"] });
  const promises = [];
  for await (const entry of iter) {
    promises.push(kv.delete(entry.key));
  }
  await Promise.all(promises);
  console.log("KV migration complete.");
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
