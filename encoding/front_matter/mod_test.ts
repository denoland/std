// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { createExtractor, Format, Parser, recognize, test } from "./mod.ts";
import { parse as parseYAML } from "../yaml.ts";
import { parse as parseTOML } from "../toml.ts";
import {
  runExtractJSONTests,
  runExtractTOMLTests,
  runExtractTypeErrorTests,
  runExtractYAMLTests1,
  runExtractYAMLTests2,
  runRecognizeTests,
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

Deno.test("[ANY] recognize", () => {
  runRecognizeTests(recognize, [Format.JSON, Format.TOML, Format.YAML]);
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

Deno.test("[YAML] parse yaml delineate by `---`", () => {
  runExtractYAMLTests1(extractYAML);
});

Deno.test("[YAML] parse yaml delineate by `---yaml`", () => {
  runExtractYAMLTests2(extractYAML);
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

Deno.test("[JSON] parse json delineate by ---json", () => {
  runExtractJSONTests(extractJSON);
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

Deno.test("[TOML] parse toml delineate by ---toml", () => {
  runExtractTOMLTests(extractTOML);
});

// MULTIPLE FORMATS //

Deno.test("[YAML or JSON] parse input", () => {
  runExtractYAMLTests1(extractYAMLOrJSON);
  runExtractYAMLTests2(extractYAMLOrJSON);
  runExtractJSONTests(extractYAMLOrJSON);
});

Deno.test("[ANY] parse input", () => {
  runExtractYAMLTests1(extractAny);
  runExtractYAMLTests2(extractAny);
  runExtractJSONTests(extractAny);
  runExtractTOMLTests(extractAny);
});
