// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Item, kv } from "@/utils/db.ts";

function incrementMonth(oldDate: string) {
  const oldDateParts = oldDate.split("-").map((part) => parseInt(part));
  oldDateParts[1] = oldDateParts[1] + 1;
  const newDate = new Date(oldDateParts.join("-"));
  return newDate.toISOString().split("T")[0];
}

export async function migrateKv() {
  const iter = kv.list<Item>({ prefix: ["visits"] });
  const promises = [];
  for await (const res of iter) {
    promises.push(kv.delete(res.key));
    const oldDate = res.key.at(-1);
    const newDate = incrementMonth(oldDate as string);
    promises.push(kv.set([res.key[0], newDate], res.value));
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
