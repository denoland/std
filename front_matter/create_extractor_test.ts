// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertThrows } from "@std/assert";
import { parse as parseYaml } from "@std/yaml/parse";
import { parse as parseToml } from "@std/toml/parse";
import {
  resolveTestDataPath,
  runExtractJsonTests,
  runExtractTomlTests,
  runExtractTypeErrorTests,
  runExtractYamlTests1,
  runExtractYamlTests2,
} from "./_test_utils.ts";
import { createExtractor, type Parser } from "./create_extractor.ts";

const extractYaml = createExtractor({ "yaml": parseYaml as Parser });
const extractToml = createExtractor({ "toml": parseToml as Parser });
const extractJson = createExtractor({ "json": JSON.parse as Parser });
const extractYamlOrJson = createExtractor({
  "yaml": parseYaml as Parser,
  "json": JSON.parse as Parser,
});
const extractAny = createExtractor({
  "yaml": parseYaml as Parser,
  "json": JSON.parse as Parser,
  "toml": parseToml as Parser,
});

// YAML //

Deno.test("createExtractor() extracts yaml type error on invalid input", () => {
  runExtractTypeErrorTests("yaml", extractYaml);
});

Deno.test("createExtractor() parses yaml delineate by `---`", async () => {
  await runExtractYamlTests1(extractYaml);
});

Deno.test("createExtractor() parses yaml delineate by `---yaml`", async () => {
  await runExtractYamlTests2(extractYaml);
});

Deno.test({
  name:
    "createExtractor() handles text between horizontal rules should not be recognized",
  async fn() {
    const str = await Deno.readTextFile(
      resolveTestDataPath("./horizontal_rules.md"),
    );

    assertThrows(
      () => {
        extractAny(str);
      },
      TypeError,
      "Unsupported front matter format",
    );
  },
});

// JSON //

Deno.test("createExtractor() extracts json type error on invalid input", () => {
  runExtractTypeErrorTests("json", extractJson);
});

Deno.test("createExtractor() parses json delineate by ---json", async () => {
  await runExtractJsonTests(extractJson);
});

// TOML //

Deno.test("createExtractor() extracts toml type error on invalid input", () => {
  runExtractTypeErrorTests("toml", extractToml);
});

Deno.test("createExtractor() parses toml delineate by ---toml", async () => {
  await runExtractTomlTests(extractToml);
});

// MULTIPLE FORMATS //

Deno.test("createExtractor() parses yaml or json input", async () => {
  await runExtractYamlTests1(extractYamlOrJson);
  await runExtractYamlTests2(extractYamlOrJson);
  await runExtractJsonTests(extractYamlOrJson);
});

Deno.test("createExtractor() parses any input", async () => {
  await runExtractYamlTests1(extractAny);
  await runExtractYamlTests2(extractAny);
  await runExtractJsonTests(extractAny);
  await runExtractTomlTests(extractAny);
});
