// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertThrows } from "@std/assert";
import {
  resolveTestDataPath,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";
import { type Format, test } from "./test.ts";

// GENERAL TESTS //

Deno.test("test() tests for unknown format", () => {
  assertThrows(
    () => test("foo", ["unknown"] as unknown as Format[]),
    TypeError,
    "Unable to test for unknown front matter format",
  );
});

// YAML //

Deno.test("test() handles valid yaml input", () => {
  runTestValidInputTests("yaml", test);
});

Deno.test("test() handles invalid yaml input", () => {
  runTestInvalidInputTests("yaml", test);
});

Deno.test({
  name: "test() handles yaml text between horizontal rules",
  async fn() {
    const str = await Deno.readTextFile(
      resolveTestDataPath("./horizontal_rules.md"),
    );

    assert(!test(str));
  },
});

// JSON //

Deno.test("test() handles valid json input", () => {
  runTestValidInputTests("json", test);
});

Deno.test("test() handles invalid json input", () => {
  runTestInvalidInputTests("json", test);
});

// TOML //

Deno.test("test() handles valid toml input", () => {
  runTestValidInputTests("toml", test);
});

Deno.test("test() handles invalid toml input", () => {
  runTestInvalidInputTests("toml", test);
});
