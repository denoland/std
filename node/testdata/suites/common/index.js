// deno-fmt-ignore-file
// deno-lint-ignore-file

/**
 * This file is meant as a replacement for the original common/index.js
 * 
 * That file has a lot of node functionality not currently supported, so this is a lite
 * version of that file, which most tests should be able to use
 */
const assert = require("assert");
const util = require("util");

/**
 * @param {Error} error
 */
function expectsError({ code, type, message }) {
  /**
   * @param {Error} error
   */
  return function (error) {
    assert.strictEqual(error.code, code);
    assert.strictEqual(error.type, type);
    assert.strictEqual(error.message, message);
  };
}

const noop = () => {};

/**
 * @param {Function} fn 
 * @param {number} exact 
 */
function mustCall(fn, exact) {
  return _mustCallInner(fn, exact, "exact");
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
  //@ts-ignore
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

module.exports = {
  expectsError,
  mustCall,
  mustNotCall,
};
