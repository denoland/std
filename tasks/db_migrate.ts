// Copyright 2023 the Deno authors. All rights reserved. MIT license.
/**
 * This script is used to perform migration jobs on the database. These jobs
 * can be performed on remote KV instances using
 * {@link https://github.com/denoland/deno/tree/main/ext/kv#kv-connect|KV Connect}.
 *
 * This script will continually change over time for database migrations, as
 * required.
 *
 * @example
 * ```bash
 * deno task db:migrate
 * ```
 */
import {
  createItem,
  createVote,
  deleteVote,
  type Item,
  kv,
  User,
} from "@/utils/db.ts";
import { ulid } from "std/ulid/mod.ts";

interface OldItem extends Item {
  createdAt: Date;
}

if (!confirm("WARNING: The database will be migrated. Continue?")) Deno.exit();

const iter1 = kv.list<OldItem>({ prefix: ["items"] });
for await (const oldItemEntry of iter1) {
  if (oldItemEntry.value.createdAt) {
    const newItem = {
      id: ulid(new Date(oldItemEntry.value.createdAt).getTime()),
      userLogin: oldItemEntry.value.userLogin,
      url: oldItemEntry.value.url,
      title: oldItemEntry.value.title,
      score: oldItemEntry.value.score,
    };
    await createItem(newItem);
    const iter2 = kv.list<User>({
      prefix: ["users_voted_for_item", oldItemEntry.value.id],
    });
    for await (const userEntry of iter2) {
      await deleteVote({
        itemId: oldItemEntry.value.id,
        userLogin: userEntry.value.login,
      });
      await deleteVote({
        itemId: newItem.id,
        userLogin: userEntry.value.login,
      });
      await createVote({
        itemId: newItem.id,
        userLogin: userEntry.value.login,
        createdAt: new Date(),
      });
    }
    await kv.delete(oldItemEntry.key);
  }
}

const iter3 = kv.list<OldItem>({ prefix: ["items_by_user"] });
for await (const { key, value } of iter3) {
  if (value.createdAt) await kv.delete(key);
}

kv.close();
