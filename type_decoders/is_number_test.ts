// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isNumber } from './is_number.ts';

/**
 * isNumber()
 */

test(function initializes() {
  assertDecoder(isNumber())
});

test(function decodesInput() {
  const decoder = isNumber();

  for (const item of [0, -14, 100, 4448928342948, 0.123, -342.342342, 3432432.4]) {
    assertDecodeSuccess(decoder, item, { expected: item }); 
  }

  for (const item of [{}, null, undefined, 'str']) {
    assertDecodeErrors({
      decoder: decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a number',
        },
      ],
      count: 1,
    });  
  }
});

runTests();
