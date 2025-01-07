// Copyright 2018-2025 the Deno authors. MIT license.

import { extract } from "./json.ts";
import {
  runExtractJsonTests,
  runExtractTypeErrorTests,
} from "./_test_utils.ts";
import { assertEquals } from "@std/assert/equals";

Deno.test("json() extracts type error on invalid input", () => {
  runExtractTypeErrorTests("json", extract);
});

Deno.test("json() parses json delineate by ---json", async () => {
  await runExtractJsonTests(extract);
});

Deno.test("extractJson() allows whitespaces after the header", () => {
  assertEquals(extract('---json  \n{"foo": 0}\n---\n').attrs, { foo: 0 });
  assertEquals(extract('= json =  \n{"foo": 0}\n---\n').attrs, { foo: 0 });
});
