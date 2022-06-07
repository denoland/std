// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { loadSync } from "./mod.ts";

if (!(Deno.readTextFileSync instanceof Function)) {
  // deno deploy doesn't have Deno.readFileSync
  console.warn(
    `Deno.readTextFileSync is not a function: No .env data was read.`,
  );
} else {
  loadSync();
}
