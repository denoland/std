const nodeInternalPrefix = '__node_internal_';


// This function removes unnecessary frames from Node.js core errors.
function hideStackFrames(fn) {
  // We rename the functions that will be hidden to cut off the stacktrace
  // at the outermost one
  const hidden = nodeInternalPrefix + fn.name;
  Object.defineProperty(fn, 'name', { value: hidden });
  return fn;
}

let userStackTraceLimit;

const { ErrorCaptureStackTrace } = primordials


const captureLargerStackTrace = hideStackFrames(
  function captureLargerStackTrace(err) {
    userStackTraceLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = Infinity;
    ErrorCaptureStackTrace(err);
    // Reset the limit
    Error.stackTraceLimit = userStackTraceLimit;

    return err;
  });

import util from "../../util.ts"

/**
 * This used to be util._errnoException().
 *
 * @param {number} err - A libuv error number
 * @param {string} syscall
 * @param {string} [original]
 * @returns {Error}
 */
export const errnoException = hideStackFrames(
  function errnoException(err, syscall, original) {
    // TODO(joyeecheung): We have to use the type-checked
    // getSystemErrorName(err) to guard against invalid arguments from users.
    // This can be replaced with [ code ] = errmap.get(err) when this method
    // is no longer exposed to user land.
    const code = util.getSystemErrorName(err);
    const message = original ?
      `${syscall} ${code} ${original}` : `${syscall} ${code}`;

    const tmpLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 0;
    // eslint-disable-next-line no-restricted-syntax
    const ex = new Error(message);
    Error.stackTraceLimit = tmpLimit;
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;

    return captureLargerStackTrace(ex);
  });

/**
 * Deprecated, new function is `uvExceptionWithHostPort()`
 * New function added the error description directly
 * from C++. this method for backwards compatibility
 * @param {number} err - A libuv error number
 * @param {string} syscall
 * @param {string} address
 * @param {number} [port]
 * @param {string} [additional]
 * @returns {Error}
 */
export const exceptionWithHostPort = hideStackFrames(
  function exceptionWithHostPort(err, syscall, address, port, additional) {
    // TODO(joyeecheung): We have to use the type-checked
    // getSystemErrorName(err) to guard against invalid arguments from users.
    // This can be replaced with [ code ] = errmap.get(err) when this method
    // is no longer exposed to user land.
    if (util === undefined) util = require('util');
    const code = util.getSystemErrorName(err);
    let details = '';
    if (port && port > 0) {
      details = ` ${address}:${port}`;
    } else if (address) {
      details = ` ${address}`;
    }
    if (additional) {
      details += ` - Local (${additional})`;
    }

    // Reducing the limit improves the performance significantly. We do not
    // lose the stack frames due to the `captureStackTrace()` function that
    // is called later.
    const tmpLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 0;
    // eslint-disable-next-line no-restricted-syntax
    const ex = new Error(`${syscall} ${code}${details}`);
    Error.stackTraceLimit = tmpLimit;
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;
    ex.address = address;
    if (port) {
      ex.port = port;
    }

    return captureLargerStackTrace(ex);
  });
