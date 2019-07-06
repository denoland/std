// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertDecodesToErrors, assertDecoder } from "./test_util.ts";
import { isNever } from "./is_never.ts";
import { DecoderError } from "./decoder_result.ts";

/**
 * isNever()
 */

test({
  name: "init isNever()",
  fn: () => {
    assertDecoder(isNever());
  }
});

test({
  name: "isNever()",
  fn: () => {
    const decoder = isNever();

    for (const item of [1, -342.342342, {}, null, undefined, "str", true]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must not be present", {
          decoderName: "isNever"
        })
      ]);
    }
  }
});

runTests();
