import { AssertionError, assertEquals, equal } from "../testing/asserts.ts";
import {
  DecoderResult,
  areDecoderErrors,
  DecoderSuccess,
  DecoderError
} from "./decoder_result.ts";
import { Decoder, PromiseDecoder } from "./decoder.ts";

function printValue(value: unknown): string | Promise<unknown> {
  return value instanceof Promise ? value : JSON.stringify(value);
}

function assertArrayContains(
  actual: unknown[],
  expected: unknown[],
  msg?: string
): void {
  let missing: unknown[] = [];
  for (let i = 0; i < expected.length; i++) {
    let found = false;
    for (let j = 0; j < actual.length; j++) {
      if (equal(expected[i], actual[j])) {
        found = true;
        break;
      }
    }
    if (!found) {
      missing.push(expected[i]);
    }
  }
  if (missing.length === 0) {
    return;
  }
  if (!msg) {
    msg = `\n`;
    msg += `missing: ${printValue(missing)}\n\n`;
    msg += `actual: ${printValue(actual)}\n\n`;
    msg += `expected to contain: ${printValue(expected)}\n`;
  }
  throw new AssertionError(msg);
}

export const stringDecoder = new Decoder(
  (value): DecoderResult<string> =>
    typeof value === "string"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a string")]
);

export const numberDecoder = new Decoder(
  (value): DecoderResult<number> =>
    typeof value === "number"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a number")]
);

export const booleanDecoder = new Decoder(
  (value): DecoderResult<boolean> =>
    typeof value === "boolean"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a boolean")]
);

export const anyDecoder = new Decoder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (value): DecoderResult<any> => new DecoderSuccess(value)
);

export const stringPromiseDecoder = new PromiseDecoder(
  async (value): Promise<DecoderResult<string>> =>
    typeof value === "string"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a string")]
);

export const booleanPromiseDecoder = new PromiseDecoder(
  async (value): Promise<DecoderResult<boolean>> =>
    typeof value === "boolean"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a boolean")]
);

export const numberPromiseDecoder = new PromiseDecoder(
  async (value): Promise<DecoderResult<number>> =>
    typeof value === "number"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a number")]
);

/**
 * Make an assertion that `actual` is a Decoder.
 *
 * If not then throw.
 */
export function assertDecoder(actual: Decoder<unknown>, msg?: string): void {
  if (!(actual instanceof Decoder)) {
    if (!msg) {
      msg = `"${printValue(actual)}" expected to be a Decoder`;
    }
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that `actual` is a PromiseDecoder.
 *
 * If not then throw.
 */
export function assertPromiseDecoder(
  actual: PromiseDecoder<unknown>,
  msg?: string
): void {
  if (!(actual instanceof PromiseDecoder)) {
    if (!msg) {
      msg = `"${printValue(actual)}" expected to be a PromiseDecoder`;
    }
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that `actual` is a DecoderSuccess.
 *
 * If not then throw.
 */
export function assertDecoderSuccess(
  actual: DecoderResult<unknown>,
  expected: DecoderSuccess<unknown>
): void {
  if (actual instanceof Promise) {
    throw new AssertionError(
      `"${printValue(actual)}" expected to not be a promise`
    );
  }

  assertEquals(
    actual,
    expected,
    `${printValue(actual)} expected to equal ${printValue(expected)}`
  );
}

/**
 * Make an assertion that `actual` is a DecoderSuccess
 * with matching `value` to `expected`.
 *
 * If not then throw.
 */
export async function assertAsyncDecoderSuccess(
  actual: Promise<DecoderResult<unknown>>,
  expected: DecoderSuccess<unknown>
): Promise<void> {
  if (!(actual instanceof Promise)) {
    throw new AssertionError(
      `"${printValue(actual)}" expected to be Promise<DecoderSuccess>`
    );
  }

  assertEquals(await actual, expected);
}

/**
 * Make an assertion that `actual` is an array of DecoderError
 * with matching properties and length to `expected`. Also asserts that
 * `actual` is NOT an instanceof `Promise`.
 *
 * If not then throw.
 */
export function assertDecoderErrors(
  actual: DecoderResult<unknown>,
  expected: DecoderError[]
): void {
  if (actual instanceof Promise) {
    throw new AssertionError(
      `${printValue(actual)} expected to not be a promise`
    );
  }

  if (!areDecoderErrors(actual)) {
    throw new AssertionError(
      `${printValue(actual)} expected to be an array of DecoderError`
    );
  }

  if (actual.length !== expected.length) {
    throw new AssertionError(
      `${printValue(actual)} expected to have length ${
        expected.length
      } but had length ${actual.length}`
    );
  }

  assertArrayContains(actual, expected);
}

/**
 * Similar to `assertDecoderErrors`, except also asserts that
 * `actual` is an instanceof `Promise`.
 */
export async function assertAsyncDecoderErrors(
  actual: Promise<DecoderResult<unknown>>,
  expected: DecoderError[]
): Promise<void> {
  if (!(actual instanceof Promise)) {
    throw new AssertionError(
      `"${printValue(actual)}" expected to be Promise<DecoderError[]>`
    );
  }

  assertDecoderErrors(await actual, expected);
}

/**
 * Make an assertion that `decoder.decode(value)` resolves to a
 * DecoderSuccess with matching `value` to `expected`.
 */
export function assertDecodesToSuccess(
  decoder: Decoder<unknown> | PromiseDecoder<unknown>,
  value: Promise<unknown>,
  expected: DecoderSuccess<unknown>
): Promise<void>;
export function assertDecodesToSuccess(
  decoder: PromiseDecoder<unknown>,
  value: unknown,
  expected: DecoderSuccess<unknown>
): Promise<void>;
export function assertDecodesToSuccess<T>(
  decoder: Decoder<unknown>,
  value: unknown,
  expected: DecoderSuccess<unknown>
): void;
export function assertDecodesToSuccess(
  decoder: Decoder<unknown> | PromiseDecoder<unknown>,
  value: unknown,
  expected: DecoderSuccess<unknown>
): void | Promise<void> {
  if (decoder instanceof PromiseDecoder || value instanceof Promise) {
    const result = decoder.decode(value);

    return assertAsyncDecoderSuccess(
      result as Promise<DecoderResult<unknown>>,
      expected
    );
  }

  assertDecoderSuccess(decoder.decode(value), expected);
}

/**
 * Make an assertion that `decoder.decode(value)` resolves to an
 * array of DecoderError with matching properties and length to
 * `expected`.
 *
 * If not then throw.
 */
export function assertDecodesToErrors(
  decoder: Decoder<unknown> | PromiseDecoder<unknown>,
  value: Promise<unknown>,
  expected: DecoderError[]
): Promise<void>;
export function assertDecodesToErrors(
  decoder: PromiseDecoder<unknown>,
  value: unknown,
  expected: DecoderError[]
): Promise<void>;
export function assertDecodesToErrors(
  decoder: Decoder<unknown>,
  value: unknown,
  expected: DecoderError[]
): void;
export function assertDecodesToErrors(
  decoder: Decoder<unknown> | PromiseDecoder<unknown>,
  value: unknown,
  expected: DecoderError[]
): void | Promise<void> {
  if (decoder instanceof PromiseDecoder || value instanceof Promise) {
    const result = decoder.decode(value);

    return assertAsyncDecoderErrors(
      result as Promise<DecoderResult<unknown>>,
      expected
    );
  }

  assertDecoderErrors(decoder.decode(value), expected);
}
