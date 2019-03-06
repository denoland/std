// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEqual } from "../testing/asserts.ts";
import { isFormFile } from "./formfile.ts";

test(function multipartIsFormFile() {
  assertEqual(
    isFormFile({
      filename: "foo",
      type: "application/json"
    }),
    true
  );
  assertEqual(
    isFormFile({
      filename: "foo"
    }),
    false
  );
});
