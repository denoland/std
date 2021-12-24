import { validateFunction, validateString } from "./validators.js";

export function normalizeEncoding(enc) {
  if (enc == null || enc === "utf8" || enc === "utf-8") return "utf8";
  return slowCases(enc);
}

export function slowCases(enc) {
  switch (enc.length) {
    case 4:
      if (enc === "UTF8") return "utf8";
      if (enc === "ucs2" || enc === "UCS2") return "utf16le";
      enc = `${enc}`.toLowerCase();
      if (enc === "utf8") return "utf8";
      if (enc === "ucs2") return "utf16le";
      break;
    case 3:
      if (
        enc === "hex" || enc === "HEX" ||
        `${enc}`.toLowerCase() === "hex"
      ) {
        return "hex";
      }
      break;
    case 5:
      if (enc === "ascii") return "ascii";
      if (enc === "ucs-2") return "utf16le";
      if (enc === "UTF-8") return "utf8";
      if (enc === "ASCII") return "ascii";
      if (enc === "UCS-2") return "utf16le";
      enc = `${enc}`.toLowerCase();
      if (enc === "utf-8") return "utf8";
      if (enc === "ascii") return "ascii";
      if (enc === "ucs-2") return "utf16le";
      break;
    case 6:
      if (enc === "base64") return "base64";
      if (enc === "latin1" || enc === "binary") return "latin1";
      if (enc === "BASE64") return "base64";
      if (enc === "LATIN1" || enc === "BINARY") return "latin1";
      enc = `${enc}`.toLowerCase();
      if (enc === "base64") return "base64";
      if (enc === "latin1" || enc === "binary") return "latin1";
      break;
    case 7:
      if (
        enc === "utf16le" || enc === "UTF16LE" ||
        `${enc}`.toLowerCase() === "utf16le"
      ) {
        return "utf16le";
      }
      break;
    case 8:
      if (
        enc === "utf-16le" || enc === "UTF-16LE" ||
        `${enc}`.toLowerCase() === "utf-16le"
      ) {
        return "utf16le";
      }
      break;
    case 9:
      if (
        enc === "base64url" || enc === "BASE64URL" ||
        `${enc}`.toLowerCase() === "base64url"
      ) {
        return "base64url";
      }
      break;
    default:
      if (enc === "") return "utf8";
  }
}

export function once(callback) {
  let called = false;
  return function (...args) {
    if (called) return;
    called = true;
    Reflect.apply(callback, this, args);
  };
}

export function createDeferredPromise() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// Keep a list of deprecation codes that have been warned on so we only warn on
// each one once.
const codesWarned = new Set();

// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
export function deprecate(fn, msg, code) {
  // TODO(kt3k): Uncomment this
  // if (process.noDeprecation === true) {
  //  return fn;
  // }

  if (code !== undefined) {
    validateString(code, "code");
  }

  let warned = false;
  function deprecated(...args) {
    if (!warned) {
      warned = true;
      if (code !== undefined) {
        if (!codesWarned.has(code)) {
          process.emitWarning(msg, "DeprecationWarning", code, deprecated);
          codesWarned.add(code);
        }
      } else {
        process.emitWarning(msg, "DeprecationWarning", deprecated);
      }
    }
    if (new.target) {
      return Reflect.construct(fn, args, new.target);
    }
    return Reflect.apply(fn, this, args);
  }

  // The wrapper will keep the same prototype as fn to maintain prototype chain
  Object.setPrototypeOf(deprecated, fn);
  if (fn.prototype) {
    // Setting this (rather than using Object.setPrototype, as above) ensures
    // that calling the unwrapped constructor gives an instanceof the wrapped
    // constructor.
    deprecated.prototype = fn.prototype;
  }

  return deprecated;
}

// In addition to being accessible through util.promisify.custom,
// this symbol is registered globally and can be accessed in any environment as
// Symbol.for('nodejs.util.promisify.custom').
const kCustomPromisifiedSymbol = Symbol.for("nodejs.util.promisify.custom");
// This is an internal Node symbol used by functions returning multiple
// arguments, e.g. ['bytesRead', 'buffer'] for fs.read().
const kCustomPromisifyArgsSymbol = Symbol.for(
  "nodejs.util.promisify.customArgs",
);

export const customPromisifyArgs = kCustomPromisifyArgsSymbol;

export function promisify(
  original,
) {
  validateFunction(original, "original");
  if (original[kCustomPromisifiedSymbol]) {
    const fn = original[kCustomPromisifiedSymbol];

    validateFunction(fn, "util.promisify.custom");

    return Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn,
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }

  // Names to create an object from in case the callback receives multiple
  // arguments, e.g. ['bytesRead', 'buffer'] for fs.read.
  const argumentNames = original[kCustomPromisifyArgsSymbol];
  function fn(...args) {
    return new Promise((resolve, reject) => {
      args.push((err, ...values) => {
        if (err) {
          return reject(err);
        }
        if (argumentNames !== undefined && values.length > 1) {
          const obj = {};
          for (let i = 0; i < argumentNames.length; i++) {
            obj[argumentNames[i]] = values[i];
          }
          resolve(obj);
        } else {
          resolve(values[0]);
        }
      });
      Reflect.apply(original, this, args);
    });
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn,
    enumerable: false,
    writable: false,
    configurable: true,
  });
  return Object.defineProperties(
    fn,
    Object.getOwnPropertyDescriptors(original),
  );
}

promisify.custom = kCustomPromisifiedSymbol;

export default {
  createDeferredPromise,
  normalizeEncoding,
  once,
  deprecate,
  promisify,
};
