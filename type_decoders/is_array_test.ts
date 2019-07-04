// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder } from './testing_asserts.ts';
import { Decoder } from './decoder.ts';
import { isArray } from './is_array.ts';
import { DecoderSuccess } from './decoder_result.ts';
import { ok, err } from './_util.ts';

/**
 * isArray()
 */

test(function initializes() {
  assertDecoder(isArray())
});

test(function decodesInput() {
  const decoder = isArray();

  for (const item of [[], [1, 'string'], new Array(1000)]) {
    // isArray returns a new array so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  for (const item of [true, false, {}, 'false', Symbol(), Set]) {
    assertDecodeErrors({
      decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be an array',
        },
      ],
      count: 1,
    });
  }
});

test(function decodesInputElements() {
  const stringDecoder = new Decoder(value =>
    typeof value === 'string'
      ? ok(value)
      : err(value, 'must be a string', 'isString'),
  );

  const arrayDecoder = isArray(stringDecoder);

  for (const item of [[], ['one', 'two']]) {
    // is array returns a new array so we can't use the `expected` option
    assertDecodeSuccess(arrayDecoder, item);
    assertEquals(arrayDecoder.decode(item), new DecoderSuccess(item));
  }

  for (const item of [
    'three',
    3,
    null,
    [true],
    [1, 'two'],
    ['two', false],
    ['two', 1, 'green'],
  ]) {
    assertDecodeErrors({
      decoder: arrayDecoder,
      input: item,
      expected: [
        {
          input: item,
        },
      ],
      count: 1,
    });
  }
});

test(function getSingleError() {
  const stringDecoder = new Decoder(value =>
    typeof value === 'string'
      ? ok(value)
      : err(value, 'must be a string', 'isString'),
  );

  const arrayDecoder = isArray(stringDecoder);
  const count = 1;

  assertDecodeErrors({
    decoder: arrayDecoder,
    input: 'three',
    expected: [
      {
        input: 'three',
        msg: 'must be an array',
      },
    ],
    count,
  });

  const array1 = [true];
  assertDecodeErrors({
    decoder: arrayDecoder,
    input: array1,
    expected: [
      {
        input: array1,
        msg: 'invalid element [0] > must be a string',
      },
    ],
    count,
  });

  const array2 = [1, 'two'];
  assertDecodeErrors({
    decoder: arrayDecoder,
    input: array2,
    expected: [
      {
        input: array2,
        msg: 'invalid element [0] > must be a string',
      },
    ],
    count,
  });

  const array3 = ['two', 1, 'green'];
  assertDecodeErrors({
    decoder: arrayDecoder,
    input: array3,
    expected: [
      {
        input: array3,
        msg: 'invalid element [1] > must be a string',
      },
    ],
    count,
  });
});

test(function getAllErrors() {
  const stringDecoder = new Decoder(value =>
    typeof value === 'string'
      ? ok(value)
      : err(value, 'must be a string', 'isString'),
  );

  const arrayDecoder = isArray(stringDecoder, {
    allErrors: true,
  });

  assertDecodeErrors({
    decoder: arrayDecoder,
    input: 'three',
    expected: [
      {
        input: 'three',
        msg: 'must be an array',
      },
    ],
    count: 1,
  });

  const array1 = [true];
  assertDecodeErrors({
    decoder: arrayDecoder,
    input: array1,
    expected: [
      {
        input: array1,
        msg: 'invalid element [0] > must be a string',
      },
    ],
    count: 1,
  });

  const array2 = ['two', 1, 'green'];
  assertDecodeErrors({
    decoder: arrayDecoder,
    input: array2,
    expected: [
      {
        input: array2,
        msg: 'invalid element [1] > must be a string',
      },
    ],
    count: 1,
  });

  const array3 = [2, 1, 'green'];
  assertDecodeErrors({
    decoder: arrayDecoder,
    input: array3,
    expected: [
      {
        input: array3,
        msg: 'invalid element [0] > must be a string',
      },
      {
        input: array3,
        msg: 'invalid element [1] > must be a string',
      }
    ],
    count: 2,
  });
});

runTests();
