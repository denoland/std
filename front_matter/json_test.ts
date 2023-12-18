// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { test } from "./test.ts";
import { extract } from "./json.ts";
import {
  runExtractJSONTests,
  runExtractTypeErrorTests,
  runTestInvalidInputTests,
  runTestValidInputTests,
} from "./_test_utils.ts";

Deno.test("[JSON] test valid input true", () => {
  runTestValidInputTests("json", test);
});

Deno.test("[JSON] test invalid input false", () => {
  runTestInvalidInputTests("json", test);
});

Deno.test("[JSON] extract type error on invalid input", () => {
  runExtractTypeErrorTests("json", extract);
});

Deno.test("[JSON] parse json delineate by ---json", async () => {
  await runExtractJSONTests(extract);
});
