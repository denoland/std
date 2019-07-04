// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import { assertEquals } from '../testing/asserts.ts';
import {
  assertDecodeSuccess,
  assertDecodeErrors,
  assertDecoder,
  stringDecoder,
  booleanDecoder,
  numberDecoder,
} from './_testing_util.ts';
import { Decoder } from './decoder.ts';
import { isChainOf } from './is_chain_of.ts';
import { DecoderSuccess, DecoderError } from './decoder_result.ts';

/**
 * isChainOf()
 */

test(function initializes(): void {
  assertDecoder(isChainOf([stringDecoder]));
  assertDecoder(isChainOf([stringDecoder, numberDecoder]));
});

test(function noOptions(): void {
  const lengthDecoder = new Decoder<string, string>(value =>
    value.length > 10
      ? new DecoderSuccess(value)
      : [new DecoderError(value, 'string must have length greater than 10')],
  );

  const decoder = isChainOf([stringDecoder, lengthDecoder]);

  for (const item of ['thisistenletters', 'morethan10letters', 'iamelevenle']) {
    assertDecodeSuccess(decoder, item, { expected: item });
  }

  for (const item of ['test', 'iameEDvenl', '']) {
    assertDecodeErrors({
      decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: 'string must have length greater than 10',
        },
      ],
      count: 1,
    });
  }

  for (const item of [true, false, 1, 23.432, -3432]) {
    assertDecodeErrors({
      decoder,
      input: item,
      expected: [
        {
          input: item,
          msg: 'must be a string',
        },
      ],
      count: 1,
    });
  }
});

runTests();
