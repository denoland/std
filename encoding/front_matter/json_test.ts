// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import extract, { Format, recognize, test } from "./json.ts";
import {
  runExtractJSONTests,
  runExtractTypeErrorTests,
  runRecognizeTests,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

Deno.test("[JSON] recognize", () => {
  runRecognizeTests(recognize, [Format.JSON]);
});

Deno.test("[JSON] test valid input true", () => {
  runTestValidInputTests(Format.JSON, test);
});

Deno.test("[JSON] test invalid input false", () => {
  runTestInvalidInputTests(Format.JSON, test);
});

Deno.test("[JSON] extract type error on invalid input", () => {
  runExtractTypeErrorTests(Format.JSON, extract);
});

Deno.test("[JSON] parse json delineate by ---json", async () => {
  await runExtractJSONTests(extract);
});
