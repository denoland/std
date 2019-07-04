import { DecoderError, DecoderSuccess } from './decoder_result.ts';
import { IComposeDecoderOptions, applyDecoderErrorOptions } from './helpers.ts';

export function err(
  value: unknown,
  msg: string,
  decoderName: string,
  options?: IComposeDecoderOptions,
) {
  return applyDecoderErrorOptions(
    [new DecoderError(value, msg, { decoderName })],
    options,
  );
}

/** Convenience function for building a DecoderSuccess */
export function ok<T>(value: T) {
  return new DecoderSuccess(value);
}

/**
 * builds the `DecoderError#location` property given the child error's
 * location and the current key.
 */
export function buildErrorLocationString(
  key: string | number,
  childLocation: string,
) {
  // simple check to see if we can render the key using dot (`.`) notation
  const keyIsValidDotAccessor =
    typeof key === 'string' && /^[a-zA-Z]+$/.test(key);

  // prettier-ignore : prettier makes this harder to read
  let location = keyIsValidDotAccessor
    ? key.toString()
    : // if we can't render the key using dot notation, is it a string?
    typeof key === 'string'
    ? `["${key}"]`
    : `[${key}]`;

  // check to see if the previous nested child location was rendered using dot
  // notation. A '[' as the first character indicates that it was not.
  // `undefined` as the first character means the child location === ''.
  // If it was, add the dot (`.`) in.
  return ['[', undefined].includes(childLocation[0])
    ? location.concat(childLocation)
    : `${location}.${childLocation}`;
}
