// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { DecoderError, DecoderSuccess } from "./decoder_result.ts";
import { ComposeDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";

/** Convenience function for building a DecoderSuccess result */
export function ok<T>(value: T): DecoderSuccess<T> {
  return new DecoderSuccess(value);
}

/** Convenience function for building a simple DecoderError[] result */
export function err(
  value: unknown,
  msg: string,
  decoderName: string,
  options?: ComposeDecoderOptions
): DecoderError[] {
  return applyOptionsToDecoderErrors(
    [new DecoderError(value, msg, { decoderName })],
    options
  );
}

/**
 * Builds the `DecoderError#location` property given the child error's
 * location and the current key.
 */
export function errorLocation(
  key: string | number,
  childLocation: string
): string {
  // simple check to see if we can render the key using dot (`.`) notation
  const keyIsValidDotAccessor =
    typeof key === "string" && /^[a-zA-Z]+$/.test(key);

  // prettier-ignore : prettier makes this harder to read
  let location = keyIsValidDotAccessor
    ? key.toString()
    : // if we can't render the key using dot notation, is it a string?
    typeof key === "string"
    ? `["${key}"]`
    : `[${key}]`;

  // check to see if the previous nested child location was rendered using dot
  // notation. A '[' as the first character indicates that it was not.
  // `undefined` as the first character means the child location === ''.
  // If it was, add the dot (`.`) in.
  return ["[", undefined].includes(childLocation[0])
    ? location.concat(childLocation)
    : `${location}.${childLocation}`;
}
