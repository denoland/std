// Copyright 2018-2025 the Deno authors. MIT license.

import { extract } from "./toml.ts";
import {
  runExtractTomlTests,
  runExtractTomlTests2,
  runExtractTypeErrorTests,
} from "./_test_utils.ts";
import { assertEquals } from "@std/assert/equals";

Deno.test("toml() extracts type error on invalid input", () => {
  runExtractTypeErrorTests("toml", extract);
});

Deno.test("toml() parses toml delineate by ---toml", async () => {
  await runExtractTomlTests(extract);
});

Deno.test("toml() parses toml delineate by +++", async () => {
  await runExtractTomlTests2(extract);
});

Deno.test("extractToml() allows whitespaces after the header", () => {
  assertEquals(extract("---toml  \nfoo = 0\n---\n").attrs, { foo: 0 });
  assertEquals(extract("+++  \nfoo = 0\n--- \n").attrs, { foo: 0 });
  assertEquals(extract("= toml =  \nfoo = 0\n---\n").attrs, { foo: 0 });
});
