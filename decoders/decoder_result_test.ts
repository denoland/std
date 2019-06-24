// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";

test(function initializesDecoderSuccess(): void {
  assertEquals(new DecoderSuccess(true).value, true);
});

test(function initializesDecoderError(): void {
  const value = true;
  const message = 'Failed to decode non-existant value';
  const error = new DecoderError(value, message);
  
  assertEquals(error.value, value);
  assertEquals(error.message, message);
});

test(function initializesNestedDecoderError(): void {
  const value = true;
  const message = 'Failed to decode non-existant value';
  const error = new DecoderError(value, message, {
    child: new DecoderError(false, '', {
      child: new DecoderError(false, ''),
      location: '[0]',
      key: 0,
    }),
    location: '.fruits[0]',
    key: 'fruits'
  });
  
  assertEquals(error.value, value, 'error value');
  assertEquals(error.message, message, 'error message');
  assertEquals(error.key, 'fruits', 'error key');
  assertEquals(error.location, '.fruits[0]', 'error location');
  assertEquals(error.path(), ['fruits', 0], 'error path');
  assertEquals(error.child.key, 0, 'error child key');
  assertEquals(error.child.location, '[0]', 'error child location');
  assertEquals(error.child.path(), [0], 'error child path');
  assertEquals(error.child.child.key, undefined, 'error child child key');
  assertEquals(error.child.child.location, '', 'error child child location');
  assertEquals(error.child.child.path(), [], 'error child child path');
});


runTests();
