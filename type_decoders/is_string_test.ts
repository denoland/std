// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isString } from './is_string.ts';

/**
 * isString()
 */

test(function initializes() {
  assertEquals(isString() instanceof Decoder, true);
});

test(function decodesInput() {
  const decoder = isString();
  const msg = 'must be a string';
  const length = 1;

  for (const item of ['0', '-14']) {
    assertDecodeSuccess(decoder, item, { expected: item }); 
  }

  for (const item of [0.123, -342.342342, {}, null, undefined]) {
    assertDecodeErrors({
      decoder: decoder,
      input: item,
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }
});

test(async function decodesPromiseInput() {
  const decoder = isString();
  const msg = 'must be a string';
  const length = 1;

  for (const item of ['0', '-14']) {
    assertDecodeSuccess(decoder, Promise.resolve(item), { expected: item }); 
  }

  for (const item of [0.123, -342.342342, {}, null, undefined]) {
    assertDecodeErrors({
      decoder: decoder,
      input: Promise.resolve(item),
      expected: {
        input: item,
        msg,
        length,
      },
    });  
  }
});

runTests();
