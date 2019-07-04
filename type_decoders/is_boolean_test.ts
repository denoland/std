// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isBoolean } from './is_boolean.ts';

/**
 * isBoolean()
 */

test(function initializes(): void {
  assertDecoder(isBoolean())
});

test(function decodesBoolean(): void {
  const decoder = isBoolean();

  assertDecodeSuccess(decoder, true, { expected: true });
  assertDecodeSuccess(decoder, false, { expected: false });

  for (const item of [{}, null, 0, 'false', undefined]) {
    assertDecodeErrors({
      decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a boolean',
        },
      ],
      count: 1,
    });
  }
});

runTests();
