// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertDecodesToSuccess, assertDecoder } from "./test_util.ts";
import { isAny } from "./is_any.ts";
import { DecoderSuccess } from "./decoder_result.ts";

/**
 * isAny()
 */

test({
  name: "init isAny()",
  fn: () => {
    assertDecoder(isAny());
  }
});

test({
  name: "isAny()",
  fn: () => {
    const decoder = isAny();

    for (const item of [true, false, {}, "false", [], Symbol(), Set]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }
  }
});

runTests();
