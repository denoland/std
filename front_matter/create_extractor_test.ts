// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertThrows } from "../assert/mod.ts";
import { parse as parseYAML } from "../yaml/parse.ts";
import { parse as parseTOML } from "../toml/parse.ts";
import {
  resolveTestDataPath,
  runExtractJSONTests,
  runExtractTOMLTests,
  runExtractTypeErrorTests,
  runExtractYAMLTests1,
  runExtractYAMLTests2,
} from "./_test_utils.ts";
import { createExtractor, Parser } from "./create_extractor.ts";

const extractYAML = createExtractor({ "yaml": parseYAML as Parser });
const extractTOML = createExtractor({ "toml": parseTOML as Parser });
const extractJSON = createExtractor({ "json": JSON.parse as Parser });
const extractYAMLOrJSON = createExtractor({
  "yaml": parseYAML as Parser,
  "json": JSON.parse as Parser,
});
const extractAny = createExtractor({
  "yaml": parseYAML as Parser,
  "json": JSON.parse as Parser,
  "toml": parseTOML as Parser,
});

// YAML //

Deno.test("[YAML] extract type error on invalid input", () => {
  runExtractTypeErrorTests("yaml", extractYAML);
});

Deno.test("[YAML] parse yaml delineate by `---`", async () => {
  await runExtractYAMLTests1(extractYAML);
});

Deno.test("[YAML] parse yaml delineate by `---yaml`", async () => {
  await runExtractYAMLTests2(extractYAML);
});

Deno.test({
  name: "[YAML] text between horizontal rules should not be recognized",
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

Deno.test("[JSON] extract type error on invalid input", () => {
  runExtractTypeErrorTests("json", extractJSON);
});

Deno.test("[JSON] parse json delineate by ---json", async () => {
  await runExtractJSONTests(extractJSON);
});

// TOML //

Deno.test("[TOML] extract type error on invalid input", () => {
  runExtractTypeErrorTests("toml", extractTOML);
});

Deno.test("[TOML] parse toml delineate by ---toml", async () => {
  await runExtractTOMLTests(extractTOML);
});

// MULTIPLE FORMATS //

Deno.test("[YAML or JSON] parse input", async () => {
  await runExtractYAMLTests1(extractYAMLOrJSON);
  await runExtractYAMLTests2(extractYAMLOrJSON);
  await runExtractJSONTests(extractYAMLOrJSON);
});

Deno.test("[ANY] parse input", async () => {
  await runExtractYAMLTests1(extractAny);
  await runExtractYAMLTests2(extractAny);
  await runExtractJSONTests(extractAny);
  await runExtractTOMLTests(extractAny);
});
