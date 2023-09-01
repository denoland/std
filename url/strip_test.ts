// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import * as url from "./mod.ts";

const cleaned = new URL("https://deno.land/std/assert/mod.ts");
const search = new URL("https://deno.land/std/assert/mod.ts?foo=bar");
const hash = new URL("https://deno.land/std/assert/mod.ts#header");
const search_hash = new URL(
  "https://deno.land/std/assert/mod.ts?foo=bar#header",
);

Deno.test("strip", function () {
  url.strip(search);
  assertEquals(search, cleaned);
  url.strip(hash);
  assertEquals(hash, cleaned);
  url.strip(search_hash);
  assertEquals(search_hash, cleaned);
});
