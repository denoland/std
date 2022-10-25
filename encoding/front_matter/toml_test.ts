// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import extract, { Format, recognize, test } from "./toml.ts";
import {
  runExtractTOMLTests,
  runExtractTypeErrorTests,
  runRecognizeTests,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

Deno.test("[TOML] recognize", () => {
  runRecognizeTests(recognize, [Format.TOML]);
});

Deno.test("[TOML] test valid input true", () => {
  runTestValidInputTests(Format.TOML, test);
});

Deno.test("[TOML] test invalid input false", () => {
  runTestInvalidInputTests(Format.TOML, test);
});

Deno.test("[TOML] extract type error on invalid input", () => {
  runExtractTypeErrorTests(Format.TOML, extract);
});

Deno.test("[TOML] parse toml delineate by ---toml", () => {
  runExtractTOMLTests(extract);
});
