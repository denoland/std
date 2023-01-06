// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assert, assertThrows } from "../../testing/asserts.ts";
import { createExtractor, Format, Parser, test } from "./mod.ts";
import { parse as parseYAML } from "../yaml.ts";
import { parse as parseTOML } from "../toml.ts";
import {
  resolveTestDataPath,
  runExtractJSONTests,
  runExtractTOMLTests,
  runExtractTypeErrorTests,
  runExtractYAMLTests1,
  runExtractYAMLTests2,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

const extractYAML = createExtractor({ [Format.YAML]: parseYAML as Parser });
const extractTOML = createExtractor({ [Format.TOML]: parseTOML as Parser });
const extractJSON = createExtractor({ [Format.JSON]: JSON.parse as Parser });
const extractYAMLOrJSON = createExtractor({
  [Format.YAML]: parseYAML as Parser,
  [Format.JSON]: JSON.parse as Parser,
});
const extractAny = createExtractor({
  [Format.YAML]: parseYAML as Parser,
  [Format.JSON]: JSON.parse as Parser,
  [Format.TOML]: parseTOML as Parser,
});

// GENERAL TESTS //

Deno.test("[ANY] try to test for unknown format", () => {
  assertThrows(
    () => test("foo", [Format.UNKNOWN]),
    TypeError,
    "Unable to test for unknown front matter format",
  );
});

// YAML //

Deno.test("[YAML] test valid input true", () => {
  runTestValidInputTests(Format.YAML, test);
});

Deno.test("[YAML] test invalid input false", () => {
  runTestInvalidInputTests(Format.YAML, test);
});

Deno.test("[YAML] extract type error on invalid input", () => {
  runExtractTypeErrorTests(Format.YAML, extractYAML);
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

    assert(!test(str));
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

Deno.test("[JSON] test valid input true", () => {
  runTestValidInputTests(Format.JSON, test);
});

Deno.test("[JSON] test invalid input false", () => {
  runTestInvalidInputTests(Format.JSON, test);
});

Deno.test("[JSON] extract type error on invalid input", () => {
  runExtractTypeErrorTests(Format.JSON, extractJSON);
});

Deno.test("[JSON] parse json delineate by ---json", async () => {
  await runExtractJSONTests(extractJSON);
});

// TOML //

Deno.test("[TOML] test valid input true", () => {
  runTestValidInputTests(Format.TOML, test);
});

Deno.test("[TOML] test invalid input false", () => {
  runTestInvalidInputTests(Format.TOML, test);
});

Deno.test("[TOML] extract type error on invalid input", () => {
  runExtractTypeErrorTests(Format.TOML, extractTOML);
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
