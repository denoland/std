// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { kv, updateUser, User } from "@/utils/db.ts";

export async function migrateKv() {
  const iter = kv.list<User>({ prefix: ["users"] });
  const promises = [];
  for await (const entry of iter) {
    promises.push(updateUser(entry.value));
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
