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
    "3064e1e4-1934-461a-adbe-e6e2a30f73ae",
    "eace50d0-dc57-4dd1-a8f9-0f59535d48c9",
    "ff47e677-e9d6-4e7f-8592-acd5c7688c8a",
    "c7096c2b-3df0-4d80-a996-0d247be4aee6",
    "6e268bb3-72c4-4ad7-8102-44aed8809feb",
    "acc8822c-69ec-475e-9f60-4a00213d9a60",
    "425ad977-8f3f-4966-a262-2aff44572686",
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
