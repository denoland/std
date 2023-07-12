// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  deleteComment,
  deleteItem,
  getCommentsByItem,
  getItem,
  kv,
} from "@/utils/db.ts";

export async function migrateKv() {
  const itemIds = [
    "cb38b1d5-7ce8-4885-a8e4-e7832da6a162",
    "3b9a3780-800a-4d26-b63d-cd5ac307e60a",
    "e72e1416-e288-40b1-971c-fd29f0df6443",
    "59bb2275-03c8-4513-855d-d77f86e54d91",
    "562f25a5-7579-4e53-9fdd-2d292acf0650",
    "2f0f8ac1-a7c9-4489-b806-da30853c94dc",
  ];
  const promises = [];
  for (const itemId of itemIds) {
    const item = await getItem(itemId);
    if (item === null) break;
    promises.push(deleteItem(item));

    const comments = await getCommentsByItem(itemId);
    for (const comment of comments) {
      promises.push(deleteComment(comment));
    }
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
