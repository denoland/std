// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { DecoderError } from "./decoder_result.ts";
import { assertDecoderSuccess, assertDecoderErrors } from "./test_util.ts";
import { ok, err, errorLocation } from "./_util.ts";

/**
 * _util
 */

test({
  name: "ok()",
  fn: () => {
    assertDecoderSuccess(ok(null), { value: null });
    assertDecoderSuccess(ok(undefined), { value: undefined });
    assertDecoderSuccess(ok(10), { value: 10 });
    const obj = {};
    assertDecoderSuccess(ok(obj), { value: obj });
  }
});

test({
  name: "err()",
  fn: () => {
    let error = err(null, "null err", "nullDecoder");
    assertDecoderErrors(error, [
      new DecoderError(null, "null err", {
        decoderName: "nullDecoder"
      })
    ]);

    error = err("string", "string err", "stringDecoder", {
      allErrors: true,
      decoderName: "customName",
      msg: "newMessage"
    });
    assertDecoderErrors(error, [
      new DecoderError("string", "newMessage", {
        decoderName: "customName",
        allErrors: true
      })
    ]);

    error = err("string", "string err", "stringDecoder", {
      allErrors: true,
      decoderName: "customName",
      msg: errors => [
        ...errors,
        new DecoderError(null, "null"),
        new DecoderError(undefined, "undefined")
      ]
    });
    assertDecoderErrors(error, [
      new DecoderError("string", "string err", {
        decoderName: "customName",
        allErrors: true
      }),
      new DecoderError(null, "null"),
      new DecoderError(undefined, "undefined")
    ]);
  }
});

test({
  name: "errorLocation()",
  fn: () => {
    assertEquals(errorLocation(1, "payload[1]"), "[1].payload[1]");

    assertEquals(errorLocation("value", "payload[1]"), "value.payload[1]");

    assertEquals(errorLocation("value", "[1]"), "value[1]");

    assertEquals(errorLocation("val8ue", "[1]"), '["val8ue"][1]');

    assertEquals(errorLocation("Value", "[1]"), "Value[1]");

    assertEquals(errorLocation("type", "Value[1]"), "type.Value[1]");
  }
});

runTests();
