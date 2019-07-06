// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder
} from "./test_util.ts";
import { isBoolean } from "./is_boolean.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isBoolean()
 */

test({
  name: "init isBoolean()",
  fn: () => {
    assertDecoder(isBoolean());
  }
});

test({
  name: "isBoolean()",
  fn: () => {
    const decoder = isBoolean();

    assertDecodesToSuccess(decoder, true, new DecoderSuccess(true));
    assertDecodesToSuccess(decoder, false, new DecoderSuccess(false));

    for (const item of [{}, null, 0, "false", undefined]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a boolean", {
          decoderName: "isBoolean"
        })
      ]);
    }
  }
});

runTests();
