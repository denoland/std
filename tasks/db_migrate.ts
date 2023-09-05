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
import { type Comment, createComment, kv } from "@/utils/db.ts";
import { monotonicUlid } from "std/ulid/mod.ts";

interface OldComment extends Comment {
  createdAt: Date;
}

if (!confirm("WARNING: The database will be migrated. Continue?")) Deno.exit();

const promises = [];

const iter = kv.list<OldComment>({ prefix: ["comments_by_item"] });
for await (const { key, value } of iter) {
  if (!value.createdAt) continue;
  promises.push(kv.delete(key));
  promises.push(createComment({
    id: monotonicUlid(value.createdAt.getTime()),
    userLogin: value.userLogin,
    itemId: value.itemId,
    text: value.text,
  }));
}

const results = await Promise.allSettled(promises);
results.forEach((result) => {
  if (result.status === "rejected") console.error(result);
});

kv.close();
