// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/**
 * DecoderSuccess returned on a successful call to
 * `Decoder#decode` or `AsyncDecoder#decode`
 */
export class DecoderSuccess<T> {
  constructor(readonly value: T) {}
}

/**
 * The `DecoderKey` value is present on `DecoderError` and is
 * dependent on the decoder associated with an error.
 *
 * For example, it could be the key of an Object, Array, Map,
 * or Set. When decoding a file, it could be a tuple of the
 * filename, line number, and character number. Etc.
 */
export type DecoderKey =
  | number
  | string
  | object
  | symbol
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | (new (...args: any) => any);

/**
 * DecoderError returned on a failed call to
 * `Decoder#decode` or `AsyncDecoder#decode`
 */
export class DecoderError {
  /** The value that failed validation. */
  input: unknown;

  /** A human readable error message. */
  message: string;

  /** An optional name to describe the decoder which triggered the error. */
  decoderName?: string;

  /**
   * A human readable string showing the nested location of the error.
   * If the validation error is not nested, location will equal a blank string.
   */
  location: string;

  /** The `DecoderError`s which triggered this `DecoderError`, if any */
  child?: DecoderError;

  /**
   * The key associated with this `DecoderError` if any.
   *
   * - example: this could be the index of the array element which
   *   failed validation.
   */
  key?: DecoderKey;

  /** `true` if this error was created with the `allErrors` decoder option. */
  allErrors: boolean;

  constructor(
    input: unknown,
    message: string,
    options: {
      decoderName?: string;
      location?: string;
      child?: DecoderError;
      key?: DecoderKey;
      allErrors?: boolean;
    } = {}
  ) {
    this.input = input;
    this.message = message;
    this.decoderName = options.decoderName;
    this.location = options.location || "";
    this.child = options.child;
    this.key = options.key;
    this.allErrors = options.allErrors || false;
  }

  /**
   * Starting with this error, an array of the keys associated with
   * this error as well as all child errors.
   */
  path(): DecoderKey[] {
    if (this.key === undefined) {
      if (!this.child) return [];

      return this.child.path();
    }

    if (!this.child) return [this.key];

    return [this.key, ...this.child.path()];
  }
}

export type DecoderResult<T> = DecoderSuccess<T> | DecoderError[];

export type DecoderErrorMsgArg =
  | string
  | ((errors: DecoderError[]) => DecoderError[]);

export function areDecoderErrors<T>(
  result: DecoderResult<T>
): result is DecoderError[] {
  return Array.isArray(result);
}

export function isDecoderSuccess<T>(
  result: DecoderResult<T>
): result is DecoderSuccess<T> {
  return result instanceof DecoderSuccess;
}
