import { DecoderError, DecoderSuccess } from './decoder_result.ts';

export type DecoderErrorMsg<T = unknown> = string | ((value: T) => string);
export type NestedDecoderErrorMsg<T = unknown> =
  | string
  | ((value: T, error?: DecoderError) => string);

export function err<T>(
  value: T,
  msg: DecoderErrorMsg<T> | NestedDecoderErrorMsg<T>,
  options?: {
    child: DecoderError;
    location: string;
    key?: unknown;  
  }
) {
  const error = typeof msg === 'function' ? msg(value, options.child) : msg;

  return new DecoderError(value, error, options);
}

export function ok<T>(value: T) {
  return new DecoderSuccess(value);
}
