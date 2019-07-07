// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder
} from "./test_util.ts";
import { isInstanceOf } from "./is_instance_of.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

/**
 * isInstanceOf()
 */

test({
  name: "init isInstanceOf()",
  fn: (): void => {
    assertDecoder(isInstanceOf(Map));
    assertDecoder(isInstanceOf(Array));
    assertDecoder(isInstanceOf(Set));
  }
});

test({
  name: "isInstanceOf(Map)",
  fn: (): void => {
    const map = new Map();
    const set = new Set();
    const array: unknown[] = [];
    const mapDecoder = isInstanceOf(Map);

    assertDecodesToSuccess(mapDecoder, map, new DecoderSuccess(map));

    for (const item of [{}, null, 0, undefined, "str", set, array]) {
      assertDecodesToErrors(mapDecoder, item, [
        new DecoderError(item, "must be an instance of Map", {
          decoderName: "isInstanceOf"
        })
      ]);
    }
  }
});

test({
  name: "isInstanceOf(Set)",
  fn: (): void => {
    const map = new Map();
    const set = new Set();
    const array: unknown[] = [];
    const mapDecoder = isInstanceOf(Set);

    assertDecodesToSuccess(mapDecoder, set, new DecoderSuccess(set));

    for (const item of [{}, null, 0, undefined, "str", map, array]) {
      assertDecodesToErrors(mapDecoder, item, [
        new DecoderError(item, "must be an instance of Set", {
          decoderName: "isInstanceOf"
        })
      ]);
    }
  }
});

test({
  name: "isInstanceOf(Array)",
  fn: (): void => {
    const map = new Map();
    const set = new Set();
    const array: unknown[] = [];
    const mapDecoder = isInstanceOf(Array);

    assertDecodesToSuccess(mapDecoder, array, new DecoderSuccess(array));

    for (const item of [{}, null, 0, undefined, "str", map, set]) {
      assertDecodesToErrors(mapDecoder, item, [
        new DecoderError(item, "must be an instance of Array", {
          decoderName: "isInstanceOf"
        })
      ]);
    }
  }
});

runTests();
