# type_decoders

This module facilitates validating `unknown` (or other) values and casting them to the proper typescript types. It provides an assortment of useful decoder primatives which are usable as-is, easily customized, and composable with other decoders (including any custom decoders you may make).

Users and library authors can create custom decoders which can be composed with the decoders provided in this module, as well as composed with any other third-party decoders which are compatible with this module.

```ts
import { assert, isNumber } from "https://deno.land/std/type_decoders/mod";

// assert() is a convenience function which wraps a decoder
const numberValidator = assert(isNumber());

const value = numberValidator(1); // returns 1
const value = numberValidator("1"); // throws `DecoderError`
```

alternatively

```ts
const decoder = isNumber();

const result = decoder.decode(1); // returns `DecoderSuccess<number>`

const value = result.value; // 1

const result = decoder.decode("1"); // returns (not throws) `DecoderError`
```

# Usage

- [Basic usage](#Basic-usage)
- [Interfaces](#Interfaces)
- [Working with promises](#Working-with-promises)
- [Working with errors](#Working-with-errors)
- [Creating custom decoders](#Creating-custom-decoders)
- [Tips and tricks](#Tips-and-tricks)
- [Decoder API](#Decoder-API)
  - [assert()](#assert)
  - [isBoolean()](#isBoolean)
  - [isString()](#isString)
  - [isNumber()](#isNumber)
  - [isInteger()](#isInteger)
  - [isUndefined()](#isUndefined)
  - [isNull()](#isNull)
  - [isMatch()](#isMatch)
  - [isAny()](#isAny)
  - [isNever()](#isNever)
  - [isExactly()](#isExactly)
  - [isConstant()](#isConstant)
  - [isInstanceOf()](#isInstanceOf)
  - [isMatchForPredicate()](#isMatchForPredicate)
  - [isOptional()](#isOptional)
  - [isNullable()](#isNullable)
  - [isMaybe()](#isMaybe)
  - [isAnyOf()](#isAnyOf)
  - [isChainOf()](#isChainOf)
  - [isObject()](#isObject)
  - [isExactObject()](#isExactObject)
  - [isDictionary()](#isDictionary)
  - [isArray()](#isArray)
  - [isTuple()](#isTuple)
  - [isLazy()](#isLazy)

## Basic usage

This module exports an assortment of primative decoder functions which each return a decoder. For consistancy, all of the exported decoder functions begin with the prefix `is`. For example, the `isNumber()` function returns a `Decoder<number, unknown>` suitable for decoding an `unknown` value to a `number`.

```ts
const myNumberDecoder = isNumber();

const result = myNumberDecoder.decode(1); // returns a DecoderSuccess<number>
const result = myNumberDecoder.decode("1"); // returns (not throws) a DecoderError

if (result instanceof DecoderError) {
  // do stuff...
  return;
}

// result is typed as `DecoderSuccess<number>
// value receives the type `number`
const value = result.value;
```

For your convenience, you can wrap any decoder with the exported `assert` function which will return a valid value directly or throw a `DecoderError`.

```ts
const myNumberDecoder = assert(isNumber());
const value = myNumberDecoder(1); // returns 1
const value = myNumberDecoder("1"); // will throw (not return) a DecoderError
```

Some decoder functions aid with composing decoders. For example, the `isOptional()` decoder accepts another decoder as an argument and returns a decoder that accepts either `undefined` or the value decoded by its argument.

```ts
const myNumberDecoder = isOptional(isNumber());
const result = myNumberDecoder.decode(1); // returns a DecoderSuccess<number | undefined>
const result = myNumberDecoder.decode(undefined); // returns a DecoderSuccess<number | undefined>
```

A more complex example of decoder composition is the `isObject()` decoder function, which receives a `{[key: string]: Decoder<unknown, unknown>}` object argument. This argument is used to process a provided value: it verifies that the provided value is a non-null object, that the object has the specified keys, and that the values of the object's keys pass the provided decoder checks.

```ts
const myObjectDecoder = isObject({
  payload: isObject({
    values: isArray( isNullable( isNumber() ) )
  })
})

const goodInput = { payload: { values: [0, null, 2] } } as unknown;

const success = myObjectDecoder.decode(goodInput); // will return `DecoderSuccess`

// Notice that success.value is properly typed
const value: { payload: string; { values: Array<number | null> } } = success.value;

const badInput = { payload: { values: [0, null, '1'] } } as unknown;

const error = myObjectDecoder.decode(badInput); // will return `DecoderError`

error.message // "invalid key \"payload\" value > invalid key \"values\" value > invalid array element [2] > must be a string"
error.location // "payload.values[2]"
error.value // { payload: { values: [0, null, '1'] } }
error.path() // ["payload", "values", 2]
error.child // nested DecoderError
error.child.message // "invalid key \"values\" value > invalid array element [2] > must be a string"
error.child.location // "values[2]"
error.child.value // { values: [0, null, '1'] }
error.child.child.value // [0, null, '1']
// etc
```

## Interfaces

This module exports two base decoder classes `Decoder<R, V>` and `PromiseDecoder<R, V>`. It also exports a base `DecoderSuccess<T>` class and `DecoderError` class.

### Decoder<R, I>

The first type argument, `R`, contains the successful return type of the decoder. The second type argument, `I`, contains the type of input arguments passed to the decoder. By default, the input type is `unknown`.

```ts
class Decoder<R, I = unknown> {
  new(decodeFn: (value: I) => DecoderResult<R>): Decoder<R, I>;

  /**
   * Decodes a value of type `I` and returns a `DecoderResult<R>`.
   */
  decode(value: I): DecoderResult<R>;
  /**
   * Decodes a value of type `Promise<I>` and returns
   * a `Promise<DecoderResult<R>>`.
   */
  decode(value: Promise<I>): Promise<DecoderResult<R>>;

  /**
   * On decode success, transform a value using a provided transformation function.
   */
  map<K>(fn: (value: R) => K): Decoder<K, I>;
}
```

### PromiseDecoder<R, I>

The first type argument, `R`, contains the successful return type of the decoder. The second type argument, `I`, contains the type of input arguments passed to the decoder. By default, the input type is `unknown`.

```ts
class PromiseDecoder<R, I = unknown> {
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
class DecoderError {
  new(
    value: unknown,
    message: string,
    options?: {
      decoderName?: string;
      location?: string;
      child?: DecoderError;
      key?: unknown;
    }
  ): DecoderError;

  /** default = 'DecoderError' */
  name: string;

  /** The value that failed validation. */
  value: unknown;

  /** A human readable error message. */
  message: string;

  /** An optional name to describe the decoder which triggered the error. */
  decoderName?: string;

  /**
   * A human readable string showing the nested location of the error.
   * If the validation error is not nested, location will equal a blank string.
   */
  location: string;

  /** The child `DecoderError` which triggered this `DecoderError`, if any */
  child?: DecoderError;

  /**
   * The key associated with this `DecoderError` if any.
   *
   * - E.g. this might be the object key which failed validation for an `isObject()`
   *   decoder.
   */
  key?: unknown;

  /**
   * Starting with this error, an array of the keys associated with
   * this error as well as all child errors.
   */
  path(): unknown[];
}
```

### DecoderResult<T>

```ts
type DecoderResult<T> = DecoderSuccess<T> | DecoderError;
```

### DecoderErrorMsgArg

```ts
type DecoderErrorMsgArg = string | ((error: DecoderError) => DecoderError);
```

## Working with promises

Every decoder supports calling its `decode()` method with a promise which returns the value to be decoded. In this scenerio, `decode()` will return a `Promise<DecoderResult<T>>`. Internally, the decoder will wait for the promise to resolve before passing the value to its `decodeFn`. As such, the internal `decodeFn` will never be passed a promise value.

If you wish to create a custom decoder with a `decodeFn` which returns a promise, then you must use the `PromiseDecoder` class (the `Decoder` class does not support being constructed with a `decodeFn` which returns a promise).

`PromiseDecoder` is largely identical to `Decoder`, except its `decode()` method always returns `Promise<DecoderResult<T>>` (not just when called with a promise value) and it's `decodeFn` returns a promise. Additionally, if you pass a `PromiseDecoder` as an argument to any of the decoder constructor functions in this module (i.e. `isObject()`, `isArray()`), that function will return a `PromiseDecoder` instead of a `Decoder`.

Example: you can pass a custom `PromiseDecoder` to `isObject()` as an argument, but this will change the return of `isObject()` from a `Decoder` to a `PromiseDecoder`.

```ts
const myCustomDecoder = new PromiseDecoder(async value =>
  typeof value === "boolean"
    ? Promise.resolve(new DecoderSuccess(value))
    : Promise.resolve(new DecoderError(value, "Must be a boolean"))
);

const myObjectDecoder = isObject({
  payload: isObject({
    values: isArray(isNullable(myCustomDecoder))
  })
});

myObjectDecoder instanceof PromiseDecoder === true;
```

## Working with errors

[_see the `DecoderError` interface_](#DecoderError)

One of the most useful aspects of this module is its support for providing human and machine readable error messages, as well as customizing those messages for your domain.

Where appropriate, the decoder functions exported by this module accept an optional options object with `{ msg?: DecoderErrorMsgArg }` where `type DecoderErrorMsgArg = string | ((error: DecoderError) => DecoderError)`. If you pass a string to this message property, that string will be used as the error message for that decoder. This is option is easy but will potentially suppress more deeply nested error messages.

Example:

```ts
const myObjectDecoder = isObject({
  payload: isObject({
    values: isArray(isNullable(isNumber()), { msg: "invalid array" })
  })
});

const badInput = { payload: { values: [0, null, "1"] } } as unknown;

const error = myObjectDecoder.decode(badInput); // will return `DecoderError`

error.message; // "invalid key \"payload\" > invalid key \"values\" > invalid array
error.child.message; // "invalid key \"values\" > invalid array"
error.child.child.message; // "invalid array"
error.child.child.child.message; // "must be a string"
error.child.child.child.child; // undefined
```

For more control over your error messages, you can provide a `(error: DecoderError) => DecoderError` function as the `msg` argument.

If a DecoderError occurs, the error will be passed to the provided `msg` function where you can either manipulate the error or return a new error.

Example:

```ts
const errorMsgFn = (error: DecoderError) => {
  const { decoderName } = error.child;

  error.message =
    decoderName !== "isArray"
      ? "array must have a length of 2"
      : error.child.child
      ? "must be an array of numbers"
      : "must be an array";

  error.decoderName = "myLatLongDecoder";

  return error;
};

const myLatLongDecoder = isChainOf(
  [isArray(isNumber()), isMatchForPredicate(input => input.length === 2)],
  { msg: errorMsgFn }
);

const badInput0 = {} as unknown;
const badInput1 = [1, "2"] as unknown;
const badInput2 = [1] as unknown;

const error0 = myLatLongDecoder.decode(badInput0);
const error1 = myLatLongDecoder.decode(badInput1);
const error2 = myLatLongDecoder.decode(badInput2);

error0.message; // "must be an array"
error1.message; // "must be an array of numbers"
error2.message; // "array must have a length of 2"
```

In the above example, our `errorMsgFn` made use of the `DecoderError#decoderName` property. DecoderErrors can be constructed with an optional `decoderName` value to easily identify the decoder which created them. All decoder functions exported by this module provide `DecoderError#decoderName` values.

## Creating custom decoders

There are a few ways of creating custom decoders. This simplest way is to simply compose multiple decoders together. For example, the following latitude and longitude decoder is created by composing `isArray(isNumber())` and `isMatchForPredicate()` using `isChainOf()`;

```ts
const myLatLongDecoder = isChainOf([
  isArray(isNumber()),
  isMatchForPredicate(input => input.length === 2)
]);
```

For more flexibility, you can create a new decoder from scratch using either the `Decoder` or `PromiseDecoder` constructors (see the [working with promises](#Working-with-promises) section for a description of the differences between `Decoder` and `PromiseDecoder`). To make a new decoder from scratch, simply pass a custom decode function to the `Decoder` constructor. A decode function is a function which receives a value and returns a `DecodeSuccess` object on success and a `DecodeError` object on failure.

Example:

```ts
const myCustomDecoder = new Decoder(value =>
  typeof value === "boolean"
    ? new DecoderSuccess(value)
    : new DecoderError(value, "must be a boolean")
);

// You can then compose this decoder with others normally

isObject({ likesDeno: myCustomDecoder });

// Or use it directly

myCustomDecoder.decode(true);
```

#### Specifying an input value type

While the vast majority of decoders expect an input value of `unknown`, it is possible to create a decoder which requires an already typed input value. In fact, the `I` type arg in `Decoder<R, I>` is the input variable type (the default is `unknown`). To create a decoder which requires an input value to already be of a known type, simply type the input of the decoder's decode function.

Example:

```ts
const arrayLengthDecoder = new Decoder((value: unknown[]) =>
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

#### Creating custom decoder composition functions

Like this module, you may wish to create custom decoder composition functions (e.g. `isObject()`) to dynamically compose decoders together. It's recommended that, before doing so, you take a look at some of the composition functions contained in this module.

One important thing to consider: if your function takes one or more decoders as an argument, you need to manually handle the possibility of being passed a `PromiseDecoder`. If you receive one ore more `PromiseDecoders` and an argument, your composition function should return a `PromiseDecoder`. Typescript overloads can be used to properly type the different returns.

## Tips and tricks

### The assert() function

It may be the case that you simply want to return the validated value from a decoder directly, rather than a `DecoderResult`. In this case, wrap a decoder with `assert()` to get a callable function which will return a valid value on success, or throw a `DecoderError` on failure.

Example:

```ts
const validator = assert(isNumber());

const value = validator(1); // returns 1

const value = validator("1"); // will throw a `DecoderError`
```

### The decoder map() method

Decoders have a `map` method which can be used to transform valid values. For example, say you are receiving a date param in the form of a string, and you want to convert it to a javascript `Date` object.

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

This decoder will verify that a string is in a `YYYY-MM-DD` format and, if so, convert the string to a date. The return type of the decoder is `Date`.

## Decoder API

### assert()

```ts
export function assert<R, V>(
  decoder: Decoder<R, V>
): { (value: V): R; (value: Promise<V>): Promise<R> };
export function assert<R, V>(
  decoder: PromiseDecoder<R, V>
): (value: V | Promise<V>) => Promise<R>;
```

`assert()` accepts a single decoder as an argument and returns a new function which can be used to decode the same values as provided decoder. On decode success, the validated value is returned directly and on failure the `DecoderError` is thrown (rather than returned).

Example:

```ts
const validator = assert(isNumber());

const value: number = validator(1);

const value: number = validator("1"); // will throw a `DecoderError`
```

### isBoolean()

```ts
interface IBooleanDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isBoolean(options?: IBooleanDecoderOptions): Decoder<boolean, unknown>;
```

`isBoolean()` can be used to verify that an unknown value is a `boolean`.

### isString()

```ts
interface IStringDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isString(options?: IStringDecoderOptions): Decoder<string, unknown>;
```

`isString()` can be used to verify that an unknown value is a `string`.

### isNumber()

```ts
interface INumberDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isNumber(options?: INumberDecoderOptions): Decoder<number, unknown>;
```

`isNumber()` can be used to verify that an unknown value is a `number`.

### isInteger()

```ts
interface IIntegerDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isInteger(options?: IIntegerDecoderOptions): Decoder<number, unknown>;
```

`isInteger()` can be used to verify that an unknown value is a whole `number`.

### isUndefined()

```ts
interface IUndefinedDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isUndefined(
  options?: IUndefinedDecoderOptions
): Decoder<undefined, unknown>;
```

`isUndefined()` can be used to verify that an unknown value is `undefined`. This is a convenience function for `isExactly(undefined)`.

### isNull()

```ts
interface INullDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isNull(options?: INullDecoderOptions): Decoder<null, unknown>;
```

`isNull()` can be used to verify that an unknown value is `null`. This is a convenience function for `isExactly(null)`.

### isMatch()

```ts
interface IRegexDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isMatch(
  regex: RegExp,
  options?: IRegexDecoderOptions
): Decoder<string, unknown>;
```

`isMatch()` can be used to verify that an unknown value is `string` which conforms to the given `RegExp`.

### isAny()

```ts
function isAny<T = unknown>(): Decoder<T, unknown>;
```

`isAny()` creates a decoder which always returns `DecoderSuccess` with whatever input value is provided to it.

### isNever()

```ts
interface INeverDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isNever(options?: INeverDecoderOptions): Decoder<never, unknown>;
```

`isNever()` creates a decoder which always returns `DecoderError` with whatever input value is provided to it. One use case is using it in combination with `isObject` and `isOptional` to assert that an input object doesn't contain a given key.

Example:

```ts
const validator = assert(isObject({a: isString() b: isOptional(isNever()) }));

validator({ a: 'one' }) // returns { a: 'one' }
validator({ a: 'one', b: 'two' }) // throws DecoderError
```

### isExactly()

```ts
interface IExactlyDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isExactly<T>(
  value: T,
  options?: IExactlyDecoderOptions
): Decoder<T, unknown>;
```

`isExactly()` accepts a `value: T` argument and can be used to verify that an unknown input is `=== value`.

### isConstant()

```ts
function isConstant<T>(value: T): Decoder<T, unknown>;
```

`isConstant()` accepts a `value: T` argument and creates a decoder which always returns the `value: T` argument, ignoring its input value.

### isInstanceOf()

```ts
interface IInstanceOfDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isInstanceOf<T extends new (...args: any) => any>(
  clazz: T,
  options?: IInstanceOfDecoderOptions
): Decoder<InstanceType<T>, unknown>;
```

`isInstanceOf()` accepts a javascript constructor argument and creates a decoder which verifies that its input is `instanceof clazz`.

### isMatchForPredicate()

```ts
interface ICheckedWithDecoderOptions {
  msg?: DecoderErrorMsgArg;
  promise?: boolean;
}

function isMatchForPredicate<T>(
  fn: (value: T) => boolean,
  options?: ICheckedWithDecoderOptions
): Decoder<T, T>;
function isMatchForPredicate<T>(
  fn: (value: T) => Promise<boolean>,
  options: ICheckedWithDecoderOptions & { promise: true }
): PromiseDecoder<T, T>;
```

`isMatchForPredicate()` accepts a predicate function argument and creates a decoder which verifies that inputs pass the function check.

**Async**: to pass a predicate function which returns a promise resolving to a boolean, pass the `promise: true` option to `isMatchForPredicate()`.

### isOptional()

```ts
interface IOptionalDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isOptional<T>(
  decoder: Decoder<T>,
  options?: IOptionalDecoderOptions
): Decoder<T | undefined>;
function isOptional<T>(
  decoder: PromiseDecoder<T>,
  options?: IOptionalDecoderOptions
): PromiseDecoder<T | undefined>;
```

`isOptional()` accepts a decoder and returns a new decoder which accepts either the original decoder's value or `undefined`. Convenience function for `isAnyOf([decoder, isUndefined()])`.

### isNullable()

```ts
interface INullableDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isNullable<T>(
  decoder: Decoder<T>,
  options?: INullableDecoderOptions
): Decoder<T | null>;
function isNullable<T>(
  decoder: PromiseDecoder<T>,
  options?: INullableDecoderOptions
): PromiseDecoder<T | null>;
```

`isNullable()` accepts a decoder and returns a new decoder which accepts either the original decoder's value or `null`. Convenience function for `isAnyOf([decoder, isNull()])`.

### isMaybe()

```ts
interface IMaybeDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isMaybe<T>(
  decoder: Decoder<T>,
  options?: IMaybeDecoderOptions
): Decoder<T | null | undefined>;
function isMaybe<T>(
  decoder: PromiseDecoder<T>,
  options?: IMaybeDecoderOptions
): PromiseDecoder<T | null | undefined>;
```

`isMaybe()` accepts a decoder and returns a new decoder which accepts either the original decoder's value or `null` or `undefined`. Convenience function for `isAnyOf([decoder, isNull(), isUndefined()])`.

### isAnyOf()

```ts
interface IAnyOfDecoderOptions {
  msg?: DecoderErrorMsgArg;
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

`isAnyOf()` accepts an array of decoders and attempts to decode a provided value using each of them, in order, returning the first successful result or `DecoderError` if all fail.

### isChainOf()

```ts
interface IChainOfDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturn<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: {
    [I in keyof T]: Decoder<T[I], DecoderInputType<T[SubtractOne<I>]>>
  },
  options?: IChainOfDecoderOptions
): Decoder<R, I>;

function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturn<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: {
    [I in keyof T]:
      | Decoder<T[I], DecoderInputType<T[SubtractOne<I>]>>
      | PromiseDecoder<T[I], DecoderInputType<T[SubtractOne<I>]>>
  },
  options?: IChainOfDecoderOptions
): PromiseDecoder<R, I>;
```

`isChainOf()` accepts an array of decoders and attempts to decode a provided value using all of them, in order. The successful output of one decoder is provided as input to the next decoder. `isChainOf()` returns the `DecoderSuccess` value of the last decoder in the chain or `DecoderError` on the first failure.

### isObject()

```ts
interface IObjectDecoderOptions<T> {
  msg?: DecoderErrorMsgArg;
  keyMap?: { [P in keyof T]?: string | number };
}

function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IObjectDecoderOptions<T>
): Decoder<T>;
function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IObjectDecoderOptions<T>
): PromiseDecoder<T>;
```

`isObject()` accepts a `key: Decoder` argument object and returns a new decoder that will verify that an input is a non-null object, that the input has the keys specified in the argument object, and that the key values pass the relevant decoder provided by the argument object. On `DecoderSuccess`, the a new object is returned and the key-values of that object are provided by output from the argument decoders.

### isExactObject()

```ts
interface IExactObjectDecoderOptions<T> {
  msg?: DecoderErrorMsgArg;
  keyMap?: { [P in keyof T]?: string | number };
}

function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IExactObjectDecoderOptions<T>
): Decoder<T>;
function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IExactObjectDecoderOptions<T>
): PromiseDecoder<T>;
```

`isExactObject()` is the same as `isObject()`, except the input object cannot have any excess properties.

### isDictionary()

```ts
interface IDictionaryDecoderOptions<V> {
  msg?: DecoderErrorMsgArg;
}

function isDictionary<R, V = unknown>(
  decoder: Decoder<R, V>,
  options?: IDictionaryDecoderOptions<V>
): Decoder<{ [key: string]: R }, V>;
function isDictionary<R, V = unknown>(
  decoder: PromiseDecoder<R, V>,
  options?: IDictionaryDecoderOptions<V>
): PromiseDecoder<{ [key: string]: R }, V>;
```

`isDictionary()` receives a decoder argument and uses that decoder to process all values (regardless of key) of an input object.

### isArray()

```ts
interface IArrayDecoderOptions<V> {
  msg?: DecoderErrorMsgArg;
}

function isArray<R = unknown, V = unknown>(
  options?: IArrayDecoderOptions<V>
): Decoder<R[], V>;
function isArray<R, V = unknown>(
  decoder: Decoder<R, V>,
  options?: IArrayDecoderOptions<V>
): Decoder<R[], V>;
function isArray<R, V = unknown>(
  decoder: PromiseDecoder<R, V>,
  options?: IArrayDecoderOptions<V>
): PromiseDecoder<R[], V>;
```

`isArray()` can be used to make sure an input is an array. If an optional decoder argument is provided, that decoder will be used to process all of the input's elements.

### isTuple()

```ts
interface ITupleDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: { [I in keyof Tuple]: Decoder<Tuple[I]> },
  options?: ITupleDecoderOptions
): Decoder<Tuple>;
function isTuple<Tuple extends [unknown, ...unknown[]]>(
  decoders: {
    [I in keyof Tuple]: Decoder<Tuple[I]> | PromiseDecoder<Tuple[I]>
  },
  options?: ITupleDecoderOptions
): PromiseDecoder<Tuple>;
```

`isTuple()` receives an array of decoders and creates a decoder which can be used to verify that an input is:

1. An array of the same length as the decoder argument array.
2. The first decoder argument will be used the process the first element of an input array.
3. The second decoder argument will be used the process the second element of an input array.
4. etc...

### isLazy()

```ts
function isLazy<T>(decoderFn: () => Decoder<T>): Decoder<T | null>;
function isLazy<T>(
  decoderFn: () => PromiseDecoder<T>
): PromiseDecoder<T | null>;
```

`isLazy()` allows for decoding recursive data structures. It accepts a function which returns a decoder.
