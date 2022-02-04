// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

import { ERR_INVALID_ARG_VALUE } from "../errors.ts";

function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null
    ? options.highWaterMark
    : isDuplex
    ? options[duplexKey]
    : null;
}

function getDefaultHighWaterMark(objectMode) {
  return objectMode ? 16 : 16 * 1024;
}

function getHighWaterMark(state, options, duplexKey, isDuplex) {
  const hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
  if (hwm != null) {
    if (!Number.isInteger(hwm) || hwm < 0) {
      const name = isDuplex ? `options.${duplexKey}` : "options.highWaterMark";
      throw new ERR_INVALID_ARG_VALUE(name, hwm);
    }
    return Math.floor(hwm);
  }

  // Default value
  return getDefaultHighWaterMark(state.objectMode);
}

export default {
  getHighWaterMark,
  getDefaultHighWaterMark,
};
export { getDefaultHighWaterMark, getHighWaterMark };
