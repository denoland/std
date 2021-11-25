import { ERR_INVALID_ARG_TYPE, hideStackFrames } from "../_errors.ts";
import {
  validateAbortSignal,
  validateCallback,
  validateFunction,
} from "../_validators.ts";

/**
 * @param {unknown} value
 * @param {string} name
 * @param {{
 *   allowArray?: boolean,
 *   allowFunction?: boolean,
 *   nullable?: boolean
 * }} [options]
 */
const validateObject = hideStackFrames((value, name, options) => {
  const useDefaultOptions = options == null;
  const allowArray = useDefaultOptions ? false : options.allowArray;
  const allowFunction = useDefaultOptions ? false : options.allowFunction;
  const nullable = useDefaultOptions ? false : options.nullable;
  if (
    (!nullable && value === null) ||
    (!allowArray && Array.isArray(value)) ||
    (typeof value !== "object" && (
      !allowFunction || typeof value !== "function"
    ))
  ) {
    throw new ERR_INVALID_ARG_TYPE(name, "Object", value);
  }
});

export default {
  validateAbortSignal,
  validateCallback,
  validateFunction,
  validateObject,
};
export {
  validateAbortSignal,
  validateCallback,
  validateFunction,
  validateObject,
};
