// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { Args, parse, ParseOptions } from "./mod.ts";
import { assertType, IsExact } from "../_util/assert_type.ts";

// flag boolean true (default all --args to boolean)
Deno.test("flagBooleanTrue", function (): void {
  const argv = parse(["moo", "--honk", "cow"], {
    boolean: true,
  });

  assertEquals(argv, {
    honk: true,
    _: ["moo", "cow"],
  });

  assertEquals(typeof argv.honk, "boolean");
});

// flag boolean true only affects double hyphen arguments without equals signs
Deno.test("flagBooleanTrueOnlyAffectsDoubleDash", function (): void {
  const argv = parse(["moo", "--honk", "cow", "-p", "55", "--tacos=good"], {
    boolean: true,
  });

  assertEquals(argv, {
    honk: true,
    tacos: "good",
    p: 55,
    _: ["moo", "cow"],
  });

  assertEquals(typeof argv.honk, "boolean");
});

Deno.test("flagBooleanDefaultFalse", function (): void {
  const argv = parse(["moo"], {
    boolean: ["t", "verbose"],
    default: { verbose: false, t: false },
  });

  assertEquals(argv, {
    verbose: false,
    t: false,
    _: ["moo"],
  });

  assertEquals(typeof argv.verbose, "boolean");
  assertEquals(typeof argv.t, "boolean");
});

Deno.test("booleanGroups", function (): void {
  const argv = parse(["-x", "-z", "one", "two", "three"], {
    boolean: ["x", "y", "z"],
  });

  assertEquals(argv, {
    x: true,
    y: false,
    z: true,
    _: ["one", "two", "three"],
  });

  assertEquals(typeof argv.x, "boolean");
  assertEquals(typeof argv.y, "boolean");
  assertEquals(typeof argv.z, "boolean");
});

Deno.test("booleanAndAliasWithChainableApi", function (): void {
  const aliased = ["-h", "derp"];
  const regular = ["--herp", "derp"];
  const aliasedArgv = parse(aliased, {
    boolean: "herp",
    alias: { h: "herp" },
  });
  const propertyArgv = parse(regular, {
    boolean: "herp",
    alias: { h: "herp" },
  });
  const expected = {
    herp: true,
    h: true,
    _: ["derp"],
  };

  assertEquals(aliasedArgv, expected);
  assertEquals(propertyArgv, expected);
});

Deno.test("booleanAndAliasWithOptionsHash", function (): void {
  const aliased = ["-h", "derp"];
  const regular = ["--herp", "derp"];
  const opts = {
    alias: { h: "herp" },
    boolean: "herp",
  };
  const aliasedArgv = parse(aliased, opts);
  const propertyArgv = parse(regular, opts);
  const expected = {
    herp: true,
    h: true,
    _: ["derp"],
  };
  assertEquals(aliasedArgv, expected);
  assertEquals(propertyArgv, expected);
});

Deno.test("booleanAndAliasArrayWithOptionsHash", function (): void {
  const aliased = ["-h", "derp"];
  const regular = ["--herp", "derp"];
  const alt = ["--harp", "derp"];
  const opts = {
    alias: { h: ["herp", "harp"] },
    boolean: "h",
  };
  const aliasedArgv = parse(aliased, opts);
  const propertyArgv = parse(regular, opts);
  const altPropertyArgv = parse(alt, opts);
  const expected = {
    harp: true,
    herp: true,
    h: true,
    _: ["derp"],
  };
  assertEquals(aliasedArgv, expected);
  assertEquals(propertyArgv, expected);
  assertEquals(altPropertyArgv, expected);
});

Deno.test("booleanAndAliasUsingExplicitTrue", function (): void {
  const aliased = ["-h", "true"];
  const regular = ["--herp", "true"];
  const opts = {
    alias: { h: "herp" },
    boolean: "h",
  };
  const aliasedArgv = parse(aliased, opts);
  const propertyArgv = parse(regular, opts);
  const expected = {
    herp: true,
    h: true,
    _: [],
  };

  assertEquals(aliasedArgv, expected);
  assertEquals(propertyArgv, expected);
});

// regression, see https://github.com/substack/node-optimist/issues/71
// boolean and --x=true
Deno.test("booleanAndNonBoolean", function (): void {
  const parsed = parse(["--boool", "--other=true"], {
    boolean: "boool",
  });

  assertEquals(parsed.boool, true);
  assertEquals(parsed.other, "true");

  const parsed2 = parse(["--boool", "--other=false"], {
    boolean: "boool",
  });

  assertEquals(parsed2.boool, true);
  assertEquals(parsed2.other, "false");
});

