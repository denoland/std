// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** The type of the result of parsing JSON. */
export type JsonValue =
  | { [key: string]: JsonValue | undefined }
  | JsonValue[]
  | string
  | number
  | boolean
  | null;

/**
 * Options for {@linkcode JsonParseStream} and
 * {@linkcode ConcatenatedJsonParseStream}.
 */
export interface ParseStreamOptions {
  /**
   * Controls the buffer of the {@linkcode TransformStream} used internally.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream#writablestrategy}
   *
   * @deprecated (will be removed in 0.214.0)
   */
  readonly writableStrategy?: QueuingStrategy<string>;
  /**
   * Controls the buffer of the {@linkcode TransformStream} used internally.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream#readablestrategy}
   *
   * @deprecated (will be removed in 0.214.0)
   */
  readonly readableStrategy?: QueuingStrategy<JsonValue>;
}
