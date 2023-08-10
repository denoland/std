// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { kv, updateUser, User } from "@/utils/db.ts";

type MaybeOldUser = User & {
  id?: string;
  avatarUrl?: string;
};

export async function migrateKv() {
  const promises = [];
  const iter = kv.list<MaybeOldUser>({ prefix: ["users"] });
  for await (const entry of iter) {
    const user = entry.value;
    if (user.id) {
      promises.push(kv.delete(["users", user.id]));
      delete user.id;
      delete user.avatarUrl;
      promises.push(updateUser(user));
    }
  }
  await Promise.all(promises);

  console.log("KV migration complete");
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