Deno.test("booleanParsingTrue", function (): void {
  const parsed = parse(["--boool=true"], {
    default: {
      boool: false,
    },
    boolean: ["boool"],
  });

  assertEquals(parsed.boool, true);
});

Deno.test("booleanParsingFalse", function (): void {
  const parsed = parse(["--boool=false"], {
    default: {
      boool: true,
    },
    boolean: ["boool"],
  });

  assertEquals(parsed.boool, false);
});

Deno.test("booleanParsingTrueLike", function (): void {
  const parsed = parse(["-t", "true123"], { boolean: ["t"] });
  assertEquals(parsed.t, true);

  const parsed2 = parse(["-t", "123"], { boolean: ["t"] });
  assertEquals(parsed2.t, true);

  const parsed3 = parse(["-t", "false123"], { boolean: ["t"] });
  assertEquals(parsed3.t, true);
});

Deno.test("booleanNegationAfterBoolean", function (): void {
  const parsed = parse(["--foo", "--no-foo"], { boolean: ["foo"] });
  assertEquals(parsed.foo, false);

  const parsed2 = parse(["--foo", "--no-foo", "123"], { boolean: ["foo"] });
  assertEquals(parsed2.foo, false);
});

Deno.test("booleanAfterBooleanNegation", function (): void {
  const parsed = parse(["--no--foo", "--foo"], { boolean: ["foo"] });
  assertEquals(parsed.foo, true);

  const parsed2 = parse(["--no--foo", "--foo", "123"], { boolean: ["foo"] });
  assertEquals(parsed2.foo, true);
});

Deno.test("latestFlagIsBooleanNegation", function (): void {
  const parsed = parse(["--no-foo", "--foo", "--no-foo"], { boolean: ["foo"] });
  assertEquals(parsed.foo, false);

  const parsed2 = parse(["--no-foo", "--foo", "--no-foo", "123"], {
    boolean: ["foo"],
  });
  assertEquals(parsed2.foo, false);
});

Deno.test("latestFlagIsBoolean", function (): void {
  const parsed = parse(["--foo", "--no-foo", "--foo"], { boolean: ["foo"] });
  assertEquals(parsed.foo, true);

  const parsed2 = parse(["--foo", "--no-foo", "--foo", "123"], {
    boolean: ["foo"],
  });
  assertEquals(parsed2.foo, true);
});

Deno.test("hyphen", function (): void {
  assertEquals(parse(["-n", "-"]), { n: "-", _: [] });
  assertEquals(parse(["-"]), { _: ["-"] });
  assertEquals(parse(["-f-"]), { f: "-", _: [] });
  assertEquals(parse(["-b", "-"], { boolean: "b" }), { b: true, _: ["-"] });
  assertEquals(parse(["-s", "-"], { string: "s" }), { s: "-", _: [] });
});

Deno.test("doubleDash", function (): void {
  assertEquals(parse(["-a", "--", "b"]), { a: true, _: ["b"] });
  assertEquals(parse(["--a", "--", "b"]), { a: true, _: ["b"] });
  assertEquals(parse(["--a", "--", "b"]), { a: true, _: ["b"] });
});

Deno.test("moveArgsAfterDoubleDashIntoOwnArray", function (): void {
  assertEquals(
    parse(["--name", "John", "before", "--", "after"], { "--": true }),
    {
      name: "John",
      _: ["before"],
      "--": ["after"],
    },
  );
});

Deno.test("booleanDefaultTrue", function (): void {
  const argv = parse([], {
    boolean: "sometrue",
    default: { sometrue: true },
  });
  assertEquals(argv.sometrue, true);
});

Deno.test("booleanDefaultFalse", function (): void {
  const argv = parse([], {
    boolean: "somefalse",
    default: { somefalse: false },
  });
  assertEquals(argv.somefalse, false);
});

Deno.test("booleanDefaultNull", function (): void {
  const argv = parse([], {
    boolean: "maybe",
    default: { maybe: null },
  });
  assertEquals(argv.maybe, null);
  const argv2 = parse(["--maybe"], {
    boolean: "maybe",
    default: { maybe: null },
  });
  assertEquals(argv2.maybe, true);
});

Deno.test("dottedAlias", function (): void {
  const argv = parse(["--a.b", "22"], {
    default: { "a.b": 11 },
    alias: { "a.b": "aa.bb" },
  });
  assertEquals(argv.a.b, 22);
  assertEquals(argv.aa.bb, 22);
});

Deno.test("dottedDefault", function (): void {
  const argv = parse([], { default: { "a.b": 11 }, alias: { "a.b": "aa.bb" } });
  assertEquals(argv.a.b, 11);
  assertEquals(argv.aa.bb, 11);
});

