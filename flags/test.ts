// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { parse } from "./mod.ts";

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

Deno.test("numbericShortArgs", function (): void {
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

Deno.test("stringAndAliasIsNotUnkown", function (): void {
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
