// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { test } from "./test.ts";
import { extract } from "./toml.ts";
import {
  runExtractTomlTests,
  runExtractTomlTests2,
  runExtractTypeErrorTests,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

Deno.test("toml() tests valid input true", () => {
  runTestValidInputTests("toml", test);
});

Deno.test("toml() tests invalid input false", () => {
  runTestInvalidInputTests("toml", test);
});

Deno.test("toml() extracts type error on invalid input", () => {
  runExtractTypeErrorTests("toml", extract);
});

Deno.test("toml() parses toml delineate by ---toml", async () => {
  await runExtractTomlTests(extract);
});

Deno.test("toml() parses toml delineate by +++", async () => {
  await runExtractTomlTests2(extract);
});
