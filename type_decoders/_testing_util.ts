import { AssertionError } from '../testing/asserts.ts';
import {
  DecoderResult,
  areDecoderErrors,
  isDecoderSuccess,
  DecoderSuccess,
  DecoderError,
} from './decoder_result.ts';
import { Decoder, PromiseDecoder } from './decoder.ts';

function printValue(value: unknown) {
  return value instanceof Promise ? value : JSON.stringify(value);
}

/**
 * Make an assertion that `actual` is an array of DecoderError. If not
 * then throw.
 */
export function assertDecoderErrors(args: {
  errors: DecoderResult<unknown>,
  expected?: Array<{
    input?: unknown;
    msg?: string;
    location?: string;
    path?: unknown[];
    decoderName?: string;
    allErrors?: boolean;
  }>,
  count?: number,
}): void {
  if (!areDecoderErrors(args.errors)) {
    throw new AssertionError(
      `expected to recieve an array of DecodeError but received ${printValue(args.errors)}`,
    );
  }

  const errors = args.errors;

  if (args.count !== undefined && errors.length !== args.count) {
    throw new AssertionError(
        `expected errors to have length ${args.count} but it instead has length ${errors.length}`
    );
  }

  const expectedErrors = args.expected || [];

  expectedErrors.forEach(expected => {
    const hasError = errors.some(error => {
      const criteria: boolean[] = [];

      if (expected.hasOwnProperty('input')) {
        criteria.push(error.input === expected.input);
      }

      if (expected.hasOwnProperty('msg')) {
        criteria.push(error.message === expected.msg);
      }

      if (expected.hasOwnProperty('location')) {
        criteria.push(error.location === expected.location);
      }

      if (expected.hasOwnProperty('path')) {
        const path = error.path();

        criteria.push(
          expected.path.every((key, index) => key === path[index]),
        );
      }

      if (expected.hasOwnProperty('decoderName')) {
        criteria.push(error.decoderName === expected.decoderName);
      }

      if (expected.hasOwnProperty('allErrors')) {
        criteria.push(error.allErrors === expected.allErrors);
      }

      return criteria.length > 0 && criteria.every(val => val);
    });

    if (!hasError) {
      if (expected.hasOwnProperty('input')) {
        if (!errors.some(error => error.input === expected.input)) {
          throw new AssertionError(
              `expected a DecoderError to have #input ${printValue(expected.input)}`,
          );
        }
      }

      if (expected.hasOwnProperty('msg')) {
        if (!errors.some(error => error.message === expected.msg)) {
          if (args.count === 1) {
            throw new AssertionError(
              `expected DecoderError to have #message ${printValue(expected.msg)} ` +
              `but instead has message ${printValue(errors[0].message)}` ,
            );
          }

          throw new AssertionError(
              `expected a DecoderError to have #message ${printValue(expected.msg)}`,
          );
        }
      }

      if (expected.hasOwnProperty('location')) {
        if (!errors.some(error => error.location === expected.location)) {
          throw new AssertionError(
              `expected a DecoderError to have #location ${printValue(expected.location)} `,
          );
        }
      }

      if (expected.hasOwnProperty('path')) {
        if (
          !errors.some(error =>
            expected.path.every((key, index) => key === error.path()[index]),
          )
        ) {
          throw new AssertionError(
              `expected a DecoderError to have #path ${printValue(expected.path)}`,
          );
        }
      }

      if (expected.hasOwnProperty('decoderName')) {
        if (!errors.some(error => error.decoderName === expected.decoderName)) {
          throw new AssertionError(
              `expected a DecoderError to have #decoderName ${printValue(expected.decoderName)} `,
          );
        }
      }

      if (expected.hasOwnProperty('allErrors')) {
        if (!errors.some(error => error.allErrors === expected.allErrors)) {
          throw new AssertionError(
              `expected a DecoderError to have #allErrors ${printValue(expected.allErrors)} `,
          );
        }
      }

      throw new AssertionError(
        `\n  Expected DecoderError array to have a DecoderError ` +
          `containing the following properties:\n\n ` +
          `${printValue(expected)}\n\n`,
      );
    }
  });
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
  expected?: Array<{
    input?: unknown;
    msg?: string;
    location?: string;
    path?: unknown[];
  }>;
  count?: number;
}): Promise<void>;
export function assertDecodeErrors(args: {
  decoder: PromiseDecoder<unknown>;
  input: unknown;
  expected?: Array<{
    input?: unknown;
    msg?: string;
    location?: string;
    path?: unknown[];
  }>;
  count?: number;
}): Promise<void>;
export function assertDecodeErrors(args: {
  decoder: Decoder<unknown>;
  input: unknown;
  expected?: Array<{
    input?: unknown;
    msg?: string;
    location?: string;
    path?: unknown[];
  }>;
  count?: number;
}): void;
export function assertDecodeErrors(args: {
  decoder: Decoder<unknown> | PromiseDecoder<unknown>;
  input: unknown;
  expected?: Array<{
    input?: unknown;
    msg?: string;
    location?: string;
    path?: unknown[];
  }>;
  count?: number;
}): void | Promise<void> {
  const expectedErrors = args.expected || [];
  const testResult = (result: DecoderResult<unknown>) => {
    if (!areDecoderErrors(result)) {
      throw new AssertionError(
        `decoder.decode(${printValue(args.input)}) ` +
          `expected to resolve to an array of DecodeError`,
      );
    }

    if (args.count !== undefined && result.length !== args.count) {
      throw new AssertionError(
        `decoder.decode(${printValue(args.input)}) ` +
          `expected to have ` +
          `${printValue(args.count)} DecoderErrors but it ` +
          `resolved to have ${printValue(result.length)}`,
      );
    }

    expectedErrors.forEach(expected => {
      const hasError = result.some(error => {
        const criteria: boolean[] = [];

        if (expected.hasOwnProperty('input')) {
          criteria.push(error.input === expected.input);
        }

        if (expected.hasOwnProperty('msg')) {
          criteria.push(error.message === expected.msg);
        }

        if (expected.hasOwnProperty('location')) {
          criteria.push(error.location === expected.location);
        }

        if (expected.hasOwnProperty('path')) {
          const path = error.path();

          criteria.push(
            expected.path.every((key, index) => key === path[index]),
          );
        }

        return criteria.length > 0 && criteria.every(val => val);
      });

      if (!hasError) {
        if (expected.hasOwnProperty('input')) {
          if (!result.some(error => error.input === expected.input)) {
            throw new AssertionError(
              `decoder.decode(${printValue(args.input)}) DecoderError#input ` +
                `expected to resolve to ${printValue(expected.input)}`,
            );
          }
        }

        if (expected.hasOwnProperty('msg')) {
          if (!result.some(error => error.message === expected.msg)) {
            if (args.count === 1) {
              throw new AssertionError(
                `decoder.decode(${printValue(
                  args.input,
                )}) DecoderError#message ` +
                  `expected to resolve to ${printValue(expected.msg)} ` +
                  `but it resolved to ${printValue(result[0].message)}`,
              );
            }

            throw new AssertionError(
              `decoder.decode(${printValue(
                args.input,
              )}) DecoderError#message ` +
                `expected to include ${printValue(expected.msg)} ` +
                `but none did`,
            );
          }
        }

        if (expected.hasOwnProperty('location')) {
          if (!result.some(error => error.location === expected.location)) {
            throw new AssertionError(
              `decoder.decode(${printValue(
                args.input,
              )}) DecoderError#location ` +
                `expected to resolve to ${printValue(expected.location)}`,
            );
          }
        }

        if (expected.hasOwnProperty('path')) {
          if (
            !result.some(error =>
              expected.path.every((key, index) => key === error.path()[index]),
            )
          ) {
            throw new AssertionError(
              `decoder.decode(${printValue(args.input)}) DecoderError#path() ` +
                `expected to resolve to ${printValue(expected.path)}`,
            );
          }
        }

        throw new AssertionError(
          `\n  decoder.decode(${printValue(args.input)})\n\n ` +
            `Did not resolve with a DecoderError containing ` +
            `the following properties:\n\n ` +
            `${printValue(expected)}\n\n`,
        );
      }
    });
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


export const stringDecoder = new Decoder(value =>
  typeof value === 'string'
    ? new DecoderSuccess(value)
    : [new DecoderError(value, 'must be a string')],
);

export const numberDecoder = new Decoder(value =>
  typeof value === 'number'
    ? new DecoderSuccess(value)
    : [new DecoderError(value, 'must be a number')],
);

export const booleanDecoder = new Decoder(value =>
  typeof value === 'boolean'
    ? new DecoderSuccess(value)
    : [new DecoderError(value, 'must be a boolean')],
);
