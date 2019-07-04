// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import * as tests from "../testing/asserts.ts";
import { DecoderSuccess, DecoderError, areDecoderErrors, isDecoderSuccess } from "./decoder_result.ts";

/**
 * DecoderSuccess
 */

test(function initializesDecoderSuccess(): void {
  tests.assertEquals(new DecoderSuccess(true).value, true);
  tests.assertEquals(new DecoderSuccess('one').value, 'one');
});

test(function isDecoderSuccessFn(): void {
  const success = new DecoderSuccess(null);
  const error = new DecoderError(null, 'message');

  tests.assertEquals(isDecoderSuccess(success as any), true);
  tests.assertEquals(isDecoderSuccess([error]), false);
  tests.assertEquals(isDecoderSuccess(error as any), false);
  tests.assertEquals(isDecoderSuccess('success' as any), false);
})

/**
 * DecoderError
 */

test(function initializesDecoderError(): void {
  const value = true;
  const message = "Failed to decode non-existant value";
  const location = "";
  const allErrors = false;

  const error = new DecoderError(value, message);

  tests.assertEquals(error.input, value);
  tests.assertEquals(error.message, message);
  tests.assertEquals(error.location, location);
  tests.assertEquals(error.allErrors, allErrors);
});

test(function areDecoderErrorsFn(): void {
  const success = new DecoderSuccess(null);
  const error = new DecoderError(null, 'message');

  tests.assertEquals(areDecoderErrors([error]), true);
  tests.assertEquals(areDecoderErrors(error as any), false);
  tests.assertEquals(areDecoderErrors(success as any), false);
  tests.assertEquals(areDecoderErrors('success' as any), false);
})

test(function initializesNestedDecoderError(): void {
  const value = true;
  const message = "Failed to decode non-existant value";
  
  const error = new DecoderError(value, message, {
    decoderName: "test",
    child: new DecoderError(false, "", {
      allErrors: true,
      child: new DecoderError(false, ""),
      location: "[0]",
      key: 0
    }),
    location: ".fruits[0]",
    key: "fruits"
  });

  tests.assertEquals(error.input, value, "error.input");
  tests.assertEquals(error.message, message, "error.message");
  tests.assertEquals(error.decoderName, "test", "error.decoderName");
  tests.assertEquals(error.key, "fruits", "error.key");
  tests.assertEquals(error.location, ".fruits[0]", "error.location");
  tests.assertEquals(error.path(), ["fruits", 0], "error.path()");
  tests.assertEquals(error.allErrors, false, "error.allErrors");

  tests.assertEquals(error.child.key, 0, "error.child.key");
  tests.assertEquals(error.child.location, "[0]", "error.child.location");
  tests.assertEquals(error.child.path(), [0], "error.child.path");
  tests.assertEquals(error.child.allErrors, true, "error.child.allErrors");

  tests.assertEquals(error.child.child.key, undefined, "error.child.child.key");
  tests.assertEquals(error.child.child.allErrors, false, "error.child.child.allErrors");
  tests.assertEquals(error.child.child.location, "", "error.child.child.location");
  tests.assertEquals(error.child.child.path(), [], "error.child.child.path");
});

runTests();
