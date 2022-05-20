// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * This module is browser compatible.
 *
 * @module
 */
import { assert } from "../_util/assert.ts";

/** Combines recursivly all intersaction types and returns a new single type. */
type Id<T> = T extends Record<string, unknown>
  ? T extends infer U ? { [K in keyof U]: Id<U[K]> } : never
  : T;

/** Converts an union type `A | B | C` into an intersection type `A & B & C`. */
type UnionToIntersection<T> =
  (T extends unknown ? (args: T) => unknown : never) extends
    (args: infer R) => unknown ? R extends Record<string, unknown> ? R : never
    : never;

type BooleanType = boolean | string | undefined;
type StringType = string | undefined;
type ArgType = StringType | CollectType;

type CollectType = boolean | string | undefined;

type NoTypes<B, S, C> = undefined extends (
  & (false extends B ? undefined : B)
  & (false extends C ? undefined : C)
  & S
) ? true
  : false;

/**
 * Creates a record with all available flags with the corresponding type and
 * default type.
 */
type Values<
  B extends BooleanType,
  S extends StringType,
  C extends CollectType,
  D extends Record<string, unknown> | undefined,
  A extends Aliases | undefined,
> // deno-lint-ignore no-explicit-any
 = NoTypes<B, S, C> extends true ? Record<string, any>
  : 
    & Record<string, true extends C ? Array<unknown> : unknown>
    & AddAliases<
      SpreadValues<
        & CollectValues<S, string, C>
        & RecursiveRequired<CollectValues<B, boolean, C>>
        & UnknownCollactable<B, S, C>,
        DedotRecord<D>
      >,
      A
    >;

type Aliases<T = string, V extends string = string> = Partial<
  Record<Extract<T, string>, V | Array<V>>
>;

type AddAliases<
  T,
  A extends Aliases | undefined,
> = { [K in keyof T as AliasName<K, A>]: T[K] };

type AliasName<
  K,
  A extends Aliases | undefined,
> = K extends keyof A
  ? string extends A[K] ? K : A[K] extends string ? K | A[K] : K
  : K;

/** Spreads all values of Record `D` into Record `A`. */
type SpreadValues<A, D> = D extends undefined ? A
  : A extends Record<string, unknown> ? 
    & Omit<A, keyof D>
    & {
      [K in keyof D]: K extends keyof A
        ? (A[K] & D[K] | D[K]) extends Record<string, unknown>
          ? NonNullable<SpreadValues<A[K], D[K]>>
        : D[K] | NonNullable<A[K]>
        : unknown;
    }
  : never;

/**
 * Defines the Record for the `default` parse option to add
 * autosuggestion support for IDE's.
 */
type Defaults<B extends BooleanType, S extends StringType> = Id<
  UnionToIntersection<
    & Record<string, unknown>
    & MapTypes<S, unknown>
    & MapTypes<B, unknown>
    & MapDefaults<B>
    & MapDefaults<S>
  >
>;

type RecursiveRequired<T> = T extends Record<string, unknown> ? {
  [K in keyof T]-?: RecursiveRequired<T[K]>;
}
  : T;

type CollectValues<T extends ArgType, V, C extends CollectType> =
  UnionToIntersection<
    C extends true ? MapTypes<T, Array<V>>
      : C extends string ? 
        & MapTypes<Exclude<T, C>, V>
        & (T extends undefined ? Record<never, never> : RecursiveRequired<
          MapTypes<Extract<C, T>, Array<V>>
        >)
      : MapTypes<T, V>
  >;

type MapTypes<T extends ArgType, V> = undefined extends T ? Record<never, never>
  : T extends `no-${infer Name}` ? MapTypes<Name, V | false>
  : T extends `${infer Name}.${infer Rest}` ? {
    [K in Name]?: MapTypes<
      Rest,
      V
    >;
  }
  : T extends string ? Partial<Record<T, V>>
  : Record<never, never>;

type UnknownCollactable<B, S, C> = B & S extends C ? Record<never, never>
  : DedotRecord<
    Record<
      Exclude<
        Extract<C, string>,
        Extract<S | B, string>
      >,
      Array<unknown>
    >
  >;

