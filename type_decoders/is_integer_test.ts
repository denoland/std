// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder } from './_testing_util.ts';
import { Decoder } from './decoder.ts';
import { isInteger } from './is_integer.ts';

/**
 * isInteger()
 */

test(function initializes() {
  assertDecoder(isInteger())
});

test(function decodesInput() {
  const decoder = isInteger();

  for (const item of [0, -14, 100, 4448928342948]) {
    assertDecodeSuccess(decoder, item, { expected: item }); 
  }

  for (const item of [0.123, -342.342342, 3432432.4, {}, null, undefined, 'str']) {
    assertDecodeErrors({
      decoder: decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a whole number',
        },
      ],
      count: 1,
    });  
  }
});

runTests();