Deno.test("dottedDefaultWithNoAlias", function (): void {
  const argv = parse([], { default: { "a.b": 11 } });
  assertEquals(argv.a.b, 11);
});

Deno.test("short", function (): void {
  const argv = parse(["-b=123"]);
  assertEquals(argv, { b: 123, _: [] });
});

Deno.test("multiShort", function (): void {
  const argv = parse(["-a=whatever", "-b=robots"]);
  assertEquals(argv, { a: "whatever", b: "robots", _: [] });
});

Deno.test("longOpts", function (): void {
  assertEquals(parse(["--bool"]), { bool: true, _: [] });
  assertEquals(parse(["--pow", "xixxle"]), { pow: "xixxle", _: [] });
  assertEquals(parse(["--pow=xixxle"]), { pow: "xixxle", _: [] });
  assertEquals(parse(["--host", "localhost", "--port", "555"]), {
    host: "localhost",
    port: 555,
    _: [],
  });
  assertEquals(parse(["--host=localhost", "--port=555"]), {
    host: "localhost",
    port: 555,
    _: [],
  });
});

Deno.test("nums", function (): void {
  const argv = parse([
    "-x",
    "1234",
    "-y",
    "5.67",
    "-z",
    "1e7",
    "-w",
    "10f",
    "--hex",
    "0xdeadbeef",
    "789",
  ]);
  assertEquals(argv, {
    x: 1234,
    y: 5.67,
    z: 1e7,
    w: "10f",
    hex: 0xdeadbeef,
    _: [789],
  });
  assertEquals(typeof argv.x, "number");
  assertEquals(typeof argv.y, "number");
  assertEquals(typeof argv.z, "number");
  assertEquals(typeof argv.w, "string");
  assertEquals(typeof argv.hex, "number");
  assertEquals(typeof argv._[0], "number");
});

Deno.test("alreadyNumber", function (): void {
  const argv = parse(["-x", "1234", "789"]);
  assertEquals(argv, { x: 1234, _: [789] });
  assertEquals(typeof argv.x, "number");
  assertEquals(typeof argv._[0], "number");
});

Deno.test("parseArgs", function (): void {
  assertEquals(parse(["--no-moo"]), { moo: false, _: [] });
  assertEquals(parse(["-v", "a", "-v", "b", "-v", "c"]), {
    v: ["a", "b", "c"],
    _: [],
  });
});

Deno.test("comprehensive", function (): void {
  assertEquals(
    parse([
      "--name=meowmers",
      "bare",
      "-cats",
      "woo",
      "-h",
      "awesome",
      "--multi=quux",
      "--key",
      "value",
      "-b",
      "--bool",
      "--no-meep",
      "--multi=baz",
      "-f=abc=def",
      "--foo=---=\\n--+34-=/=",
      "-e==",
      "--",
      "--not-a-flag",
      "eek",
    ]),
    {
      c: true,
      a: true,
      t: true,
      e: "=",
      f: "abc=def",
      foo: "---=\\n--+34-=/=",
      s: "woo",
      h: "awesome",
      b: true,
      bool: true,
      key: "value",
      multi: ["quux", "baz"],
      meep: false,
      name: "meowmers",
      _: ["bare", "--not-a-flag", "eek"],
    },
  );
});

Deno.test("flagBoolean", function (): void {
  const argv = parse(["-t", "moo"], { boolean: "t" });
  assertEquals(argv, { t: true, _: ["moo"] });
  assertEquals(typeof argv.t, "boolean");
});

Deno.test("flagBooleanValue", function (): void {
  const argv = parse(["--verbose", "false", "moo", "-t", "true"], {
    boolean: ["t", "verbose"],
    default: { verbose: true },
  });

  assertEquals(argv, {
    verbose: false,
    t: true,
    _: ["moo"],
  });

  assertEquals(typeof argv.verbose, "boolean");
  assertEquals(typeof argv.t, "boolean");
});

Deno.test("newlinesInParams", function (): void {
  const args = parse(["-s", "X\nX"]);
  assertEquals(args, { _: [], s: "X\nX" });

  // reproduce in bash:
  // VALUE="new
  // line"
  // deno program.js --s="$VALUE"
  const args2 = parse(["--s=X\nX"]);
  assertEquals(args2, { _: [], s: "X\nX" });
});

Deno.test("strings", function (): void {
  const s = parse(["-s", "0001234"], { string: "s" }).s;
  assertEquals(s, "0001234");
  assertEquals(typeof s, "string");

  const x = parse(["-x", "56"], { string: "x" }).x;
  assertEquals(x, "56");
  assertEquals(typeof x, "string");
});