type MapDefaults<T extends ArgType> = T extends string
  ? Partial<Record<T, unknown>>
  : Record<string, unknown>;

/** Converts `{ "foo.bar.baz": unknown }` into `{ foo: { bar: { baz: unknown } } }`. */
type DedotRecord<T> = Record<string, unknown> extends T ? T
  : T extends Record<string, unknown> ? UnionToIntersection<
    ValueOf<
      { [K in keyof T]: K extends string ? Dedot<K, T[K]> : never }
    >
  >
  : T;

type Dedot<T extends string, V> = T extends `${infer Name}.${infer Rest}`
  ? { [K in Name]: Dedot<Rest, V> }
  : { [K in T]: V };

type ValueOf<T> = T[keyof T];

/** The value returned from `parse`. */
export type Args<
  // deno-lint-ignore no-explicit-any
  A extends Record<string, unknown> = Record<string, any>,
  DD extends boolean | undefined = undefined,
> = Id<
  & A
  & {
    /** Contains all the arguments that didn't have an option associated with
     * them. */
    _: Array<string | number>;
  }
  & (true extends DD ? {
    /** Contains all the arguments that appear after the double dash: "--". */
    "--": Array<string>;
  }
    : // deno-lint-ignore ban-types
    {})
>;

/** The options for the `parse` call. */
export interface ParseOptions<
  B extends BooleanType = undefined,
  S extends StringType = undefined,
  C extends CollectType = undefined,
  D extends Record<string, unknown> | undefined = Record<string, unknown>,
  A extends Aliases<AK, AV> | undefined = undefined,
  DD extends boolean | undefined = undefined,
  AK extends string = string,
  AV extends string = string,
> {
  /** When `true`, populate the result `_` with everything before the `--` and
   * the result `['--']` with everything after the `--`. Here's an example:
   *
   * ```ts
   * // $ deno run example.ts -- a arg1
   * import { parse } from "./mod.ts";
   * console.dir(parse(Deno.args, { "--": false }));
   * // output: { _: [ "a", "arg1" ] }
   * console.dir(parse(Deno.args, { "--": true }));
   * // output: { _: [], --: [ "a", "arg1" ] }
   * ```
   *
   * Defaults to `false`.
   */
  "--"?: DD;

  /** An object mapping string names to strings or arrays of string argument
   * names to use as aliases. */
  alias?: A;

  /** A boolean, string or array of strings to always treat as booleans. If
   * `true` will treat all double hyphenated arguments without equal signs as
   * `boolean` (e.g. affects `--foo`, not `-f` or `--foo=bar`) */
  boolean?: B | Array<Extract<B, string>>;

  /** An object mapping string argument names to default values. */
  default?: D & Defaults<B, S>;

  /** When `true`, populate the result `_` with everything after the first
   * non-option. */
  stopEarly?: boolean;

  /** A string or array of strings argument names to always treat as strings. */
  string?: S | Array<Extract<S, string>>;

  /** A string or array of strings argument names to always treat as strings. */
  collect?: C | Array<Extract<C, string>>;

  /** A function which is invoked with a command line parameter not defined in
   * the `options` configuration object. If the function returns `false`, the
   * unknown option is not added to `parsedArgs`. */
  unknown?: (arg: string, key?: string, value?: unknown) => unknown;
}

interface Flags {
  bools: Record<string, boolean>;
  strings: Record<string, boolean>;
  unknownFn: (arg: string, key?: string, value?: unknown) => unknown;
  allBools: boolean;
}

interface NestedMapping {
  [key: string]: NestedMapping | unknown;
}

const { hasOwn } = Object;

function get<T>(obj: Record<string, T>, key: string): T | undefined {
  if (hasOwn(obj, key)) {
    return obj[key];
  }
}

function getForce<T>(obj: Record<string, T>, key: string): T {
  const v = get(obj, key);
  assert(v != null);
  return v;
}

function isNumber(x: unknown): boolean {
  if (typeof x === "number") return true;
  if (/^0x[0-9a-f]+$/i.test(String(x))) return true;
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
}

function hasKey(obj: NestedMapping, keys: string[]): boolean {
  let o = obj;
  keys.slice(0, -1).forEach((key) => {
    o = (get(o, key) ?? {}) as NestedMapping;
  });

  const key = keys[keys.length - 1];
  return key in o;
}

