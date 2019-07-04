// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import {
  assertDecodeSuccess,
  assertDecodeErrors,
  assertDecoder,
} from './_testing_util.ts';
import { Decoder } from './decoder.ts';
import { isLazy } from './is_lazy.ts';
import { DecoderSuccess } from './decoder_result.ts';
import { isObject } from './is_object.ts';
import { isArray } from './is_array.ts';

/**
 * isLazy()
 */

test(function initializes() {
  const blankDecoder = new Decoder(value => new DecoderSuccess(value));

  assertDecoder(isLazy(() => blankDecoder));
});

test(function noOptions() {
  const blankDecoder = new Decoder(value => new DecoderSuccess(value));

  const decoder = isObject({
    type: blankDecoder,
    value: isArray(isLazy(() => decoder)),
  });

  for (const item of [
    { type: 'any', value: [] },
    { type: false, value: [{ type: 3, value: [] }] },
    {
      type: 'any',
      value: [
        {
          type: Symbol('fed'),
          value: [
            { type: {}, value: [{ type: 3, value: [] }] },
            { type: ['any'], value: [] },
          ],
        },
      ],
    },
  ]) {
    assertDecodeSuccess(decoder, item);
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  const obj1 = { type: 'any', value: [''] };
  assertDecodeErrors({
    decoder: decoder,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg:
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `must be a non-null object`,
      },
    ],
    count: 1,
  });
});

test(function optionAllErrors() {
  const blankDecoder = new Decoder(value => new DecoderSuccess(value));

  const decoder = isObject(
    {
      type: blankDecoder,
      value: isArray(isLazy(() => decoder), { allErrors: true }),
    },
    {
      allErrors: true,
    },
  );

  for (const item of [
    { type: 'any', value: [] },
    { type: false, value: [{ type: 3, value: [] }] },
    {
      type: 'any',
      value: [
        {
          type: Symbol('fed'),
          value: [
            { type: {}, value: [{ type: 3, value: [] }] },
            { type: ['any'], value: [] },
          ],
        },
      ],
    },
  ]) {
    assertDecodeSuccess(decoder, item);
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  const obj1 = { type: 'any', value: [''] };
  assertDecodeErrors({
    decoder: decoder,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg:
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `must be a non-null object`,
        location: 'value[0]',
        path: ['value', 0],
      },
    ],
    count: 1,
  });

  const obj2 = {
    type: false,
    value: [{ type: 3, value: [[12, 5], { type: 3, value: [''] }] }],
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg:
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `missing key ["value"]`,
        location: 'value[0].value[0]',
        path: ['value', 0, 'value', 0],
      },
      {
        input: obj2,
        msg:
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `invalid value for key ["value"] > ` +
          `invalid element [1] > ` +
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `must be a non-null object`,
        location: 'value[0].value[1].value[0]',
        path: ['value', 0, 'value', 1, 'value', 0],
      },
    ],
    count: 2,
  });

  const obj3 = {
    type: 'any',
    value: [
      {
        type: Symbol('fed'),
        value: [
          { type: {}, value: [{ type: 3 }, { type: 3, value: [] }] },
          { type: ['any'], value: {} },
        ],
      },
    ],
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg:
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `missing key ["value"]`,
        location: 'value[0].value[0].value[0]',
        path: ['value', 0, 'value', 0, 'value', 0],
      },
      {
        input: obj3,
        msg:
          `invalid value for key ["value"] > ` +
          `invalid element [0] > ` +
          `invalid value for key ["value"] > ` +
          `invalid element [1] > ` +
          `invalid value for key ["value"] > ` +
          `must be an array`,
        location: 'value[0].value[1].value',
        path: ['value', 0, 'value', 1, 'value'],
      },
    ],
    count: 2,
  });
});

runTests();
