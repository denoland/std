/** Class returned on a successful call to `Decoder#decode` or `PromiseDecoder#decode` */
export class DecoderSuccess<T> {
  constructor(readonly value: T) {}
}

/** Class returned on a failed call to `Decoder#decode` or `PromiseDecoder#decode` */
export class DecoderError extends Error {
  name = "DecoderError";

  /** The value that failed validation. */
  value: unknown;

  /** A human readable error message. */
  message: string;

  /** An optional name to describe the decoder which triggered the error. */
  decoderName?: string;

  /**
   * A human readable string showing the nested location of the error.
   * If the validation error is not nested, location will equal a blank string.
   */
  location: string;

  /** The child `DecoderError` which triggered this `DecoderError`, if any */
  child?: DecoderError;

  /**
   * The key associated with this `DecoderError` if any.
   *
   * - E.g. this might be the object key which failed validation for an `isObject()`
   *   decoder.
   */
  key?: unknown;

  constructor(
    value: unknown,
    message: string,
    options: {
      decoderName?: string;
      location?: string;
      child?: DecoderError;
      key?: unknown;
    } = {}
  ) {
    super(message);
    this.value = value;
    this.decoderName = options.decoderName;
    this.location = options.location || "";
    this.child = options.child;
    this.key = options.key;
  }

  /**
   * Starting with this error, an array of the keys associated with
   * this error as well as all child errors.
   */
  path(): unknown[] {
    if (this.child === undefined && this.key === undefined) return [];
    if (this.key === undefined) return this.child.path();

    return [this.key, ...this.child.path()];
  }
}

export type DecoderResult<T> = DecoderSuccess<T> | DecoderError;

export type DecoderErrorMsgArg =
  | string
  | ((error: DecoderError) => DecoderError);
