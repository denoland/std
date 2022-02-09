// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { parse } from "../flags/mod.ts";

if (import.meta.main) {
  console.dir(parse(Deno.args));
}
