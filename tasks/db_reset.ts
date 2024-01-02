// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { kv } from "@/utils/db.ts";

if (!confirm("WARNING: The database will be reset. Continue?")) Deno.exit();

const iter = kv.list({ prefix: [] });
const promises = [];
for await (const res of iter) promises.push(kv.delete(res.key));
await Promise.all(promises);

kv.close();
