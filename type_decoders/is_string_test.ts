// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  assertDecodeSuccess,
  assertDecodeErrors,
  assertDecoder
} from "./_testing_util.ts";
import { Decoder } from "./decoder.ts";
import { isString } from "./is_string.ts";

/**
 * isString()
 */

test(function initializes() {
  assertDecoder(isString());
});

test(function decodesInput() {
  const decoder = isString();

  for (const item of ["0", "-14"]) {
    assertDecodeSuccess(decoder, item, { expected: item });
  }

  for (const item of [0.123, -342.342342, {}, null, undefined]) {
    assertDecodeErrors({
      decoder: decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: "must be a string"
        }
      ],
      count: 1
    });
  }
});

runTests();
