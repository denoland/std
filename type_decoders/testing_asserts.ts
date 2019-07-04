import { AssertionError } from '../testing/asserts.ts';
import {
  DecoderResult,
  areDecoderErrors,
  isDecoderSuccess,
} from './decoder_result.ts';
import { Decoder, PromiseDecoder } from './decoder.ts';

function printValue(value: unknown) {
  return typeof value === 'string' ? JSON.stringify(value) : value;
}

/**
 * Make an assertion that `actual` is an array of DecoderError. If not
 * then throw.
 */
export function assertDecoderErrors(
  actual: DecoderResult<unknown>,
  msg?: string,
): void {
  if (!areDecoderErrors(actual)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to be an array of DecoderError`;
    }
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that `actual` is a DecoderSuccess. If not
 * then throw.
 */
export function assertDecoderSuccess(
  actual: DecoderResult<unknown>,
  options: {
    value?: unknown;
    msg?: string;
  } = {},
): void {
  let msg = options.msg;

  if (!isDecoderSuccess(actual)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to be DecoderSuccess`;
    }
    throw new AssertionError(msg);
  }

  if (options.hasOwnProperty('value') && actual.value !== options.value) {
    if (!msg) {
      msg = `DecoderSuccess#value expected to be "${options.value}" was "${
        actual.value
      }"`;
    }
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that `decoder.decode(value)` resolves to a DecoderSuccess.
 * Optionally, assert the expected value of DecoderSuccess#value.
 */
export function assertDecodeSuccess(
  decoder: Decoder<unknown> | PromiseDecoder<unknown>,
  value: Promise<unknown>,
  options?: { expected?: unknown },
): Promise<void>;
export function assertDecodeSuccess(
  decoder: PromiseDecoder<unknown>,
  value: unknown,
  options?: { expected?: unknown },
): Promise<void>;
export function assertDecodeSuccess<T>(
  decoder: Decoder<unknown>,
  value: unknown,
  options?: { expected?: unknown },
): void;
export function assertDecodeSuccess(
  decoder: Decoder<unknown> | PromiseDecoder<unknown>,
  value: unknown,
  options: {
    expected?: unknown;
  } = {},
): void | Promise<void> {
  const testResult = (result: DecoderResult<unknown>) => {
    if (!isDecoderSuccess(result)) {
      throw new AssertionError(
        `decoder.decode(${printValue(
          value,
        )}) expected to resolve to DecodeSuccess`,
      );
    }

    if (
      options.hasOwnProperty('expected') &&
      result.value !== options.expected
    ) {
      throw new AssertionError(
        `decoder.decode(${printValue(
          value,
        )}).value expected to resolve to ${printValue(options.expected)}`,
      );
    }
  };

  if (value instanceof Promise || decoder instanceof PromiseDecoder) {
    const promise = decoder.decode(value);

    if (!(promise instanceof Promise)) {
      throw new AssertionError(
        `decoder.decode(${printValue(value)}) expected to return Promise`,
      );
    }

    return promise.then(result => testResult(result));
  }

  const result = decoder.decode(value);

  testResult(result);
}

/**
 * Make an assertion that `decoder.decode(value)` resolves to an
 * array of DecoderError.
 *
 * Optionally, assert the expected value of DecoderError#input.
 */
export function assertDecodeErrors(args: {
  decoder: Decoder<unknown> | PromiseDecoder<unknown>;
  input: Promise<unknown>;
  expected?: {
    input?: unknown;
    msg?: string;
    length?: number;
  };
}): Promise<void>;
export function assertDecodeErrors(args: {
  decoder: PromiseDecoder<unknown>;
  input: unknown;
  expected?: {
    input?: unknown;
    msg?: string;
    length?: number;
  };
}): Promise<void>;
export function assertDecodeErrors(args: {
  decoder: Decoder<unknown>;
  input: unknown;
  expected?: {
    input?: unknown;
    msg?: string;
    length?: number;
  };
}): void;
export function assertDecodeErrors(args: {
  decoder: Decoder<unknown> | PromiseDecoder<unknown>;
  input: unknown;
  expected?: {
    input?: unknown;
    msg?: string;
    length?: number;
  };
}): void | Promise<void> {
  const expected = args.expected || {};
  const testResult = (result: DecoderResult<unknown>) => {
    if (!areDecoderErrors(result)) {
      throw new AssertionError(
        `decoder.decode(${printValue(args.input)}) ` +
          `expected to resolve to an array of DecodeError`,
      );
    }

    if (
      expected.hasOwnProperty('length') &&
      result.length !== expected.length
    ) {
      throw new AssertionError(
        `decoder.decode(${printValue(args.input)}) ` +
          `expected to resolve to an array of length ` +
          `${printValue(expected.length)} but it resolved ` +
          `to an array of length ${printValue(result.length)}`,
      );
    }

    const error = result[0];

    if (expected.hasOwnProperty('input') && error.input !== expected.input) {
      throw new AssertionError(
        `decoder.decode(${printValue(args.input)}) DecoderError#input ` +
          `expected to resolve to ${printValue(expected.input)}`,
      );
    }

    if (expected.hasOwnProperty('msg') && error.message !== expected.msg) {
      throw new AssertionError(
        `decoder.decode(${printValue(args.input)}) DecoderError#message ` +
          `expected to resolve to ${printValue(expected.msg)} ` +
          `but it resolved to ${printValue(error.message)}`,
      );
    }
  };

  if (args.input instanceof Promise || args.decoder instanceof PromiseDecoder) {
    const promise = args.decoder.decode(args.input);

    if (!(promise instanceof Promise)) {
      throw new AssertionError(
        `decoder.decode(${printValue(args.input)}) expected to return Promise`,
      );
    }

    return promise.then(result => testResult(result));
  }

  const result = args.decoder.decode(args.input);

  testResult(result);
}

/**
 * Make an assertion that `actual` is promise and that
 * it resolves to an array of DecoderError. If not
 * then throw.
 */
export async function assertPromiseDecoderErrors(
  actual: Promise<DecoderResult<unknown>>,
  msg?: string,
): Promise<void> {
  if (!(actual instanceof Promise)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to be a Promise`;
    }
    throw new AssertionError(msg);
  }

  const result = await actual;

  if (!areDecoderErrors(result)) {
    if (!isDecoderSuccess(result)) {
      if (!msg) {
        msg = `actual: "${actual}" expected to resolve to an array of DecoderError`;
      }
    } else {
      if (!msg) {
        msg = `input "${
          result.value
        }" expected to resolve to an array of DecoderError`;
      }
    }
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that `actual` is promise and that
 * it resolves to a DecoderSuccess. If not then throw.
 */
export async function assertPromiseDecoderSuccess(
  actual: Promise<DecoderResult<unknown>>,
  msg?: string,
): Promise<void> {
  if (!(actual instanceof Promise)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to be a Promise`;
    }
    throw new AssertionError(msg);
  }

  const result = await actual;

  if (!isDecoderSuccess(result)) {
    if (!areDecoderErrors(result)) {
      if (!msg) {
        msg = `actual: "${actual}" expected to resolve to DecoderSuccess`;
      }
    } else {
      if (!msg) {
        msg = `input "${
          result[0].input
        }" expected to resolve to DecoderSuccess`;
      }
    }
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that `actual` is a Decoder.
 * If not then throw.
 */
export function assertDecoder(actual: Decoder<unknown>, msg?: string): void {
  if (!(actual instanceof Decoder)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to be a Decoder`;
    }
    throw new AssertionError(msg);
  }
}

/**
 * Make an assertion that `actual` is a PromiseDecoder.
 * If not then throw.
 */
export function assertPromiseDecoder(
  actual: PromiseDecoder<unknown>,
  msg?: string,
): void {
  if (!(actual instanceof PromiseDecoder)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to be a PromiseDecoder`;
    }
    throw new AssertionError(msg);
  }
}
