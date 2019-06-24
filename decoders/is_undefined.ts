import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './utils.ts';

export interface IUndefinedDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isUndefined(args: IUndefinedDecoderOptions = {}) {
  const msg = args.msg || 'must be undefined';

  return new Decoder<undefined>(value =>
    value === undefined
      ? ok(value)
      : err(value, msg),
  );
}

// isObject({
//   personProfile: isObject({
//     firstName: isString(),
//     firstNamePronunciation: isString(),
//     lastName: isString(),
//     lastNamePronunciation: isString(),
//     personSensitiveProfiles: isChain([
//       isArray(isObject({
//         occupation: isString(),
//       })),
//       isMaxLength(5),
//       isMinLength(5),
//     ])
//   })
// })

// objectDec({
//   personProfile: objectDec({
//     firstName: stringDec(),
//     firstNamePronunciation: stringDec(),
//     lastName: stringDec(),
//     lastNamePronunciation: stringDec(),
//     personSensitiveProfiles: chainDec([
//       arrayDec(objectDec({
//         occupation: stringDec(),
//       })),
//       maxLengthDec(5)
//     ])
//   })
// })


// aObject({
//   personProfile: aObject({
//     firstName: aString(),
//     firstNamePronunciation: aString(),
//     lastName: aString(),
//     lastNamePronunciation: aString(),
//     personSensitiveProfiles: aChain([
//       aArray(aObject({
//         occupation: aString(),
//       })),
//       aMaxLength(5)
//     ])
//   })
// })
