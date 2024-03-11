// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { test } from "./test.ts";
import { extract } from "./yaml.ts";
import {
  runExtractTypeErrorTests,
  runExtractYAMLTests1,
  runExtractYAMLTests2,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

Deno.test("yaml() tests valid input true", () => {
  runTestValidInputTests("yaml", test);
});

Deno.test("yaml() tests invalid input false", () => {
  runTestInvalidInputTests("yaml", test);
});

Deno.test("yaml() extracts type error on invalid input", () => {
  runExtractTypeErrorTests("yaml", extract);
});

Deno.test("yaml() parses yaml delineate by `---`", async () => {
  await runExtractYAMLTests1(extract);
});

Deno.test("yaml() parses yaml delineate by `---yaml`", async () => {
  await runExtractYAMLTests2(extract);
});