Deno.test("stringArgs", function (): void {
  const s = parse(["  ", "  "], { string: "_" })._;
  assertEquals(s.length, 2);
  assertEquals(typeof s[0], "string");
  assertEquals(s[0], "  ");
  assertEquals(typeof s[1], "string");
  assertEquals(s[1], "  ");
});

Deno.test("emptyStrings", function (): void {
  const s = parse(["-s"], { string: "s" }).s;
  assertEquals(s, "");
  assertEquals(typeof s, "string");

  const str = parse(["--str"], { string: "str" }).str;
  assertEquals(str, "");
  assertEquals(typeof str, "string");

  const letters = parse(["-art"], {
    string: ["a", "t"],
  });

  assertEquals(letters.a, "");
  assertEquals(letters.r, true);
  assertEquals(letters.t, "");
});

Deno.test("stringAndAlias", function (): void {
  const x = parse(["--str", "000123"], {
    string: "s",
    alias: { s: "str" },
  });

  assertEquals(x.str, "000123");
  assertEquals(typeof x.str, "string");
  assertEquals(x.s, "000123");
  assertEquals(typeof x.s, "string");

  const y = parse(["-s", "000123"], {
    string: "str",
    alias: { str: "s" },
  });

  assertEquals(y.str, "000123");
  assertEquals(typeof y.str, "string");
  assertEquals(y.s, "000123");
  assertEquals(typeof y.s, "string");
});

Deno.test("slashBreak", function (): void {
  assertEquals(parse(["-I/foo/bar/baz"]), { I: "/foo/bar/baz", _: [] });
  assertEquals(parse(["-xyz/foo/bar/baz"]), {
    x: true,
    y: true,
    z: "/foo/bar/baz",
    _: [],
  });
});

Deno.test("alias", function (): void {
  const argv = parse(["-f", "11", "--zoom", "55"], {
    alias: { z: "zoom" },
  });
  assertEquals(argv.zoom, 55);
  assertEquals(argv.z, argv.zoom);
  assertEquals(argv.f, 11);
});

Deno.test("multiAlias", function (): void {
  const argv = parse(["-f", "11", "--zoom", "55"], {
    alias: { z: ["zm", "zoom"] },
  });
  assertEquals(argv.zoom, 55);
  assertEquals(argv.z, argv.zoom);
  assertEquals(argv.z, argv.zm);
  assertEquals(argv.f, 11);
});

Deno.test("nestedDottedObjects", function (): void {
  const argv = parse([
    "--foo.bar",
    "3",
    "--foo.baz",
    "4",
    "--foo.quux.quibble",
    "5",
    "--foo.quux.oO",
    "--beep.boop",
  ]);

  assertEquals(argv.foo, {
    bar: 3,
    baz: 4,
    quux: {
      quibble: 5,
      oO: true,
    },
  });
  assertEquals(argv.beep, { boop: true });
});

Deno.test("flagBuiltinProperty", function (): void {
  const argv = parse(["--toString", "--valueOf", "foo"]);
  assertEquals(argv, { toString: true, valueOf: "foo", _: [] });
  assertEquals(typeof argv.toString, "boolean");
  assertEquals(typeof argv.valueOf, "string");
});

Deno.test("numericShortArgs", function (): void {
  assertEquals(parse(["-n123"]), { n: 123, _: [] });
  assertEquals(parse(["-123", "456"]), { 1: true, 2: true, 3: 456, _: [] });
});

Deno.test("short", function (): void {
  assertEquals(parse(["-b"]), { b: true, _: [] });
  assertEquals(parse(["foo", "bar", "baz"]), { _: ["foo", "bar", "baz"] });
  assertEquals(parse(["-cats"]), { c: true, a: true, t: true, s: true, _: [] });
  assertEquals(parse(["-cats", "meow"]), {
    c: true,
    a: true,
    t: true,
    s: "meow",
    _: [],
  });
  assertEquals(parse(["-h", "localhost"]), { h: "localhost", _: [] });
  assertEquals(parse(["-h", "localhost", "-p", "555"]), {
    h: "localhost",
    p: 555,
    _: [],
  });
});

Deno.test("mixedShortBoolAndCapture", function (): void {
  assertEquals(parse(["-h", "localhost", "-fp", "555", "script.js"]), {
    f: true,
    p: 555,
    h: "localhost",
    _: ["script.js"],
  });
});

Deno.test("shortAndLong", function (): void {
  assertEquals(parse(["-h", "localhost", "-fp", "555", "script.js"]), {
    f: true,
    p: 555,
    h: "localhost",
    _: ["script.js"],
  });
});