/** Take a set of command line arguments, optionally with a set of options, and
 * return an object representing the flags found in the passed arguments.
 *
 * By default any arguments starting with `-` or `--` are considered boolean
 * flags. If the argument name is followed by an equal sign (`=`) it is
 * considered a key-value pair. Any arguments which could not be parsed are
 * available in the `_` property of the returned object.
 *
 * ```ts
 * import { parse } from "./mod.ts";
 * const parsedArgs = parse(Deno.args);
 * ```
 *
 * ```ts
 * import { parse } from "./mod.ts";
 * const parsedArgs = parse(["--foo", "--bar=baz", "--no-qux", "./quux.txt"]);
 * // parsedArgs: { foo: true, bar: "baz", qux: false, _: ["./quux.txt"] }
 * ```
 */
export function parse<
  V extends Values<B, S, C, D, A>,
  DD extends boolean | undefined = undefined,
  B extends BooleanType = undefined,
  S extends StringType = undefined,
  C extends CollectType = undefined,
  D extends Record<string, unknown> | undefined = undefined,
  A extends Aliases<AK, AV> | undefined = undefined,
  AK extends string = string,
  AV extends string = string,
>(
  args: string[],
  {
    "--": doubleDash = false,
    alias = {} as NonNullable<A>,
    boolean = false,
    default: defaults = {} as D & Defaults<B, S>,
    stopEarly = false,
    string = [],
    // @TODO(c4spar): Implement collect option. I will open a separate PR for this.
    collect: _collect = [],
    unknown = (i: string): unknown => i,
  }: ParseOptions<B, S, C, D, A, DD, AK, AV> = {},
): Args<V, DD> {
  const flags: Flags = {
    bools: {},
    strings: {},
    unknownFn: unknown,
    allBools: false,
  };

  if (boolean !== undefined) {
    if (typeof boolean === "boolean") {
      flags.allBools = !!boolean;
    } else {
      const booleanArgs = typeof boolean === "string" ? [boolean] : boolean;

      for (const key of booleanArgs.filter(Boolean)) {
        flags.bools[key] = true;
      }
    }
  }

  const aliases: Record<string, string[]> = {};
  if (alias !== undefined) {
    for (const key in alias) {
      const val = getForce(alias, key);
      if (typeof val === "string") {
        aliases[key] = [val];
      } else {
        aliases[key] = val as Array<string>;
      }
      for (const alias of getForce(aliases, key)) {
        aliases[alias] = [key].concat(aliases[key].filter((y) => alias !== y));
      }
    }
  }

  if (string !== undefined) {
    const stringArgs = typeof string === "string" ? [string] : string;

    for (const key of stringArgs.filter(Boolean)) {
      flags.strings[key] = true;
      const alias = get(aliases, key);
      if (alias) {
        for (const al of alias) {
          flags.strings[al] = true;
        }
      }
    }
  }

  const argv: Args = { _: [] };

  function argDefined(key: string, arg: string): boolean {
    return (
      (flags.allBools && /^--[^=]+$/.test(arg)) ||
      get(flags.bools, key) ||
      !!get(flags.strings, key) ||
      !!get(aliases, key)
    );
  }

  function setKey(obj: NestedMapping, keys: string[], value: unknown): void {
    let o = obj;
    keys.slice(0, -1).forEach(function (key): void {
      if (get(o, key) === undefined) {
        o[key] = {};
      }
      o = get(o, key) as NestedMapping;
    });

    const key = keys[keys.length - 1];
    if (
      get(o, key) === undefined ||
      get(flags.bools, key) ||
      typeof get(o, key) === "boolean"
    ) {
      o[key] = value;
    } else if (Array.isArray(get(o, key))) {
      (o[key] as unknown[]).push(value);
    } else {
      o[key] = [get(o, key), value];
    }
  }

  function setArg(
    key: string,
    val: unknown,
    arg: string | undefined = undefined,
  ): void {
    if (arg && flags.unknownFn && !argDefined(key, arg)) {
      if (flags.unknownFn(arg, key, val) === false) return;
    }

    const value = !get(flags.strings, key) && isNumber(val) ? Number(val) : val;
    setKey(argv, key.split("."), value);

    const alias = get(aliases, key);
    if (alias) {
      for (const x of alias) {
        setKey(argv, x.split("."), value);
      }
    }
  }

  function aliasIsBoolean(key: string): boolean {
    return getForce(aliases, key).some(
      (x) => typeof get(flags.bools, x) === "boolean",
    );
  }

  for (const key of Object.keys(flags.bools)) {
    setArg(
      key,
      defaults[key as keyof typeof defaults] === undefined
        ? false
        : defaults[key as keyof typeof defaults],
    );
  }

  let notFlags: string[] = [];

  // all args after "--" are not parsed
  if (args.includes("--")) {
    notFlags = args.slice(args.indexOf("--") + 1);
    args = args.slice(0, args.indexOf("--"));
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (/^--.+=/.test(arg)) {
      const m = arg.match(/^--([^=]+)=(.*)$/s);
      assert(m != null);
      const [, key, value] = m;

      if (flags.bools[key]) {
        const booleanValue = value !== "false";
        setArg(key, booleanValue, arg);
      } else {
        setArg(key, value, arg);
      }
    } else if (/^--no-.+/.test(arg)) {
      const m = arg.match(/^--no-(.+)/);
      assert(m != null);
      setArg(m[1], false, arg);
    } else if (/^--.+/.test(arg)) {
      const m = arg.match(/^--(.+)/);
      assert(m != null);
      const [, key] = m;
      const next = args[i + 1];
      if (
        next !== undefined &&
        !/^-/.test(next) &&
        !get(flags.bools, key) &&
        !flags.allBools &&
        (get(aliases, key) ? !aliasIsBoolean(key) : true)
      ) {
        setArg(key, next, arg);
        i++;
      } else if (/^(true|false)$/.test(next)) {
        setArg(key, next === "true", arg);
        i++;
      } else {
        setArg(key, get(flags.strings, key) ? "" : true, arg);
      }
    } else if (/^-[^-]+/.test(arg)) {
      const letters = arg.slice(1, -1).split("");

      let broken = false;
      for (let j = 0; j < letters.length; j++) {
        const next = arg.slice(j + 2);

        if (next === "-") {
          setArg(letters[j], next, arg);
          continue;
        }

        if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
          setArg(letters[j], next.split(/=(.+)/)[1], arg);
          broken = true;
          break;
        }

        if (
          /[A-Za-z]/.test(letters[j]) &&
          /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)
        ) {
          setArg(letters[j], next, arg);
          broken = true;
          break;
        }

        if (letters[j + 1] && letters[j + 1].match(/\W/)) {
          setArg(letters[j], arg.slice(j + 2), arg);
          broken = true;
          break;
        } else {
          setArg(letters[j], get(flags.strings, letters[j]) ? "" : true, arg);
        }
      }

      const [key] = arg.slice(-1);
      if (!broken && key !== "-") {
        if (
          args[i + 1] &&
          !/^(-|--)[^-]/.test(args[i + 1]) &&
          !get(flags.bools, key) &&
          (get(aliases, key) ? !aliasIsBoolean(key) : true)
        ) {
          setArg(key, args[i + 1], arg);
          i++;
        } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
          setArg(key, args[i + 1] === "true", arg);
          i++;
        } else {
          setArg(key, get(flags.strings, key) ? "" : true, arg);
        }
      }
    } else {
      if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
        argv._.push(flags.strings["_"] ?? !isNumber(arg) ? arg : Number(arg));
      }
      if (stopEarly) {
        argv._.push(...args.slice(i + 1));
        break;
      }
    }
  }

  for (const key of Object.keys(defaults)) {
    if (!hasKey(argv, key.split("."))) {
      setKey(argv, key.split("."), defaults[key as keyof typeof defaults]);

      if (aliases[key]) {
        for (const x of aliases[key]) {
          setKey(argv, x.split("."), defaults[key as keyof typeof defaults]);
        }
      }
    }
  }

  if (doubleDash) {
    argv["--"] = [];
    for (const key of notFlags) {
      argv["--"].push(key);
    }
  } else {
    for (const key of notFlags) {
      argv._.push(key);
    }
  }

  return argv as Args<V, DD>;
}
