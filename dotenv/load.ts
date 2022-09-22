// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { configSync } from "./mod.ts";

if (!(Deno.readTextFileSync instanceof Function)) {
  // Avoid errors that occur in deno deploy: https://github.com/denoland/deno_std/issues/1957
  console.warn(
    `Deno.readTextFileSync is not a function: No .env data was read.`,
  );
} else {
  configSync({ export: true });
}