// stops parsing on the first non-option when stopEarly is set
Deno.test("stopParsing", function (): void {
  const argv = parse(["--aaa", "bbb", "ccc", "--ddd"], {
    stopEarly: true,
  });

  assertEquals(argv, {
    aaa: "bbb",
    _: ["ccc", "--ddd"],
  });
});

Deno.test("booleanAndAliasIsNotUnknown", function (): void {
  const unknown: unknown[] = [];
  function unknownFn(arg: string, k?: string, v?: unknown): boolean {
    unknown.push({ arg, k, v });
    return false;
  }
  const aliased = ["-h", "true", "--derp", "true"];
  const regular = ["--herp", "true", "-d", "false"];
  const opts = {
    alias: { h: "herp" },
    boolean: "h",
    unknown: unknownFn,
  };
  parse(aliased, opts);
  parse(regular, opts);

  assertEquals(unknown, [
    { arg: "--derp", k: "derp", v: "true" },
    { arg: "-d", k: "d", v: "false" },
  ]);
});

Deno.test(
  "flagBooleanTrueAnyDoubleHyphenArgumentIsNotUnknown",
  function (): void {
    const unknown: unknown[] = [];
    function unknownFn(arg: string, k?: string, v?: unknown): boolean {
      unknown.push({ arg, k, v });
      return false;
    }
    const argv = parse(["--honk", "--tacos=good", "cow", "-p", "55"], {
      boolean: true,
      unknown: unknownFn,
    });
    assertEquals(unknown, [
      { arg: "--tacos=good", k: "tacos", v: "good" },
      { arg: "cow", k: undefined, v: undefined },
      { arg: "-p", k: "p", v: "55" },
    ]);
    assertEquals(argv, {
      honk: true,
      _: [],
    });
  },
);

Deno.test("stringAndAliasIsNotUnknown", function (): void {
  const unknown: unknown[] = [];
  function unknownFn(arg: string, k?: string, v?: unknown): boolean {
    unknown.push({ arg, k, v });
    return false;
  }
  const aliased = ["-h", "hello", "--derp", "goodbye"];
  const regular = ["--herp", "hello", "-d", "moon"];
  const opts = {
    alias: { h: "herp" },
    string: "h",
    unknown: unknownFn,
  };
  parse(aliased, opts);
  parse(regular, opts);

  assertEquals(unknown, [
    { arg: "--derp", k: "derp", v: "goodbye" },
    { arg: "-d", k: "d", v: "moon" },
  ]);
});

Deno.test("defaultAndAliasIsNotUnknown", function (): void {
  const unknown: unknown[] = [];
  function unknownFn(arg: string, k?: string, v?: unknown): boolean {
    unknown.push({ arg, k, v });
    return false;
  }
  const aliased = ["-h", "hello"];
  const regular = ["--herp", "hello"];
  const opts = {
    default: { h: "bar" },
    alias: { h: "herp" },
    unknown: unknownFn,
  };
  parse(aliased, opts);
  parse(regular, opts);

  assertEquals(unknown, []);
});

Deno.test("valueFollowingDoubleHyphenIsNotUnknown", function (): void {
  const unknown: unknown[] = [];
  function unknownFn(arg: string, k?: string, v?: unknown): boolean {
    unknown.push({ arg, k, v });
    return false;
  }
  const aliased = ["--bad", "--", "good", "arg"];
  const opts = {
    "--": true,
    unknown: unknownFn,
  };
  const argv = parse(aliased, opts);

  assertEquals(unknown, [{ arg: "--bad", k: "bad", v: true }]);
  assertEquals(argv, {
    "--": ["good", "arg"],
    _: [],
  });
});

Deno.test("whitespaceShouldBeWhitespace", function (): void {
  assertEquals(parse(["-x", "\t"]).x, "\t");
});

/** ---------------------- TYPE TESTS ---------------------- */

