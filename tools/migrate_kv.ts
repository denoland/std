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
    "58306d42-c17c-448c-aba0-31e43f68ca03",
    "588169af-73e3-4383-a98b-257d4a20d9fd",
    "7c05abda-67dd-4d11-a98e-6c03bf4a74b7",
    "8d9f15a8-10b8-43e4-b3d5-0714ae585cc2",
    "a3fa1164-28a3-461e-be5d-8625eb55e760",
    "b11890b5-851e-4ba7-8f13-1befd0e43c46",
    "e1416f18-f3a0-41d5-ae17-388b5d257aac",
    "33c0a21d-752b-4222-9b92-8c20efa1e644",
    "19299bbe-f508-4115-b105-892978271493",
    "5b3a0604-8f9e-46cc-9653-ea376a7f13df",
    "15d30182-fbb9-4385-a23b-70ce3dcb27ee",
    "7c47b301-17b5-4864-b7c5-e970d428877f",
    "d8358836-305c-4221-ab20-ca928095011a",
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
