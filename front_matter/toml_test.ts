// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { test } from "./test.ts";
import { extract } from "./toml.ts";
import {
  runExtractTOMLTests,
  runExtractTOMLTests2,
  runExtractTypeErrorTests,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

Deno.test("[TOML] test valid input true", () => {
  runTestValidInputTests("toml", test);
});

Deno.test("[TOML] test invalid input false", () => {
  runTestInvalidInputTests("toml", test);
});

Deno.test("[TOML] extract type error on invalid input", () => {
  runExtractTypeErrorTests("toml", extract);
});

Deno.test("[TOML] parse toml delineate by ---toml", async () => {
  await runExtractTOMLTests(extract);
});

Deno.test("[TOML] parse toml delineate by +++", async () => {
  await runExtractTOMLTests2(extract);
});
