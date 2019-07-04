// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import { assertDecodeSuccess, assertDecodeErrors, assertDecoder } from './_testing_util.ts';
import { Decoder } from './decoder.ts';
import { isTuple } from './is_tuple.ts';
import { DecoderSuccess, DecoderError } from './decoder_result.ts';
import { ok, err } from './_util.ts';

/**
 * isTuple()
 */

test(function initializes() {
  const blankDecoder = new Decoder(value => new DecoderSuccess(value));

  assertDecoder(isTuple([blankDecoder]))
  assertDecoder(isTuple([blankDecoder, blankDecoder]))
});

test(function noOptions() {
  const stringDecoder = new Decoder(value =>
    typeof value === 'string'
      ? new DecoderSuccess(value)
      : [new DecoderError(value, 'must be a string')],
  );

  const numberDecoder = new Decoder(value =>
    typeof value === 'number'
      ? new DecoderSuccess(value)
      : [new DecoderError(value, 'must be a number')],
  );

  const booleanDecoder = new Decoder(value =>
    typeof value === 'boolean'
      ? new DecoderSuccess(value)
      : [new DecoderError(value, 'must be a boolean')],
  );

  const decoder = isTuple([
    stringDecoder,
    numberDecoder,
    booleanDecoder,
  ]);

  for (const item of [
    ['string', 10, true],
    ['one', -2, true],
    ['', 232.023, false],
  ]) {
    // isTuple returns a new array so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  for (const item of [
    {}, null, undefined, 1, true, 'happy',
  ]) {
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

  const obj1 = [10, true, 'string'];
  assertDecodeErrors({
    decoder,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg: 'invalid element [0] > must be a string',
      },
    ],
    count: 1,
  });

  const obj2 = ['one', true, -2];
  assertDecodeErrors({
    decoder,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg: 'invalid element [1] > must be a number',
      },
    ],
    count: 1,
  });

  const obj3 = [232.023, '', false];
  assertDecodeErrors({
    decoder,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: 'invalid element [0] > must be a string',
      },
    ],
    count: 1,
  });

  const obj4 = [false, '', 232.023];
  assertDecodeErrors({
    decoder,
    input: obj4,
    expected: [
      {
        input: obj4,
        msg: 'invalid element [0] > must be a string',
      },
    ],
    count: 1,
  });

  const obj5 = [false, 232.023, ''];
  assertDecodeErrors({
    decoder,
    input: obj5,
    expected: [
      {
        input: obj5,
        msg: 'invalid element [0] > must be a string',
      },
    ],
    count: 1,
  });

  const obj6 = ['string', 10, true, ''];
  assertDecodeErrors({
    decoder,
    input: obj6,
    expected: [
      {
        input: obj6,
        msg: 'array must have length 3',
      },
    ],
    count: 1,
  });

  const obj7 = ['string', 10];
  assertDecodeErrors({
    decoder,
    input: obj7,
    expected: [
      {
        input: obj7,
        msg: 'array must have length 3',
      },
    ],
    count: 1,
  });

  const obj8 = [{}, 10, true];
  assertDecodeErrors({
    decoder,
    input: obj8,
    expected: [
      {
        input: obj8,
        msg: 'invalid element [0] > must be a string',
      },
    ],
    count: 1,
  });
});

test(function optionAllErrors() {
  const stringDecoder = new Decoder(value =>
    typeof value === 'string'
      ? new DecoderSuccess(value)
      : [new DecoderError(value, 'must be a string')],
  );

  const numberDecoder = new Decoder(value =>
    typeof value === 'number'
      ? new DecoderSuccess(value)
      : [new DecoderError(value, 'must be a number')],
  );

  const booleanDecoder = new Decoder(value =>
    typeof value === 'boolean'
      ? new DecoderSuccess(value)
      : [new DecoderError(value, 'must be a boolean')],
  );

  const decoder = isTuple([
    stringDecoder,
    numberDecoder,
    booleanDecoder,
  ], {
    allErrors: true,
  });

  for (const item of [
    ['string', 10, true],
    ['one', -2, true],
    ['', 232.023, false],
  ]) {
    // isTuple returns a new array so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  for (const item of [
    {}, null, undefined, 1, true, 'happy',
  ]) {
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

  const obj1 = [10, true, 'string'];
  assertDecodeErrors({
    decoder,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg: 'invalid element [0] > must be a string',
      },
      {
        input: obj1,
        msg: 'invalid element [1] > must be a number',
      },
      {
        input: obj1,
        msg: 'invalid element [2] > must be a boolean',
      },
    ],
    count: 3,
  });

  const obj2 = ['one', true, -2];
  assertDecodeErrors({
    decoder,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg: 'invalid element [1] > must be a number',
      },
      {
        input: obj2,
        msg: 'invalid element [2] > must be a boolean',
      },
    ],
    count: 2,
  });

  const obj3 = [232.023, '', false];
  assertDecodeErrors({
    decoder,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: 'invalid element [0] > must be a string',
      },
      {
        input: obj3,
        msg: 'invalid element [1] > must be a number',
      },
    ],
    count: 2,
  });

  const obj4 = [false, '', 232.023];
  assertDecodeErrors({
    decoder,
    input: obj4,
    expected: [
      {
        input: obj4,
        msg: 'invalid element [0] > must be a string',
      },
      {
        input: obj4,
        msg: 'invalid element [1] > must be a number',
      },
      {
        input: obj4,
        msg: 'invalid element [2] > must be a boolean',
      },
    ],
    count: 3,
  });

  const obj5 = [false, 232.023, ''];
  assertDecodeErrors({
    decoder,
    input: obj5,
    expected: [
      {
        input: obj5,
        msg: 'invalid element [0] > must be a string',
      },
      {
        input: obj5,
        msg: 'invalid element [2] > must be a boolean',
      },
    ],
    count: 2,
  });

  const obj6 = ['string', 10, true, ''];
  assertDecodeErrors({
    decoder,
    input: obj6,
    expected: [
      {
        input: obj6,
        msg: 'array must have length 3',
      },
    ],
    count: 1,
  });

  const obj7 = ['string', 10];
  assertDecodeErrors({
    decoder,
    input: obj7,
    expected: [
      {
        input: obj7,
        msg: 'array must have length 3',
      },
      {
        input: obj7,
        msg: 'invalid element [2] > must be a boolean',
      },
    ],
    count: 2,
  });

  const obj8 = [{}, 10, true];
  assertDecodeErrors({
    decoder,
    input: obj8,
    expected: [
      {
        input: obj8,
        msg: 'invalid element [0] > must be a string',
      },
    ],
    count: 1,
  });
});

runTests();
