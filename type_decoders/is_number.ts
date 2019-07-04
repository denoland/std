import { Decoder } from './decoder.ts';
import { ok, err } from './_util.ts';
import { ISimpleDecoderOptions } from './helpers.ts';

export interface INumberDecoderOptions extends ISimpleDecoderOptions {}

export function isNumber(options: INumberDecoderOptions = {}) {
  return new Decoder(value =>
    Number.isFinite(value as any)
      ? ok(value as number)
      : err(value, 'must be a number', 'isNumber', options),
  );
}
