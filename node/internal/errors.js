// Copyright Node.js contributors. All rights reserved. MIT License.
import { AbortError, ERR_IPC_CHANNEL_CLOSED } from "../_errors.ts";

function aggregateTwoErrors(innerError, outerError) {
  if (innerError && outerError && innerError !== outerError) {
    if (Array.isArray(outerError.errors)) {
      // If `outerError` is already an `AggregateError`.
      outerError.errors.push(innerError);
      return outerError;
    }
    // eslint-disable-next-line no-restricted-syntax
    const err = new AggregateError(
      [
        outerError,
        innerError,
      ],
      outerError.message,
    );
    err.code = outerError.code;
    return err;
  }
  return innerError || outerError;
}

const codes = {
  ERR_IPC_CHANNEL_CLOSED,
};

export default {
  codes,
  aggregateTwoErrors,
};
export { AbortError, aggregateTwoErrors, codes };
