// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import extract, { Format, recognize, test } from "./yaml.ts";
import {
  runExtractTypeErrorTests,
  runExtractYAMLTests1,
  runExtractYAMLTests2,
  runRecognizeTests,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

Deno.test("[YAML] recognize", () => {
  runRecognizeTests(recognize, [Format.YAML]);
});

Deno.test("[YAML] test valid input true", () => {
  runTestValidInputTests(Format.YAML, test);
});

Deno.test("[YAML] test invalid input false", () => {
  runTestInvalidInputTests(Format.YAML, test);
});

Deno.test("[YAML] extract type error on invalid input", () => {
  runExtractTypeErrorTests(Format.YAML, extract);
});

Deno.test("[YAML] parse yaml delineate by `---`", () => {
  runExtractYAMLTests1(extract);
});

Deno.test("[YAML] parse yaml delineate by `---yaml`", () => {
  runExtractYAMLTests2(extract);
});
