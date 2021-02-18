// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// This module implements 'tty' module of Node.JS API.
// ref: https://nodejs.org/api/tty.html

// Returns true when the given numeric fd is associated with a TTY and false otherwise.
function isatty(fd: unknown) {
  if (typeof fd !== "number") {
    return false;
  }
  try {
    return Deno.isatty(fd);
  } catch (_) {
    return false;
  }
}

// TODO(kt3k): Implement tty.ReadStream class
// TODO(kt3k): Implement tty.WriteStream class

export { isatty };
export default { isatty };
