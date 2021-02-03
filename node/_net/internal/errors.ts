const nodeInternalPrefix = '__node_internal_';


// This function removes unnecessary frames from Node.js core errors.
export function hideStackFrames(fn) {
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

// A specialized Error that includes an additional info property with
// additional information about the error condition.
// It has the properties present in a UVException but with a custom error
// message followed by the uv error code and uv error message.
// It also has its own error code with the original uv error context put into
// `err.info`.
// The context passed into this error must have .code, .syscall and .message,
// and may have .path and .dest.
class SystemError extends Error {
  constructor(key, context) {
    const limit = Error.stackTraceLimit;
    Error.stackTraceLimit = 0;
    super();
    // Reset the limit and setting the name property.
    Error.stackTraceLimit = limit;
    const prefix = getMessage(key, [], this);
    let message = `${prefix}: ${context.syscall} returned ` +
      `${context.code} (${context.message})`;

    if (context.path !== undefined)
      message += ` ${context.path}`;
    if (context.dest !== undefined)
      message += ` => ${context.dest}`;

    ObjectDefineProperty(this, 'message', {
      value: message,
      enumerable: false,
      writable: true,
      configurable: true
    });
    addCodeToName(this, 'SystemError', key);

    this.code = key;

    ObjectDefineProperty(this, 'info', {
      value: context,
      enumerable: true,
      configurable: true,
      writable: false
    });

    ObjectDefineProperty(this, 'errno', {
      get() {
        return context.errno;
      },
      set: (value) => {
        context.errno = value;
      },
      enumerable: true,
      configurable: true
    });

    ObjectDefineProperty(this, 'syscall', {
      get() {
        return context.syscall;
      },
      set: (value) => {
        context.syscall = value;
      },
      enumerable: true,
      configurable: true
    });

    if (context.path !== undefined) {
      // TODO(BridgeAR): Investigate why and when the `.toString()` was
      // introduced. The `path` and `dest` properties in the context seem to
      // always be of type string. We should probably just remove the
      // `.toString()` and `Buffer.from()` operations and set the value on the
      // context as the user did.
      ObjectDefineProperty(this, 'path', {
        get() {
          return context.path != null ?
            context.path.toString() : context.path;
        },
        set: (value) => {
          context.path = value ?
            lazyBuffer().from(value.toString()) : undefined;
        },
        enumerable: true,
        configurable: true
      });
    }

    if (context.dest !== undefined) {
      ObjectDefineProperty(this, 'dest', {
        get() {
          return context.dest != null ?
            context.dest.toString() : context.dest;
        },
        set: (value) => {
          context.dest = value ?
            lazyBuffer().from(value.toString()) : undefined;
        },
        enumerable: true,
        configurable: true
      });
    }
  }

  toString() {
    return `${this.name} [${this.code}]: ${this.message}`;
  }

  [SymbolFor('nodejs.util.inspect.custom')](recurseTimes, ctx) {
    return lazyInternalUtilInspect().inspect(this, {
      ...ctx,
      getters: true,
      customInspect: false
    });
  }
}

export const codes  = {}

// Utility function for registering the error codes. Only used here. Exported
// *only* to allow for testing.
function E(sym, val, def, ...otherClasses) {
  // Special case for SystemError that formats the error message differently
  // The SystemErrors only have SystemError as their base classes.
  messages.set(sym, val);
  if (def === SystemError) {
    def = makeSystemErrorWithCode(sym);
  } else {
    def = makeNodeErrorWithCode(def, sym);
  }

  if (otherClasses.length !== 0) {
    otherClasses.forEach((clazz) => {
      def[clazz.name] = makeNodeErrorWithCode(clazz, sym);
    });
  }
  codes[sym] = def;
}

E('ERR_INVALID_ADDRESS_FAMILY', function(addressType, host, port) {
  this.host = host;
  this.port = port;
  return `Invalid address family: ${addressType} ${host}:${port}`;
}, RangeError);

E('ERR_INVALID_ARG_TYPE',
  (name, expected, actual) => {
    assert(typeof name === 'string', "'name' must be a string");
    if (!ArrayIsArray(expected)) {
      expected = [expected];
    }

    let msg = 'The ';
    if (StringPrototypeEndsWith(name, ' argument')) {
      // For cases like 'first argument'
      msg += `${name} `;
    } else {
      const type = StringPrototypeIncludes(name, '.') ? 'property' : 'argument';
      msg += `"${name}" ${type} `;
    }
    msg += 'must be ';

    const types = [];
    const instances = [];
    const other = [];

    for (const value of expected) {
      assert(typeof value === 'string',
        'All expected entries have to be of type string');
      if (ArrayPrototypeIncludes(kTypes, value)) {
        ArrayPrototypePush(types, StringPrototypeToLowerCase(value));
      } else if (RegExpPrototypeTest(classRegExp, value)) {
        ArrayPrototypePush(instances, value);
      } else {
        assert(value !== 'object',
          'The value "object" should be written as "Object"');
        ArrayPrototypePush(other, value);
      }
    }

    // Special handle `object` in case other instances are allowed to outline
    // the differences between each other.
    if (instances.length > 0) {
      const pos = ArrayPrototypeIndexOf(types, 'object');
      if (pos !== -1) {
        ArrayPrototypeSplice(types, pos, 1);
        ArrayPrototypePush(instances, 'Object');
      }
    }

    if (types.length > 0) {
      if (types.length > 2) {
        const last = ArrayPrototypePop(types);
        msg += `one of type ${ArrayPrototypeJoin(types, ', ')}, or ${last}`;
      } else if (types.length === 2) {
        msg += `one of type ${types[0]} or ${types[1]}`;
      } else {
        msg += `of type ${types[0]}`;
      }
      if (instances.length > 0 || other.length > 0)
        msg += ' or ';
    }

    if (instances.length > 0) {
      if (instances.length > 2) {
        const last = ArrayPrototypePop(instances);
        msg +=
          `an instance of ${ArrayPrototypeJoin(instances, ', ')}, or ${last}`;
      } else {
        msg += `an instance of ${instances[0]}`;
        if (instances.length === 2) {
          msg += ` or ${instances[1]}`;
        }
      }
      if (other.length > 0)
        msg += ' or ';
    }

    if (other.length > 0) {
      if (other.length > 2) {
        const last = ArrayPrototypePop(other);
        msg += `one of ${ArrayPrototypeJoin(other, ', ')}, or ${last}`;
      } else if (other.length === 2) {
        msg += `one of ${other[0]} or ${other[1]}`;
      } else {
        if (StringPrototypeToLowerCase(other[0]) !== other[0])
          msg += 'an ';
        msg += `${other[0]}`;
      }
    }

    if (actual == null) {
      msg += `. Received ${actual}`;
    } else if (typeof actual === 'function' && actual.name) {
      msg += `. Received function ${actual.name}`;
    } else if (typeof actual === 'object') {
      if (actual.constructor && actual.constructor.name) {
        msg += `. Received an instance of ${actual.constructor.name}`;
      } else {
        const inspected = lazyInternalUtilInspect()
          .inspect(actual, { depth: -1 });
        msg += `. Received ${inspected}`;
      }
    } else {
      let inspected = lazyInternalUtilInspect()
        .inspect(actual, { colors: false });
      if (inspected.length > 25)
        inspected = `${StringPrototypeSlice(inspected, 0, 25)}...`;
      msg += `. Received type ${typeof actual} (${inspected})`;
    }
    return msg;
  }, TypeError);


E('ERR_INVALID_FD_TYPE', 'Unsupported fd type: %s', TypeError);

E('ERR_INVALID_IP_ADDRESS', 'Invalid IP address: %s', TypeError);

E('ERR_SOCKET_CLOSED', 'Socket is closed', Error);

E('ERR_MISSING_ARGS',
  (...args) => {
    assert(args.length > 0, 'At least one arg needs to be specified');
    let msg = 'The ';
    const len = args.length;
    const wrap = (a) => `"${a}"`;
    args = ArrayPrototypeMap(
      args,
      (a) => (ArrayIsArray(a) ?
        ArrayPrototypeJoin(ArrayPrototypeMap(a, wrap), ' or ') :
        wrap(a))
    );
    switch (len) {
      case 1:
        msg += `${args[0]} argument`;
        break;
      case 2:
        msg += `${args[0]} and ${args[1]} arguments`;
        break;
      default:
        msg += ArrayPrototypeJoin(ArrayPrototypeSlice(args, 0, len - 1), ', ');
        msg += `, and ${args[len - 1]} arguments`;
        break;
    }
    return `${msg} must be specified`;
  }, TypeError);

E('ERR_SOCKET_BAD_PORT', (name, port, allowZero = true) => {
  assert(typeof allowZero === 'boolean',
    "The 'allowZero' argument must be of type boolean.");
  const operator = allowZero ? '>=' : '>';
  return `${name} should be ${operator} 0 and < 65536. Received ${port}.`;
}, RangeError);
