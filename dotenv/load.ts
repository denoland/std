// Copyright 2018-2026 the Deno authors. MIT license.

import { loadSync } from "./mod.ts";

if (!(Deno.readTextFileSync instanceof Function)) {
  // Avoid errors that occur in deno deploy: https://github.com/denoland/std/issues/1957
  // deno-lint-ignore no-console
  console.warn(
    `Deno.readTextFileSync is not a function: No .env data was read.`,
  );
} else {
  loadSync({ export: true });
}
