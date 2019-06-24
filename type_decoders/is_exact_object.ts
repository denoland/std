import { Decoder, PromiseDecoder } from './decoder.ts';
import { NestedDecoderErrorMsg } from './util.ts';
import { isChainOf } from './is_chain_of.ts';
import { isCheckedWith } from './is_checked_with.ts';
import { isObject } from './is_object.ts';

export interface IExactObjectDecoderOptions<T> {
  msg?: NestedDecoderErrorMsg;
  keyMap?: { [P in keyof T]?: string | number };
}

export function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IExactObjectDecoderOptions<T>,
): Decoder<T>;
export function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IExactObjectDecoderOptions<T>,
): PromiseDecoder<T>;
export function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options: IExactObjectDecoderOptions<T> = {},
) {
  const getValueKeys = () =>
    Object.keys(decoderObject).map(key => {
      if (options.keyMap && options.keyMap.hasOwnProperty(key)) {
        return options.keyMap[key];
      }

      return key;
    });

  const getExcessKeysErrorMsg = input => {
    const valueKeys = getValueKeys();

    const extraKeys = Object.keys(input).filter(
      key => !valueKeys.includes(key),
    );

    return `invalid keys ${JSON.stringify(extraKeys)}`;
  };

  return isChainOf(
    [
      isCheckedWith(input => typeof input === 'object' && input !== null, {
        msg: 'must be a non-null object',
      }),
      isCheckedWith<object>(
        input => {
          const valueKeys = getValueKeys();

          const extraKeys = Object.keys(input).filter(
            key => !valueKeys.includes(key),
          );

          return extraKeys.length === 0;
        },
        { msg: getExcessKeysErrorMsg },
      ),
      isObject(decoderObject),
    ],
    { msg: options.msg },
  ) as Decoder<T> | PromiseDecoder<T>;
}
