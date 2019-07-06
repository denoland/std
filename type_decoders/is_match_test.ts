// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder
} from "./test_util.ts";
import { isMatch } from "./is_match.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isMatch()
 */

test({
  name: "init isMatch()",
  fn: () => {
    assertDecoder(isMatch(/one/));
  }
});

test({
  name: "isMatch()",
  fn: () => {
    const regex = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;

    const decoder = isMatch(regex);

    for (const item of ["2019-07-03", "2000-01-01", "0432-11-30"]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0, -342.342342, {}, null, undefined]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a string", {
          decoderName: "isMatch"
        })
      ]);
    }

    for (const item of [
      "01-01-2019",
      "2000-00-01",
      "04321-30",
      "",
      "342-43234342"
    ]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(
          item,
          `must be a string matching the pattern "${regex}"`,
          {
            decoderName: "isMatch"
          }
        )
      ]);
    }
  }
});

runTests();
