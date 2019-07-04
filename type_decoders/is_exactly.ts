import { Decoder } from './decoder.ts';
import { ok, err } from './_util.ts';
import { ISimpleDecoderOptions } from './helpers.ts';

export interface IExactlyDecoderOptions extends ISimpleDecoderOptions {}

export function isExactly<T>(exact: T, options: IExactlyDecoderOptions = {}) {
  return new Decoder(value =>
    value === exact
      ? ok(value as T)
      : err(
          value,
          `must be exactly ${exact}`,
          'isExactly',
          options,
        ),
  );
}
