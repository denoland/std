// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.

/**
 * This file is meant as a replacement for the original common/index.js
 * 
 * That file has a lot of node functionality not currently supported, so this is a lite
 * version of that file, which most tests should be able to use
 */

const assert = require("assert");
const util = require("util");

function platformTimeout(ms) {
  return ms;
}

let localhostIPv4 = null;

function _expectWarning(name, expected, code) {
  if (typeof expected === 'string') {
    expected = [[expected, code]];
  } else if (!Array.isArray(expected)) {
    expected = Object.entries(expected).map(([a, b]) => [b, a]);
  } else if (!(Array.isArray(expected[0]))) {
    expected = [[expected[0], expected[1]]];
  }
  // Deprecation codes are mandatory, everything else is not.
  if (name === 'DeprecationWarning') {
    expected.forEach(([_, code]) => assert(code, expected));
  }
  return mustCall((warning) => {
    const [ message, code ] = expected.shift();
    assert.strictEqual(warning.name, name);
    if (typeof message === 'string') {
      assert.strictEqual(warning.message, message);
    } else {
      assert.match(warning.message, message);
    }
    assert.strictEqual(warning.code, code);
  }, expected.length);
}

let catchWarning;

// Accepts a warning name and description or array of descriptions or a map of
// warning names to description(s) ensures a warning is generated for each
// name/description pair.
// The expected messages have to be unique per `expectWarning()` call.
function expectWarning(nameOrMap, expected, code) {
  if (catchWarning === undefined) {
    catchWarning = {};
    process.on('warning', (warning) => {
      if (!catchWarning[warning.name]) {
        throw new TypeError(
          `"${warning.name}" was triggered without being expected.\n` +
          util.inspect(warning)
        );
      }
      catchWarning[warning.name](warning);
    });
  }
  if (typeof nameOrMap === 'string') {
    catchWarning[nameOrMap] = _expectWarning(nameOrMap, expected, code);
  } else {
    Object.keys(nameOrMap).forEach((name) => {
      catchWarning[name] = _expectWarning(name, nameOrMap[name]);
    });
  }
}

/**
 * Useful for testing expected internal/error objects
 *
 * @param {Error} error
 */
function expectsError(validator, exact) {
  /**
   * @param {Error} error
   */
  return mustCall((...args) => {
    if (args.length !== 1) {
      // Do not use `assert.strictEqual()` to prevent `inspect` from
      // always being called.
      assert.fail(`Expected one argument, got ${util.inspect(args)}`);
    }
    const error = args.pop();
    const descriptor = Object.getOwnPropertyDescriptor(error, 'message');
    // The error message should be non-enumerable
    assert.strictEqual(descriptor.enumerable, false);

    assert.throws(() => { throw error; }, validator);
    return true;
  }, exact);
}

const noop = () => {};

/**
 * @param {Function} fn 
 * @param {number} exact 
 */
function mustCall(fn, exact) {
  return _mustCallInner(fn, exact, "exact");
}

function mustCallAtLeast(fn, minimum) {
  return _mustCallInner(fn, minimum, 'minimum');
}

function mustSucceed(fn, exact) {
  return mustCall(function(err, ...args) {
    assert.ifError(err);
    if (typeof fn === 'function')
      return fn.apply(this, args);
  }, exact);
}

const mustCallChecks = [];
/**
 * @param {number} exitCode 
 */
function runCallChecks(exitCode) {
  if (exitCode !== 0) return;

  const failed = mustCallChecks.filter(function (context) {
    if ("minimum" in context) {
      context.messageSegment = `at least ${context.minimum}`;
      return context.actual < context.minimum;
    }
    context.messageSegment = `exactly ${context.exact}`;
    return context.actual !== context.exact;
  });

  failed.forEach(function (context) {
    console.log(
      "Mismatched %s function calls. Expected %s, actual %d.",
      context.name,
      context.messageSegment,
      context.actual,
    );
    console.log(context.stack.split("\n").slice(2).join("\n"));
  });

  if (failed.length) process.exit(1);
}

/**
 * @param {Function} fn
 * @param {"exact" | "minimum"} field
 */
function _mustCallInner(fn, criteria = 1, field) {
  // @ts-ignore
  if (process._exiting) {
    throw new Error("Cannot use common.mustCall*() in process exit handler");
  }
  if (typeof fn === "number") {
    criteria = fn;
    fn = noop;
  } else if (fn === undefined) {
    fn = noop;
  }

  if (typeof criteria !== "number") {
    throw new TypeError(`Invalid ${field} value: ${criteria}`);
  }

  let context;
  if (field === "exact") {
    context = {
      exact: criteria,
      actual: 0,
      stack: util.inspect(new Error()),
      name: fn.name || "<anonymous>",
    };
  } else {
    context = {
      minimum: criteria,
      actual: 0,
      stack: util.inspect(new Error()),
      name: fn.name || "<anonymous>",
    };
  }

  // Add the exit listener only once to avoid listener leak warnings
  if (mustCallChecks.length === 0) process.on("exit", runCallChecks);

  mustCallChecks.push(context);

  return function () {
    context.actual++;
    return fn.apply(this, arguments);
  };
}

/**
 * @param {string=} msg
 */
function mustNotCall(msg) {
  /**
   * @param {any[]} args
   */
  return function mustNotCall(...args) {
    const argsInfo = args.length > 0
      ? `\ncalled with arguments: ${args.map(util.inspect).join(", ")}`
      : "";
    assert.fail(
      `${msg || "function should not have been called"} at unknown` +
        argsInfo,
    );
  };
}

// A helper function to simplify checking for ERR_INVALID_ARG_TYPE output.
function invalidArgTypeHelper(input) {
  if (input == null) {
    return ` Received ${input}`;
  }
  if (typeof input === 'function' && input.name) {
    return ` Received function ${input.name}`;
  }
  if (typeof input === 'object') {
    if (input.constructor && input.constructor.name) {
      return ` Received an instance of ${input.constructor.name}`;
    }
    return ` Received ${util.inspect(input, { depth: -1 })}`;
  }
  let inspected = util.inspect(input, { colors: false });
  if (inspected.length > 25)
    inspected = `${inspected.slice(0, 25)}...`;
  return ` Received type ${typeof input} (${inspected})`;
}

const isWindows = process.platform === 'win32';
const isAIX = process.platform === 'aix';
const isSunOS = process.platform === 'sunos';
const isFreeBSD = process.platform === 'freebsd';
const isOpenBSD = process.platform === 'openbsd';
const isLinux = process.platform === 'linux';
const isOSX = process.platform === 'darwin';

module.exports = {
  expectsError,
  expectWarning,
  invalidArgTypeHelper,
  mustCall,
  mustCallAtLeast,
  mustNotCall,
  mustSucceed,
  platformTimeout,
  isWindows,
  isAIX,
  isSunOS,
  isFreeBSD,
  isOpenBSD,
  isLinux,
  isOSX,
  get hasIPv6() {
    const iFaces = require('os').networkInterfaces();
    const re = isWindows ? /Loopback Pseudo-Interface/ : /lo/;
    return Object.keys(iFaces).some((name) => {
      return re.test(name) &&
             iFaces[name].some(({ family }) => family === 'IPv6');
    });
  },

  get localhostIPv4() {
    if (localhostIPv4 !== null) return localhostIPv4;
    if (localhostIPv4 === null) localhostIPv4 = '127.0.0.1';

    return localhostIPv4;
  },

  get PORT() {
    return 12346;
  },
};
