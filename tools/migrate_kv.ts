// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { createVote, type Item, kv } from "@/utils/db.ts";

interface OldVote {
  userLogin: string;
  item: Item;
  // The below property can be automatically generated upon vote creation
  id: string;
  createdAt: Date;
}

/** @todo Remove previous vote data once this migration is complete */
export async function migrateKv() {
  const promises = [];
  const iter = kv.list<OldVote>({ prefix: ["votes"] });
  for await (const { value } of iter) {
    promises.push(createVote({
      itemId: value.item.id,
      userLogin: value.userLogin,
      createdAt: value.createdAt,
    }));
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
