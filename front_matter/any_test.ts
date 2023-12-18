// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { test } from "./test.ts";
import { extract } from "./any.ts";
import {
  runExtractJSONTests,
  runExtractTOMLTests,
  runExtractTypeErrorTests,
  runExtractYAMLTests1,
  runExtractYAMLTests2,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

// YAML //

Deno.test("[ANY/YAML] test valid input true", () => {
  runTestValidInputTests("yaml", test);
});

Deno.test("[ANY/YAML] test invalid input false", () => {
  runTestInvalidInputTests("yaml", test);
});

Deno.test("[ANY/YAML] extract type error on invalid input", () => {
  runExtractTypeErrorTests("yaml", extract);
});

Deno.test("[ANY/YAML] parse yaml delineate by `---`", async () => {
  await runExtractYAMLTests1(extract);
});

Deno.test("[ANY/YAML] parse yaml delineate by `---yaml`", async () => {
  await runExtractYAMLTests2(extract);
});

// JSON //

Deno.test("[ANY/JSON] test valid input true", () => {
  runTestValidInputTests("json", test);
});

Deno.test("[ANY/JSON] test invalid input false", () => {
  runTestInvalidInputTests("json", test);
});

Deno.test("[ANY/JSON] extract type error on invalid input", () => {
  runExtractTypeErrorTests("json", extract);
});

Deno.test("[ANY/JSON] parse json delineate by ---json", async () => {
  await runExtractJSONTests(extract);
});

// TOML //

Deno.test("[ANY/TOML] test valid input true", () => {
  runTestValidInputTests("toml", test);
});

Deno.test("[ANY/TOML] test invalid input false", () => {
  runTestInvalidInputTests("toml", test);
});

Deno.test("[ANY/TOML] extract type error on invalid input", () => {
  runExtractTypeErrorTests("toml", extract);
});

Deno.test("[ANY/TOML] parse toml delineate by ---toml", async () => {
  await runExtractTOMLTests(extract);
});
