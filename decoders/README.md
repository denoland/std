# decoders

This module facilitates decoding an `unknown` input and returning a properly typed response (on success), or returning any errors. It provides an assortment of useful decoder primatives which are usable as-is, easily customized, and composable with other decoders (including any custom decoders you may make).

Users and library authors can create custom decoders which can be composed with the decoders provided in this module, as well as composed with any other third-party decoders which are compatible with this module.

```ts
import { assert, isNumber } from "https://deno.land/std/decoders/mod.ts";

// assert() is a convenience function which wraps a decoder
const numberValidator = assert(isNumber());

const value = numberValidator(1); // returns 1
const value = numberValidator("1"); // throws `DecoderAssertError`
```

alternatively

```ts
const decoder = isNumber();

const result = decoder.decode(1); // returns `DecoderSuccess<number>`

const value = result.value; // 1

const result = decoder.decode("1"); // returns (not throws) `DecoderError[]`
```

# Usage

- [Basic usage](#Basic-usage)
- [Interfaces](#Interfaces)
- [Working with errors](#Working-with-errors)
- [Creating custom decoders](#Creating-custom-decoders)
- [Working with promises](#Working-with-promises)
- [Tips and tricks](#Tips-and-tricks)
- [Decoder API](#Decoder-API)
  - [assert()](#assert)
  - [isBoolean()](#isBoolean)
  - [isString()](#isString)
  - [isNumber()](#isNumber)
  - [isInteger()](#isInteger)
  - [isExactly()](#isExactly)
  - [isAny()](#isAny)
  - [isNever()](#isNever)
  - [isConstant()](#isConstant)
  - [isInstanceOf()](#isInstanceOf)
  - [isMatch()](#isMatch)
  - [isMatchForPredicate()](#isMatchForPredicate)
  - [isOptional()](#isOptional)
  - [isNullable()](#isNullable)
  - [isMaybe()](#isMaybe)
  - [isAnyOf()](#isAnyOf)
  - [isChainOf()](#isChainOf)
  - [isObject()](#isObject)
  - [isDictionary()](#isDictionary)
  - [isArray()](#isArray)
  - [isTuple()](#isTuple)
  - [isLazy()](#isLazy)

## Basic usage

This module exports an assortment of primative decoder functions which each return a decoder. For consistancy, all of the exported decoder functions begin with the prefix `is`. For example, the `isNumber()` function returns a `Decoder<number, any>` suitable for checking if an unknown value is a `number`.

```ts
import {
  isNumber,
  areDecoderErrors
} from "https://deno.land/std/decoders/mod.ts";

const myNumberDecoder = isNumber();

const result = myNumberDecoder.decode(1); // returns a DecoderSuccess<number>
const result = myNumberDecoder.decode("1"); // returns (not throws) a DecoderError

if (areDecoderErrors(result)) {
  // do stuff...
  return;
}

// result is type `DecoderSuccess<number>
// value is type `number`
const value = result.value;
```

For your convenience, you can wrap any decoder with the exported `assert` function which will return a valid value directly or throw a `DecoderAssertError`.

```ts
const myNumberDecoder = assert(isNumber());
const value = myNumberDecoder(1); // returns 1
const value = myNumberDecoder("1"); // will throw (not return) a DecoderAssertError
```

Some decoder functions aid with composing decoders.

```ts
const myNumberDecoder = isOptional(isNumber());
const result = myNumberDecoder.decode(1); // returns a DecoderSuccess<number | undefined>
const result = myNumberDecoder.decode(undefined); // returns a DecoderSuccess<number | undefined>
const result = myNumberDecoder.decode("1"); // returns DecoderError[]
```

A more complex example of decoder composition is the `isObject()` decoder function, which receives a `{[key: string]: Decoder<R>}` object argument. This argument is used to process a provided value: it verifies that the provided value is a non-null object, that the object has the specified keys, and that the values of the object's keys pass the provided decoder checks.

```ts
const myObjectDecoder = isObject({
  payload: isObject({
    values: isArray( isNullable(isNumber()) )
  })
})

const goodInput = { payload: { values: [0, null, 2] } } as unknown;

const success = myObjectDecoder.decode(goodInput); // will return `DecoderSuccess`

// Notice that success.value is properly typed
const value: { payload: string; { values: Array<number | null> } } = success.value;

const badInput = { payload: { values: [0, null, '1'] } } as unknown;

const errors = myObjectDecoder.decode(badInput); // will return `DecoderError[]`
```

## Interfaces

This module exports two base decoder classes `Decoder<R, I>` and `PromiseDecoder<R, I>`. It also exports a base `DecoderSuccess<T>` class and `DecoderError` class.

### Decoder<R, I>

The first type argument, `R`, contains the successful return type of the decoder. The second type argument, `I`, contains the type of the input argument passed to the decoder.

```ts
class Decoder<R, I = any> {
  /** The internal function this decoder uses to decode values */
  readonly decodeFn: (value: I) => DecoderResult<R>;

  new(decodeFn: (value: I) => DecoderResult<R>): Decoder<R, I>;

  /**
   * Decodes a value of type `Promise<I>` and returns
   * a `Promise<DecoderResult<R>>`.
   */
  decode(value: Promise<I>): Promise<DecoderResult<R>>;
  /**
   * Decodes a value of type `I` and returns a `DecoderResult<R>`.
   */
  decode(value: I): DecoderResult<R>;

  /**
   * On decode success, transform a value using a provided transformation function.
   */
  map<K>(fn: (value: R) => K): Decoder<K, I>;
}
```

### PromiseDecoder<R, I>

The first type argument, `R`, contains the successful return type of the decoder. The second type argument, `I`, contains the type of the input argument passed to the decoder.

```ts
class PromiseDecoder<R, I = any> {
  /** The internal function this decoder uses to decode values */
  readonly decodeFn: (input: I) => Promise<DecoderResult<R>>;

  new(decodeFn: (value: I) => Promise<DecoderResult<R>>): PromiseDecoder<R, I>;

  /**
   * Decodes a value (or promise returning a value) of type `I`
   * and returns a `Promise<DecoderResult<R>>`
   */
  decode(value: I | Promise<I>): Promise<DecoderResult<R>>;

  /**
   * On decode success, transform a value using a provided transformation function.
   * Unlike `Decoder#map`, the tranformation function provided to `PromiseDecoder#map`
   * can return a promise.
   */
  map<K>(fn: (value: R) => K | Promise<K>): PromiseDecoder<K, I>;
}
```

### DecoderSuccess<T>

```ts
class DecoderSuccess<T> {
  new(value: T): DecoderSuccess<T>;

  value: T;
}
```

### DecoderError

```ts
/** a `DecoderKey` could be the key of an Object, Array, Map, or Set. */
type DecoderKey =
  | number
  | string
  | object
  | symbol
  | (new (...args: any) => any);

class DecoderError {
  /** The value that failed validation. */
  input: unknown;

  /** A human readable error message. */
  message!: string;

  /** An optional name to describe the decoder which triggered the error. */
  decoderName?: string;

  /**
   * A human readable string showing the nested location of the error.
   * If the validation error is not nested, location will equal a blank string.
   */
  location: string;

  /** The `DecoderError`s which triggered this `DecoderError`, if any */
  child?: DecoderError;

  /**
   * The key associated with this `DecoderError` if any.
   *
   * - example: this could be the index of the array element which
   *   failed validation.
   */
  key?: DecoderKey;

  /** `true` if this error was created with the `allErrors` decoder option. */
  allErrors: boolean;

  new(
    input: unknown,
    message: string,
    options?: {
      decoderName?: string;
      location?: string;
      child?: DecoderError;
      key?: DecoderKey;
      allErrors?: boolean;
    }
  ): DecoderError;

  /**
   * Starting with this error, an array of the keys associated with
   * this error as well as all child errors.
   */
  path(): DecoderKey[];
}
```

### DecoderResult<T>

```ts
type DecoderResult<T> = DecoderSuccess<T> | DecoderError;
```

### DecoderErrorMsgArg

```ts
type DecoderErrorMsgArg = string | ((error: DecoderError[]) => DecoderError[]);
```

## Working with errors

[_see the `DecoderError` interface_](#DecoderError)

The errors API is designed to facilitate custom human and machine readable errors.

### allErrors option

By default, a decoder will immediately return the first error it encounters (`[DecoderError]`). If you pass the `allErrors: true` option when calling a decoder function, then the returned decoder will instead process and return all errors from an input value (`DecoderError[]`).

### decoderName option

`DecoderError` objects have an optional `decoderName?: string` property which can be useful for easily identifying what decoder an error came from. All of the decoder functions in this module add a `decoderName` to their error messages. By passing the `decoderName: string` option when calling a decoder function, you can change the `decoderName` associated with a decoder's errors.

### msg option

[_see the `DecoderErrorMsgArg` type_](#DecoderErrorMsgArg)

If you wish to customize the error message(s) a decoder returns, you can pass the `msg: DecoderErrorMsgArg` option when calling a decoder function.

If you pass a string as the `msg` option, that string will be used as the error message for that decoder.

Example:

```ts
const myObjectDecoder = isObject({
  payload: isObject({
    values: isArray(isNullable(isNumber()), { msg: "very bad array!" })
  })
});

const badInput = { payload: { values: [0, null, "1"] } } as unknown;

const errors = myObjectDecoder.decode(badInput); // will return `DecoderError[]`

errors[0].message; // "invalid value for key \"payload\" > invalid value for key \"values\" > very bad array!"
errors[0].location; // "payload.values"
errors[0].path(); // ["payload", "values"]
errors[0].child.message; // "invalid value for key \"values\" > very bad array!"
errors[0].child.child.message; // "very bad array!"
errors[0].child.child.child.message; // "must be a string"
errors[0].child.child.child.child; // undefined
```

For more control over your error messages, you can provide a `(error: DecoderError[]) => DecoderError[]` function as the `msg` option.

If one or more `DecoderError` occur, the errors will be passed to the provided `msg` function where you can either manipulate the errors or return new errors. Your function must return at least one DecoderError.

Example:

```ts
const errorMsgFn = (errors: DecoderError[]) => {
  errors.forEach(error => {
    const { decoderName } = error.child;

    if (decoderName !== "isArray") {
      error.message = "array must have a length of 2";
    } else if (error.child.child) {
      error.message = "must be an array of numbers";
    } else {
      error.message = "must be an array";
    }
  });

  return errors;
};

const myLatLongDecoder = isChainOf(
  [isArray(isNumber()), isMatchForPredicate(input => input.length === 2)],
  { decoderName: "myLatLongDecoder", msg: errorMsgFn }
);

const badInput = [1] as unknown;

const errors = myLatLongDecoder.decode(badInput);

errors[0].message; // "array must have a length of 2"
```

## Creating custom decoders

There are a two ways of creating custom decoders. This simplest way is to simply compose multiple decoders together. For example, the following latitude and longitude decoder is created by composing `isArray(isNumber())` and `isMatchForPredicate()` using `isChainOf()`;

```ts
const myLatLongDecoder = isChainOf(
  [isArray(isNumber()), isMatchForPredicate(input => input.length === 2)],
  { decoderName: "isLatLon" }
);
```

For more flexibility, you can create a new decoder from scratch using either the `Decoder` or `PromiseDecoder` constructors (see the [working with promises](#Working-with-promises) section for a description of the differences between `Decoder` and `PromiseDecoder`). To make a new decoder from scratch, simply pass a custom decode function to the `Decoder` constructor. A decode function is a function which receives a value and returns a `DecodeSuccess` object on success and an array of `DecodeError` objects on failure.

Example:

```ts
const myCustomDecoder = new Decoder(value =>
  typeof value === "boolean"
    ? new DecoderSuccess(value)
    : [new DecoderError(value, "must be a boolean")]
);

// You can then compose this decoder with others normally

isObject({ likesDeno: myCustomDecoder });

// Or use it directly

myCustomDecoder.decode(true);
```

#### Specifying an input value type

While the vast majority of decoders expect an unknown input value, it is possible to create a decoder which requires an already typed input value. The `I` type arg in `Decoder<R, I>` is the input variable type (the default is `any`). To create a decoder which requires an input value to be of a specific type, simply type the input of the decoder's decodeFn.

Example:

```ts
const arrayLengthDecoder = new Decoder((value: any[]) =>
  value.length < 100
    ? new DecoderSuccess(value)
    : new DecoderError(value, "must have length less than 100")
);

arrayLengthDecoder.decode(1); // type error! decode() expects an array
```

This decoder only works on array values. One use case for a decoder like this is inside the `isChainOf()` decoder, after we have already verified that a value is an array.

Example:

```ts
isChainOf([
  isArray(),
  arrayLengthDecoder // <-- this will only be called when the value is an array
]);
```

#### Creating custom decoder functions

Like this module, you may wish to create custom decoder functions (e.g. `isObject()`) to dynamically compose decoders together or to help create new decoders. It's recommended that, before doing so, you familiarize yourself with the conventions used by this module.

1. If your function allows users to pass options to it, in general those options should all go into an optional options object which is the last argument to the function.
   - An exception to this recommendation would be the [`isDictionary()` function](#isDictionary), which can accept an optional key decoder as the second argument and an options object as the third argument. In this case, typescript overloads are used to keep the API friendly.
2. If appropriate, allow users to customize the returned errors by passing a `msg?: DecoderErrorMsgArg` option.
3. If your decoder may return multiple `DecoderError`, immediately return the first error by default. Allow users to pass an `allErrors: true` option to return all errors.
4. If your function takes one or more decoders as an argument, you need to handle the possibility of being passed a `PromiseDecoder`. If you receive one or more `PromiseDecoders`, your composition function should return a `PromiseDecoder`. Typescript overloads can be used to properly type the different returns.
5. This module exports various [utilities](./util.ts) that can simplify the process of creating custom decoder functions.

## Working with promises

Every decoder supports calling its `decode()` method with a promise which returns the value to be decoded. In this scenerio, `decode()` will return a `Promise<DecoderResult<T>>`. Internally, the decoder will wait for the promise to resolve before passing the value to its `decodeFn`. As such, the internal `decodeFn` will never be passed a promise value.

If you wish to create a custom decoder with a `decodeFn` which returns a promise, then you must use the `PromiseDecoder` class. `PromiseDecoder` is largely identical to `Decoder`, except its `decode()` method always returns `Promise<DecoderResult<T>>` (not just when called with a promise value) and it's `decodeFn` returns a promise. Additionally, when calling a decoder function with a `PromiseDecoder` and `allErrors: true` arguments, many decoder functions will process input values in parallel rather than serially.

As an example, calling `isObject()` with a `PromiseDecoder` and `allErrors: true` will create a decoder which decodes each key in parallel.

```ts
const myCustomDecoder = new PromiseDecoder(async value =>
  typeof value === "boolean"
    ? Promise.resolve(new DecoderSuccess(value))
    : Promise.resolve([new DecoderError(value, "Must be a boolean")])
);

const myObjectDecoder = isObject(
  {
    type: isString(),
    payload: isObject({
      values: isArray(isNullable(myCustomDecoder))
    })
  },
  { allErrors: true }
);

// when you compose Decoders with a PromiseDecoder,
// the result is a PromiseDecoder
myObjectDecoder instanceof PromiseDecoder === true;
```

## Tips and tricks

### The assert() function

It may be the case that you simply want to return the validated value from a decoder directly, rather than a `DecoderResult`. In this case, wrap a decoder with `assert()` to get a callable function which will return a valid value on success, or throw (not return) a `DecoderAssertError` on failure.

Example:

```ts
const validator = assert(isNumber());

const value = validator(1); // returns 1

const value = validator("1"); // will throw a `DecoderAssertError`
```

### The decoder map() method

Decoders have a `map` method which can be used to transform valid input values. For example, say you are receiving a date param in the form of a string, and you want to convert it to a javascript `Date` object. The following decoder will verify that a string is in a `YYYY-MM-DD` format and, if so, convert the string to a date.

```ts
const stringDateDecoder =
  // this regex verifies that a string is of the form `YYYY-MM-DD`
  isMatch(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/).map(
    value => new Date(value)
  );

const result = stringDateDecoder.decode("2000-01-01"); // returns `DecoderSuccess<Date>`

if (result instanceof DecoderSuccess) {
  const value: Date = result.value;
}
```

## Decoder API

### assert()

```ts
class DecoderAssertError extends Error {
  errors: DecoderError[];

  new(errors: DecoderError[]): DecoderAssertError;
}

function assert<R, V>(
  decoder: Decoder<R, V>
): { (value: V): R; (value: Promise<V>): Promise<R> };
function assert<R, V>(
  decoder: PromiseDecoder<R, V>
): (value: V | Promise<V>) => Promise<R>;
```

`assert()` accepts a single decoder as an argument and returns a new function which can be used to decode the same values as the provided decoder. On decode success, the validated value is returned directly and on failure the `DecoderAssertError` is thrown (rather than returned).

Example:

```ts
const validator = assert(isNumber());

const value: number = validator(1);

const value: number = validator("1"); // will throw a `DecoderAssertError`
```

### isBoolean()

```ts
interface IsBooleanOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isBoolean(options?: IsBooleanOptions): Decoder<boolean, any>;
```

`isBoolean()` can be used to verify that an unknown value is a `boolean`.

### isString()

```ts
interface IsStringOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isString(options?: IsStringOptions): Decoder<string, any>;
```

`isString()` can be used to verify that an unknown value is a `string`.

### isNumber()

```ts
interface IsNumberOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isNumber(options?: IsNumberOptions): Decoder<number, any>;
```

`isNumber()` can be used to verify that an unknown value is a `number`.

### isInteger()

```ts
interface IsIntegerOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isInteger(options?: IsIntegerOptions): Decoder<number, any>;
```

`isInteger()` can be used to verify that an unknown value is a whole `number`.

### isExactly()

```ts
interface IsExactlyOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isExactly<T>(value: T, options?: IsExactlyOptions): Decoder<T, any>;
```

`isExactly()` accepts a `value` argument and can be used to verify that an unknown input is `=== value`.

### isAny()

```ts
function isAny<T = any>(): Decoder<T, any>;
```

`isAny()` creates a decoder which always returns `DecoderSuccess` with whatever input value is provided to it.

### isNever()

```ts
interface IsNeverOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isNever(options?: IsNeverOptions): Decoder<never, any>;
```

`isNever()` creates a decoder which always returns `DecoderError` with whatever input value is provided to it.

### isConstant()

```ts
function isConstant<T>(value: T): Decoder<T, any>;
```

`isConstant()` accepts a `value: T` argument and creates a decoder which always returns `DecoderSuccess<T>` with the provided `value` argument, ignoring its input.

### isInstanceOf()

```ts
interface IsInstanceOfOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isInstanceOf<T extends new (...args: any) => any>(
  clazz: T,
  options?: IsInstanceOfOptions
): Decoder<InstanceType<T>, any>;
```

`isInstanceOf()` accepts a javascript constructor argument and creates a decoder which verifies that its input is `instanceof clazz`.

### isMatch()

```ts
interface IRegexDecoderOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isMatch(
  regex: RegExp,
  options?: IRegexDecoderOptions
): Decoder<string, any>;
```

`isMatch()` can be used to verify that an unknown value is a `string` which conforms to the given `RegExp`.

### isMatchForPredicate()

```ts
interface IsCheckedWithOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
  promise?: boolean;
}

function isMatchForPredicate<T>(
  fn: (value: T) => boolean | Promise<boolean>,
  options: IsCheckedWithOptions & { promise: true }
): PromiseDecoder<T, T>;
function isMatchForPredicate<T>(
  fn: (value: T) => boolean,
  options?: IsCheckedWithOptions
): Decoder<T, T>;
```

`isMatchForPredicate()` accepts a predicate function argument and creates a decoder which verifies that inputs pass the function check.

**Async**: to pass a predicate function which returns a promise resolving to a boolean, pass the `promise: true` option to `isMatchForPredicate()`.

### isOptional()

```ts
interface IsOptionalOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isOptional<R, I>(
  decoder: Decoder<R, I>,
  options?: IsOptionalOptions
): Decoder<R | undefined, I>;
function isOptional<R, I>(
  decoder: PromiseDecoder<R, I>,
  options?: IsOptionalOptions
): PromiseDecoder<R | undefined, I>;
```

`isOptional()` accepts a decoder and returns a new decoder which accepts either the original decoder's value or `undefined`.

### isNullable()

```ts
interface IsNullableOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isNullable<R, I>(
  decoder: Decoder<R, I>,
  options?: IsNullableOptions
): Decoder<R | null, I>;
function isNullable<R, I>(
  decoder: PromiseDecoder<R, I>,
  options?: IsNullableOptions
): PromiseDecoder<R | null, I>;
```

`isNullable()` accepts a decoder and returns a new decoder which accepts either the original decoder's value or `null`.

### isMaybe()

```ts
interface IsMaybeOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isMaybe<R, I>(
  decoder: Decoder<R, I>,
  options?: IsMaybeOptions
): Decoder<R | null | undefined, I>;
function isMaybe<R, I>(
  decoder: PromiseDecoder<R, I>,
  options?: IsMaybeOptions
): PromiseDecoder<R | null | undefined, I>;
```

`isMaybe()` accepts a decoder and returns a new decoder which accepts either the original decoder's value or `null` or `undefined`.

### isAnyOf()

```ts
interface IAnyOfDecoderOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
  decodeInParallel?: boolean;
}

function isAnyOf<T extends Decoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions
): Decoder<DecoderReturnType<T>>;
function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions
): PromiseDecoder<DecoderReturnType<T>>;
```

`isAnyOf()` accepts an array of decoders and attempts to decode a provided value using each of them, in order, returning the first successful result or `DecoderError[]` if all fail. Unlike other decoder functions, `isAnyOf()` always returns all errors surfaced by it's decoder arguments. By default, decoder arguments are tried in the order they are given.

**Async:** when calling `isAnyOf()` with one or more `PromiseDecoder` arguments, you can pass a `decodeInParallel: true` option to specify that a provided value should be tried against all decoder arguments in parallel.

### isChainOf()

```ts
interface IsChainOfOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
}

function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>, // default: the return type of the last decoder
  I = DecoderInputType<T[0]>
>(
  decoders: { [P in keyof T]: Decoder<T[P]> },
  options?: IsChainOfOptions
): Decoder<R, I>;
function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>, // default: the return type of the last decoder
  I = DecoderInputType<T[0]>
>(
  decoders: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IsChainOfOptions
): PromiseDecoder<R, I>;
```

`isChainOf()` accepts an array of decoders and attempts to decode a provided value using all of them, in order. The successful output of one decoder is provided as input to the next decoder. `isChainOf()` returns the `DecoderSuccess` value of the last decoder in the chain or `DecoderError` on the first failure.

### isObject()

```ts
interface IsObjectOptions<T> {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
  allErrors?: boolean;
  noExcessProperties?: boolean;
}

function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IsObjectOptions
): Decoder<T>;
function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IsObjectOptions
): PromiseDecoder<T>;
```

_"Object element" refers to a `key: value` pair of the object. "Element-value" refers to the `value` of this pair and "element-key" refers to the `key` of this pair_

`isObject()` accepts a decoderObject argument and returns a new decoder that will verify that an input is a non-null object, and that each element-key of the input is decoded by the corresponding element-key of the `decoderObject`. On `DecoderSuccess`, a new object is returned which has element-values defined by the decoderObject's element-values. By default, any excess properties on the input object are ignored (i.e. not included on the returned value).

Options:

- If you pass the `noExcessProperties: true` option, any excess properties on the input object will return a DecoderError.
- If you pass the `allErrors: true` option as well as any PromiseDecoders as arguments, then `isObject()` will create a new PromiseDecoder which decodes each key of the input object in parallel.

### isDictionary()

```ts
interface IsDictionaryOptions<V> {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
  allErrors?: boolean;
}

function isDictionary<R, V>(
  valueDecoder: Decoder<R, V>,
  options?: IsDictionaryOptions
): Decoder<{ [key: string]: R }, V>;
function isDictionary<R, V>(
  valueDecoder: Decoder<R, V>,
  keyDecoder: Decoder<string, string>,
  options?: IsDictionaryOptions
): Decoder<{ [key: string]: R }, V>;
function isDictionary<R, V>(
  decoder: PromiseDecoder<R, V>,
  options?: IsDictionaryOptions
): PromiseDecoder<{ [key: string]: R }, V>;
function isDictionary<R, V>(
  valueDecoder: Decoder<R, V> | PromiseDecoder<R, V>,
  keyDecoder: Decoder<string, string> | PromiseDecoder<string, string>,
  options?: IsDictionaryOptions
): PromiseDecoder<{ [key: string]: R }, V>;
```

`isDictionary()` receives a decoder argument and uses that decoder to process all values (regardless of key) of an input object. You can pass an optional key decoder as the second argument which will be used to decode each key of an input object.

Options:

- If you pass the `allErrors: true` option as well as any PromiseDecoders as arguments, then `isDictionary()` will create a new PromiseDecoder which decodes each key of the input object in parallel.

### isArray()

```ts
interface IsArrayOptions<V> {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
  allErrors?: boolean;
}

function isArray<R = any>(options?: IsArrayOptions): Decoder<R[]>;
function isArray<R>(
  decoder: Decoder<R>,
  options?: IsArrayOptions
): Decoder<R[]>;
function isArray<R>(
  decoder: PromiseDecoder<R>,
  options?: IsArrayOptions
): PromiseDecoder<R[]>;
```

`isArray()` can be used to make sure an input is an array. If an optional decoder argument is provided, that decoder will be used to process all of the input's elements.

Options:

- If you pass the `allErrors: true` option as well as any PromiseDecoders as arguments, then `isArray()` will create a new PromiseDecoder which decodes each index of the input array in parallel.

### isTuple()

```ts
interface IsTupleOptions {
  decoderName?: string;
  msg?: DecoderErrorMsgArg;
  allErrors?: boolean;
}

function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> },
  options?: IsTupleOptions
): Decoder<R>;
function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> | PromiseDecoder<R[P]> },
  options?: IsTupleOptions
): PromiseDecoder<R>;
```

`isTuple()` receives an array of decoders and creates a decoder which can be used to verify that an input is:

1. An array of the same length as the decoder argument array.
2. The first decoder argument will be used the process the first element of an input array.
3. The second decoder argument will be used the process the second element of an input array.
4. etc...

Options:

- If you pass the `allErrors: true` option as well as any PromiseDecoders as arguments, then `isTuple()` will create a new PromiseDecoder which decodes each index of the input array in parallel.

### isLazy()

```ts
function isLazy<T>(decoderFn: () => Decoder<T>): Decoder<T | null>;
function isLazy<T>(
  decoderFn: () => PromiseDecoder<T>
): PromiseDecoder<T | null>;
```

`isLazy()` recieves a function which returns a decoder and creates a new decoder which calls this function on each `.decode()` call and uses the returned decoder to decode it's input. A common use case for this decoder is to decode recursive data structures.

Example:

```ts
interface ArrayLike {
  [key: number]: ArrayLike;
}

const decoder: Decoder<ArrayLike> = isArray(isLazy(() => decoder));
```
