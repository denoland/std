// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from '../testing/mod.ts';
import {
  assertDecodesToSuccess,
  assertDecodesToErrors,
  assertDecoder,
  stringDecoder,
} from './test_util.ts';
import { Decoder, PromiseDecoder } from './decoder.ts';
import { isLazy } from './is_lazy.ts';
import {
  DecoderSuccess,
  DecoderError,
  areDecoderErrors,
  DecoderResult,
} from './decoder_result.ts';

interface ArrayLike {
  [key: number]: ArrayLike;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const decoder: Decoder<ArrayLike, any> = new Decoder(
  (input): DecoderResult<ArrayLike> => {
    if (!Array.isArray(input)) {
      return [new DecoderError(input, 'must be an array')];
    }

    let index = -1;
    const array: ArrayLike[] = [];

    for (const element of input) {
      index++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = isLazy((): Decoder<ArrayLike, any> => decoder).decode(
        element,
      );

      if (areDecoderErrors(result)) {
        return result.map(
          (error): DecoderError =>
            new DecoderError(
              input,
              `invalid element [${index}] > ${error.message}`,
              {
                location: `[${index}]${error.location}`,
                key: index,
                child: error,
              },
            ),
        );
      }

      array.push(result.value);
    }

    return new DecoderSuccess(array);
  },
);

/**
 * isLazy()
 */

test({
  name: 'init isLazy()',
  fn: (): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assertDecoder(isLazy((): Decoder<string, any> => stringDecoder));
  },
});

test({
  name: 'isLazy()',
  fn: (): void => {
    for (const item of [[], [[]], [[], [], [[], [], []]]]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    const obj1 = [[], [], [[], [true], []]];
    const msg =
      `invalid element [2] > invalid element [1] > ` +
      `invalid element [0] > must be an array`;

    assertDecodesToErrors(decoder, obj1, [
      new DecoderError(obj1, msg, {
        location: '[2][1][0]',
        key: 2,
        child: new DecoderError(
          obj1[2],
          'invalid element [1] > invalid element [0] > must be an array',
          {
            location: '[1][0]',
            key: 1,
            child: new DecoderError(
              obj1[2][1],
              'invalid element [0] > must be an array',
              {
                location: '[0]',
                key: 0,
                child: new DecoderError(obj1[2][1][0], 'must be an array', {
                  location: '',
                }),
              },
            ),
          },
        ),
      }),
    ]);
  },
});

test({
  name: 'async isLazy()',
  fn: async (): Promise<void> => {
    const promiseDecoder = new PromiseDecoder(
      async (value): Promise<DecoderResult<ArrayLike>> => decoder.decode(value),
    );

    for (const item of [[], [[]], [[], [], [[], [], []]]]) {
      await assertDecodesToSuccess(
        promiseDecoder,
        item,
        new DecoderSuccess(item),
      );
    }

    const obj1 = [[], [], [[], [true], []]];
    const msg =
      `invalid element [2] > invalid element [1] > ` +
      `invalid element [0] > must be an array`;

    await assertDecodesToErrors(promiseDecoder, obj1, [
      new DecoderError(obj1, msg, {
        location: '[2][1][0]',
        key: 2,
        child: new DecoderError(
          obj1[2],
          'invalid element [1] > invalid element [0] > must be an array',
          {
            location: '[1][0]',
            key: 1,
            child: new DecoderError(
              obj1[2][1],
              'invalid element [0] > must be an array',
              {
                location: '[0]',
                key: 0,
                child: new DecoderError(obj1[2][1][0], 'must be an array', {
                  location: '',
                }),
              },
            ),
          },
        ),
      }),
    ]);
  },
});

runTests();
