import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isChainOf } from "./is_chain_of.ts";
import { isCheckedWith } from "./is_checked_with.ts";
import { isObject } from "./is_object.ts";
import { DecoderErrorMsgArg, DecoderError } from "./decoder_result.ts";
import { changeErrorDecoderName } from "./util.ts";

export interface IExactObjectDecoderOptions<T> {
  msg?: DecoderErrorMsgArg;
  keyMap?: { [P in keyof T]?: string | number };
}

export function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IExactObjectDecoderOptions<T>
): Decoder<T>;
export function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IExactObjectDecoderOptions<T>
): PromiseDecoder<T>;
export function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options: IExactObjectDecoderOptions<T> = {}
) {
  // sharing of valueKeys is a small performance optimization.
  // can share valueKeys between isCheckedWith callback and getExcessKeysErrorMsg
  // because those two methods will always be executed synconously, one after the
  // other (if the second is executed at all)
  let valueKeys: any[];

  const getExcessKeysErrorMsg = (error: DecoderError) => {
    const extraKeys = Object.keys(error.value).filter(
      key => !valueKeys.includes(key)
    );

    error.message = `invalid keys ${JSON.stringify(extraKeys)}`;

    return error;
  };

  return isChainOf(
    [
      isCheckedWith(input => typeof input === "object" && input !== null, {
        msg: "must be a non-null object"
      }),
      isCheckedWith<object>(
        input => {
          valueKeys = Object.keys(decoderObject).map(key => {
            if (options.keyMap && options.keyMap.hasOwnProperty(key)) {
              return options.keyMap[key];
            }

            return key;
          });

          const extraKeys = Object.keys(input).filter(
            key => !valueKeys.includes(key)
          );

          return extraKeys.length === 0;
        },
        { msg: getExcessKeysErrorMsg }
      ),
      isObject(decoderObject)
    ],
    { msg: changeErrorDecoderName("isExactObject", options.msg) }
  ) as Decoder<T> | PromiseDecoder<T>;
}
