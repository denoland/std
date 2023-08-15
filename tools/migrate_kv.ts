// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Comment, createComment, kv } from "@/utils/db.ts";

export async function migrateKv() {
  const promises = [];
  const iter = kv.list<Comment>({ prefix: ["comments_by_item"] });
  for await (const entry of iter) {
    if (entry.key.length === 3) {
      promises.push(kv.delete(entry.key));
      promises.push(createComment(entry.value));
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