Deno.test("typesOfDefaultOptions", function (): void {
  const argv = parse([]);
  assertType<
    IsExact<
      typeof argv,
      // deno-lint-ignore no-explicit-any
      & { [x: string]: any }
      & {
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfAllBooleanDisabled", function (): void {
  const argv = parse([], {
    boolean: false,
  });
  assertType<
    IsExact<
      typeof argv,
      // deno-lint-ignore no-explicit-any
      & { [x: string]: any }
      & {
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfAllBooleanDisabledWithDefaults", function (): void {
  const argv = parse([], {
    boolean: false,
    default: {
      bar: 123,
    },
  });
  assertType<
    IsExact<
      typeof argv,
      // deno-lint-ignore no-explicit-any
      & { [x: string]: any }
      & {
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfAllBooleanDisabledAndStringArgs", function (): void {
  const argv = parse([], {
    boolean: false,
    string: ["foo"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo?: string | undefined;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfAllBooleanDisabledAndStringArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: false,
    string: ["foo"],
    default: {
      foo: 123,
      bar: false,
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: string | number;
        bar: unknown;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfAllBoolean", function (): void {
  const argv = parse([], {
    boolean: true,
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfAllBooleanWithDefaults", function (): void {
  const argv = parse([], {
    boolean: true,
    default: {
      foo: "123",
      bar: 123,
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: unknown;
        bar: unknown;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfAllBooleanAndStringArgs", function (): void {
  const argv = parse([], {
    boolean: true,
    string: ["foo", "bar", "foo-bar"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo?: string | undefined;
        bar?: string | undefined;
        "foo-bar"?: string | undefined;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfAllBooleanAndStringArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: true,
    string: ["foo", "bar", "foo-bar"],
    default: {
      bar: 123,
      baz: new Date(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo?: string | undefined;
        bar: string | number;
        baz: unknown;
        "foo-bar"?: string | undefined;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfBooleanArgs", function (): void {
  const argv = parse([], {
    boolean: ["foo", "bar", "foo-bar"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: boolean;
        bar: boolean;
        "foo-bar": boolean;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfBooleanArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: ["foo", "bar", "foo-bar"],
    default: {
      bar: 123,
      baz: "123",
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: boolean;
        bar: number | boolean;
        baz: unknown;
        "foo-bar": boolean;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfStringArgs", function (): void {
  const argv = parse([], {
    string: ["foo", "bar", "foo-bar"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo?: string | undefined;
        bar?: string | undefined;
        "foo-bar"?: string | undefined;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfStringArgsWithDefaults", function (): void {
  const argv = parse([], {
    string: ["foo", "bar", "foo-bar"],
    default: {
      bar: true,
      baz: 123,
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo?: string | undefined;
        bar: string | boolean;
        baz: unknown;
        "foo-bar"?: string | undefined;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfBooleanAndStringArgs", function (): void {
  const argv = parse([], {
    boolean: ["foo", "bar", "foo-bar"],
    string: ["beep", "boop", "beep-boop"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        beep?: string | undefined;
        boop?: string | undefined;
        "beep-boop"?: string | undefined;
        foo: boolean;
        bar: boolean;
        "foo-bar": boolean;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfBooleanAndStringArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: ["foo", "bar", "foo-bar"],
    string: ["beep", "boop", "beep-boop"],
    default: {
      bar: 123,
      baz: new Error(),
      beep: new Date(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: boolean;
        boop?: string | undefined;
        "beep-boop"?: string | undefined;
        bar: number | boolean;
        baz: unknown;
        beep: string | Date;
        "foo-bar": boolean;
        _: Array<string | number>;
      }
    >
  >(true);
});

/** ------------------------ DOTTED OPTIONS ------------------------ */

Deno.test("typesOfDottedBooleanArgs", function (): void {
  const argv = parse([], {
    boolean: ["blubb", "foo.bar", "foo.baz.biz", "foo.baz.buz"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        blubb: boolean;
        foo: {
          bar: boolean;
          baz: {
            biz: boolean;
            buz: boolean;
          };
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfDottedBooleanArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: ["blubb", "foo.bar", "foo.baz.biz", "foo.baz.buz"],
    default: {
      blubb: "123",
      foo: {
        bar: 123,
        baz: {
          biz: new Date(),
        },
      },
      bla: new Date(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        blubb: boolean | string;
        foo: {
          bar: boolean | number;
          baz: {
            biz: boolean | Date;
            buz: boolean;
          };
        };
        bla: unknown;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfDottedStringArgs", function (): void {
  const argv = parse([], {
    string: ["blubb", "foo.bar", "foo.baz.biz", "foo.baz.buz"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        blubb?: string | undefined;
        foo?: {
          bar?: string | undefined;
          baz?: {
            biz?: string | undefined;
            buz?: string | undefined;
          };
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfDottedStringArgsWithDefaults", function (): void {
  const argv = parse([], {
    string: ["blubb", "foo.bar", "foo.baz.biz", "foo.baz.buz"],
    default: {
      blubb: true,
      foo: {
        bar: 123,
        baz: {
          biz: new Date(),
        },
      },
      bla: new Date(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        blubb: string | boolean;
        foo: {
          bar: string | number;
          baz: {
            biz: string | Date;
            buz?: string | undefined;
          };
        };
        bla: unknown;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfDottedStringAndBooleanArgs", function (): void {
  const argv = parse([], {
    boolean: ["blubb", "foo.bar", "foo.baz.biz", "beep.bib.bub"],
    string: ["bla", "beep.boop", "beep.bib.bab", "foo.baz.buz"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        blubb: boolean;
        foo: {
          bar: boolean;
          baz: {
            biz: boolean;
            buz?: string | undefined;
          };
        };
        bla?: string | undefined;
        beep: {
          boop?: string | undefined;
          bib: {
            bab?: string | undefined;
            bub: boolean;
          };
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfDottedStringAndBooleanArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: ["blubb", "foo.bar", "foo.baz.biz", "beep.bib.bub"],
    string: ["beep.boop", "beep.bib.bab", "foo.baz.buz"],
    default: {
      blubb: true,
      foo: {
        bar: 123,
        baz: {
          biz: new Date(),
        },
      },
      beep: {
        boop: true,
        bib: {
          bab: new Date(),
        },
      },
      bla: new Date(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        bla: unknown;
        blubb: boolean;
        foo: {
          bar: boolean | number;
          baz: {
            biz: boolean | Date;
            buz?: string | undefined;
          };
        };
        beep: {
          boop: string | boolean;
          bib: {
            bab: string | Date;
            bub: boolean;
          };
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfDottedStringAndBooleanArgsWithFlattedDefaults", function (): void {
  const argv = parse([], {
    boolean: ["blubb", "foo.bar", "foo.baz.biz", "beep.bib.bub"],
    string: ["beep.boop", "beep.bib.bab", "foo.baz.buz"],
    default: {
      bla: new Date(),
      blubb: true,
      "foo.bar": 123,
      "foo.baz.biz": new Date(),
      "beep.boop": true,
      "beep.bib.bab": new Date(),
      "mee.moo": true,
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        bla: unknown;
        blubb: boolean;
        mee: unknown;
        foo: {
          bar: boolean | number;
          baz: {
            biz: boolean | Date;
            buz?: string | undefined;
          };
        };
        beep: {
          boop: string | boolean;
          bib: {
            bab: string | Date;
            bub: boolean;
          };
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfDottedArgsWithUnionDefaults", function (): void {
  const argv = parse([], {
    string: ["foo.bar.baz"],
    boolean: ["beep.boop.bab"],
    default: {
      "foo": 1,
      "beep": new Date(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: number | {
          bar?: {
            baz?: string | undefined;
          } | undefined;
        };
        beep: Date | {
          boop: {
            bab: boolean;
          };
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfDottedArgsWithNestedUnionDefaults", function (): void {
  const argv = parse([], {
    string: ["foo.bar.baz"],
    boolean: ["beep.boop.bab"],
    default: {
      "foo.bar": 1,
      "beep.boop": new Date(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: {
          bar: number | {
            baz?: string | undefined;
          };
        };
        beep: {
          boop: Date | {
            bab: boolean;
          };
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfArgsWithDottedDefaults", function (): void {
  const argv = parse([], {
    string: ["foo"],
    default: {
      "foo.bar": 1,
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: string | {
          bar: number;
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

/** ------------------------ COLLECT OPTION -------------------------- */

Deno.test("typesOfCollectUnknownArgs", function (): void {
  const argv = parse([], {
    collect: ["foo", "bar.baz"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: Array<unknown>;
        bar: {
          baz: Array<unknown>;
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfCollectAllArgs", function (): void {
  const argv = parse([], {
    boolean: ["foo", "dotted.beep"],
    string: ["bar", "dotted.boop"],
    collect: true,
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: Array<unknown> }
      & {
        bar?: Array<string> | undefined;
        dotted: {
          boop?: Array<string> | undefined;
          beep: Array<boolean>;
        };
        foo: Array<boolean>;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfCollectAllArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: ["foo", "dotted.beep"],
    string: ["bar", "dotted.boop"],
    collect: true,
    default: {
      bar: 123,
      dotted: {
        beep: new Date(),
        boop: /.*/,
      },
      foo: new TextDecoder(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: Array<unknown> }
      & {
        bar: number | Array<string>;
        foo: TextDecoder | Array<boolean>;
        dotted: {
          beep: Array<boolean> | Date;
          boop: RegExp | Array<string>;
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfCollectArgs", function (): void {
  const argv = parse([], {
    boolean: ["foo", "dotted.beep"],
    string: ["bar", "dotted.boop"],
    collect: ["foo", "dotted.boop"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        bar?: string | undefined;
        dotted: {
          boop: Array<string>;
          beep: boolean;
        };
        foo: Array<boolean>;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfCollectArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: ["foo", "dotted.beep"],
    string: ["bar", "dotted.boop"],
    collect: ["foo", "dotted.boop"],
    default: {
      bar: 123,
      dotted: {
        beep: new Date(),
        boop: /.*/,
      },
      foo: new TextDecoder(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        bar: number | string;
        foo: TextDecoder | Array<boolean>;
        dotted: {
          beep: boolean | Date;
          boop: RegExp | Array<string>;
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

/** -------------------------- NEGATABLE OPTIONS --------------------------- */

Deno.test("typesOfNegatableArgs", function (): void {
  const argv = parse([], {
    boolean: ["foo", "no-bar", "no-dotted.tick", "dotted.tock"],
    string: ["beep", "no-boop", "no-dotted.zig", "dotted.zag"],
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        beep?: string | undefined;
        boop?: string | false | undefined;
        dotted: {
          zig?: string | false | undefined;
          zag?: string | undefined;
          tick: boolean;
          tock: boolean;
        };
        foo: boolean;
        bar: boolean;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfCollectAllArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: ["foo", "no-bar", "no-dotted.tick", "dotted.tock"],
    string: ["beep", "no-boop", "no-dotted.zig", "dotted.zag"],
    default: {
      bar: 123,
      boop: new TextDecoder(),
      dotted: {
        tick: new Date(),
        zig: /.*/,
      },
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo: boolean;
        beep?: string | undefined;
        bar: number | boolean;
        boop: string | false | TextDecoder;
        dotted: {
          zag?: string | undefined;
          tock: boolean;
          tick: boolean | Date;
          zig: string | false | RegExp;
        };
        _: Array<string | number>;
      }
    >
  >(true);
});

/** ----------------------------- ALIAS OPTION ----------------------------- */

Deno.test("typesOfAliasArgs", function (): void {
  const argv = parse([], {
    boolean: ["foo"],
    string: ["beep"],
    alias: {
      foo: "bar",
      beep: "boop",
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        beep?: string | undefined;
        boop?: string | undefined;
        foo: boolean;
        bar: boolean;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfAliasArgsWithDefaults", function (): void {
  const argv = parse([], {
    boolean: ["foo", "biz"],
    string: ["beep", "bib"],
    alias: {
      foo: "bar",
      beep: "boop",
      biz: "baz",
    },
    default: {
      foo: 1,
      beep: new Date(),
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        baz: boolean;
        biz: boolean;
        bib?: string | undefined;
        foo: number | boolean;
        bar: number | boolean;
        beep: string | Date;
        boop: string | Date;
        _: Array<string | number>;
      }
    >
  >(true);
});

/** ----------------------- OTHER TYPE TESTS ------------------------ */

Deno.test("typesOfDoubleDashOption", function (): void {
  const argv = parse([], {
    boolean: true,
    string: ["foo"],
    "--": true,
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo?: string | undefined;
        _: Array<string | number>;
        "--": Array<string>;
      }
    >
  >(true);
});

Deno.test("typesOfNullishDefaults", function (): void {
  const argv = parse([], {
    boolean: true,
    string: ["foo", "bar", "baz"],
    default: {
      bar: undefined,
      baz: null,
    },
  });
  assertType<
    IsExact<
      typeof argv,
      & { [x: string]: unknown }
      & {
        foo?: string | undefined;
        bar: string | undefined;
        baz: string | null;
        _: Array<string | number>;
      }
    >
  >(true);
});

Deno.test("typesOfParseGenerics", function (): void {
  const argv = parse<{ foo?: number } & { bar: string }, true>([]);
  assertType<
    IsExact<
      typeof argv,
      {
        foo?: number | undefined;
        bar: string;
        _: Array<string | number>;
        "--": Array<string>;
      }
    >
  >(true);
});

Deno.test("typesOfArgsGenerics", function (): void {
  type ArgsResult = Args<{ foo?: number } & { bar: string }, true>;
  assertType<
    IsExact<
      ArgsResult,
      {
        foo?: number | undefined;
        bar: string;
        _: Array<string | number>;
        "--": Array<string>;
      }
    >
  >(true);
});

Deno.test("typesOfParseOptionsGenerics", function (): void {
  type Opts = ParseOptions<"foo", "bar" | "baz">;
  assertType<
    IsExact<
      Pick<Opts, "string">,
      { string?: "bar" | "baz" | Array<"bar" | "baz"> | undefined }
    >
  >(true);

  assertType<
    IsExact<
      Pick<Opts, "boolean">,
      { boolean?: "foo" | Array<"foo"> | undefined }
    >
  >(true);

  assertType<
    IsExact<
      Pick<Opts, "default">,
      {
        default?: {
          [x: string]: unknown;
          bar?: unknown;
          baz?: unknown;
          foo?: unknown;
        } | undefined;
      }
    >
  >(true);
});
