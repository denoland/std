// Copyright 2018-2025 the Deno authors. MIT license.

import { extract } from "./any.ts";
import {
  runExtractJsonTests,
  runExtractTomlTests,
  runExtractTypeErrorTests,
  runExtractYamlTests1,
  runExtractYamlTests2,
} from "./_test_utils.ts";

// YAML //

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

Deno.test("extract() extracts type error on invalid json input", () => {
  runExtractTypeErrorTests("json", extract);
});

Deno.test("extract() parses json delineate by ---json", async () => {
  await runExtractJsonTests(extract);
});

// TOML //

Deno.test("extract() extracts type error on invalid toml input", () => {
  runExtractTypeErrorTests("toml", extract);
});

Deno.test("extract() parses toml delineate by ---toml", async () => {
  await runExtractTomlTests(extract);
});
