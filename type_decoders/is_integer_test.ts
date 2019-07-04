// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isInteger } from './is_integer.ts';

/**
 * isInteger()
 */

test(function initializes() {
  assertEquals(isInteger() instanceof Decoder, true);
});

test(function decodesInput() {
  const decoder = isInteger();
  const msg = 'must be a whole number';
  const length = 1;

  for (const item of [0, -14, 100, 4448928342948]) {
    assertDecodeSuccess(decoder, item, { expected: item }); 
  }

  for (const item of [0.123, -342.342342, 3432432.4, {}, null, undefined, 'str']) {
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
  const decoder = isInteger();
  const msg = 'must be a whole number';
  const length = 1;

  for (const item of [0, -14, 100, 4448928342948]) {
    await assertDecodeSuccess(decoder, Promise.resolve(item), { expected: item }); 
  }

  for (const item of [0.123, -342.342342, 3432432.4, {}, null, undefined, 'str']) {
    await assertDecodeErrors({
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
