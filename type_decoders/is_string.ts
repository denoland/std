import { Decoder } from './decoder.ts';
import { ok, err } from './_util.ts';
import { SimpleDecoderOptions } from './util.ts';
import { DecoderResult } from './decoder_result.ts';

export type IsStringOptions = SimpleDecoderOptions;

export function isString(options: IsStringOptions = {}): Decoder<string> {
  return new Decoder(
    (value): DecoderResult<string> =>
      typeof value === 'string'
        ? ok(value)
        : err(value, 'must be a string', 'isString', options),
  );
}
