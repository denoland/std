// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  DecoderSuccess,
  DecoderError,
  areDecoderErrors,
  isDecoderSuccess,
  DecoderResult
} from "./decoder_result.ts";
import { assertEquals } from "../testing/asserts.ts";

test({
  name: "new DecoderSuccess",
  fn: (): void => {
    const success = new DecoderSuccess(true);
    assertEquals(success instanceof DecoderSuccess, true);
    assertEquals(success, { value: true });
  }
});

test({
  name: "new DecoderError",
  fn: (): void => {
    const error = new DecoderError(true, "error", {
      allErrors: true,
      decoderName: "name",
      key: 0,
      location: "string",
      child: new DecoderError(true, "child")
    });

    assertEquals(error instanceof DecoderError, true);
    assertEquals(error, {
      input: true,
      message: "error",
      allErrors: true,
      decoderName: "name",
      key: 0,
      location: "string",
      child: {
        input: true,
        message: "child",
        allErrors: false,
        decoderName: undefined,
        key: undefined,
        location: "",
        child: undefined
      }
    });
  }
});

test({
  name: "isDecoderSuccess()",
  fn: (): void => {
    const success = new DecoderSuccess(null);
    const error = new DecoderError(null, "message");

    assertEquals(isDecoderSuccess(success), true);
    assertEquals(isDecoderSuccess([error]), false);
    assertEquals(
      isDecoderSuccess((error as unknown) as DecoderResult<unknown>),
      false
    );
    assertEquals(
      isDecoderSuccess(("success" as unknown) as DecoderResult<unknown>),
      false
    );
  }
});

test({
  name: "areDecoderErrors()",
  fn: (): void => {
    const success = new DecoderSuccess(null);
    const error = new DecoderError(null, "message");

    assertEquals(areDecoderErrors([error]), true);
    assertEquals(areDecoderErrors(success), false);
    assertEquals(
      areDecoderErrors((error as unknown) as DecoderResult<unknown>),
      false
    );
    assertEquals(
      areDecoderErrors(("success" as unknown) as DecoderResult<unknown>),
      false
    );
  }
});

runTests();
