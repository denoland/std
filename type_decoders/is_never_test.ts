// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isNever } from './is_never.ts';

/**
 * isNever()
 */

test(function initializes() {
  assertDecoder(isNever())
});

test(function decodesInput() {
  const decoder = isNever();

  for (const item of [1, -342.342342, {}, null, undefined, 'str', true]) {
    assertDecodeErrors({
      decoder: decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must not be present',
        },
      ],
      count: 1,
    });
  }
});

runTests();
