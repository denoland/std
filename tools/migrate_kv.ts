// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  type Comment,
  createComment,
  deleteComment,
  getUser,
  kv,
} from "@/utils/db.ts";

type OldComment = Omit<Comment, "userLogin"> & { userId: string };

async function migrateComment(oldComment: OldComment) {
  const user = await getUser(oldComment.userId);
  if (user === null) {
    throw new Deno.errors.NotFound(
      `User with ID not found: ${oldComment.userId}`,
    );
  }
  // @ts-ignore Trust me
  await deleteComment(oldComment);
  await createComment({
    userLogin: user.login,
    id: oldComment.id,
    itemId: oldComment.itemId,
    text: oldComment.text,
    createdAt: oldComment.createdAt,
  });
}

export async function migrateKv() {
  const iter = kv.list<OldComment | Comment>({ prefix: ["comments_by_item"] });
  const promises = [];
  for await (const entry of iter) {
    // @ts-ignore Trust me
    if (entry.value.userId) promises.push(migrateComment(entry.value));
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
