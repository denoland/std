// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { test } from "./test.ts";
import { extract } from "./any.ts";
import {
  runExtractJsonTests,
  runExtractTomlTests,
  runExtractTypeErrorTests,
  runExtractYamlTests1,
  runExtractYamlTests2,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

// YAML //

Deno.test("test() handles valid input", () => {
  runTestValidInputTests("yaml", test);
});

Deno.test("test() handles invalid input", () => {
  runTestInvalidInputTests("yaml", test);
});

Deno.test("extract() extracts type error on invalid input", () => {
  runExtractTypeErrorTests("yaml", extract);
});

Deno.test("extract() parses yaml delineate by `---`", async () => {
  await runExtractYamlTests1(extract);
});

Deno.test("extract() parses yaml delineate by `---yaml`", async () => {
  await runExtractYamlTests2(extract);
});

// JSON //

Deno.test("test() handles valid json input", () => {
  runTestValidInputTests("json", test);
});

Deno.test("test() handles invalid json input", () => {
  runTestInvalidInputTests("json", test);
});

Deno.test("extract() extracts type error on invalid json input", () => {
  runExtractTypeErrorTests("json", extract);
});

Deno.test("extract() parses json delineate by ---json", async () => {
  await runExtractJsonTests(extract);
});

// TOML //

Deno.test("test() test valid input true", () => {
  runTestValidInputTests("toml", test);
});

Deno.test("test() handles invalid toml input false", () => {
  runTestInvalidInputTests("toml", test);
});

Deno.test("extract() extracts type error on invalid toml input", () => {
  runExtractTypeErrorTests("toml", extract);
});

Deno.test("extract() parses toml delineate by ---toml", async () => {
  await runExtractTomlTests(extract);
});
