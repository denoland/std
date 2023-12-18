// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assert, assertThrows } from "../assert/mod.ts";
import {
  resolveTestDataPath,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";
import { test } from "./test.ts";

// GENERAL TESTS //

Deno.test("[ANY] try to test for unknown format", () => {
  assertThrows(
    () => test("foo", ["unknown"]),
    TypeError,
    "Unable to test for unknown front matter format",
  );
});

// YAML //

Deno.test("[YAML] test valid input true", () => {
  runTestValidInputTests("yaml", test);
});

Deno.test("[YAML] test invalid input false", () => {
  runTestInvalidInputTests("yaml", test);
});

Deno.test({
  name: "[YAML] text between horizontal rules should not be recognized",
  async fn() {
    const str = await Deno.readTextFile(
      resolveTestDataPath("./horizontal_rules.md"),
    );

    assert(!test(str));
  },
});

// JSON //

Deno.test("[JSON] test valid input true", () => {
  runTestValidInputTests("json", test);
});

Deno.test("[JSON] test invalid input false", () => {
  runTestInvalidInputTests("json", test);
});

// TOML //

Deno.test("[TOML] test valid input true", () => {
  runTestValidInputTests("toml", test);
});

Deno.test("[TOML] test invalid input false", () => {
  runTestInvalidInputTests("toml", test);
});
