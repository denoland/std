import { parse, ParseOptions } from "../../../jsonc.ts";
import { assertEquals, assertThrows } from "../../../../testing/asserts.ts";
function assertValidParse(
  text: string,
  expected: unknown,
  options?: ParseOptions,
) {
  assertEquals(parse(text, options), expected);
}
function assertInvalidParse(
  text: string,
  // deno-lint-ignore no-explicit-any
  ErrorClass?: (new (...args: any[]) => Error),
  msgIncludes?: string,
  options?: ParseOptions,
) {
  assertThrows(
    () => parse(text, options),
    ErrorClass,
    msgIncludes,
  );
}

Deno.test("[jsonc] node-jsonc-parser parse: literals", () => {
  assertValidParse("true", true);
  assertValidParse("false", false);
  assertValidParse("null", null);
  assertValidParse('"foo"', "foo");
  assertValidParse(
    '"\\"-\\\\-\\/-\\b-\\f-\\n-\\r-\\t"',
    '"-\\-/-\b-\f-\n-\r-\t',
  );
  assertValidParse('"\\u00DC"', "Ü");
  assertValidParse("9", 9);
  assertValidParse("-9", -9);
  assertValidParse("0.129", 0.129);
  assertValidParse("23e3", 23e3);
  assertValidParse("1.2E+3", 1.2E+3);
  assertValidParse("1.2E-3", 1.2E-3);
  assertValidParse("1.2E-3 // comment", 1.2E-3);
});

Deno.test("[jsonc] node-jsonc-parser parse: objects", () => {
  assertValidParse("{}", {});
  assertValidParse('{ "foo": true }', { foo: true });
  assertValidParse('{ "bar": 8, "xoo": "foo" }', { bar: 8, xoo: "foo" });
  assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
  assertValidParse('{ "a": false, "b": true, "c": [ 7.4 ] }', {
    a: false,
    b: true,
    c: [7.4],
  });
  assertValidParse(
    '{ "lineComment": "//", "blockComment": ["/*", "*/"], "brackets": [ ["{", "}"], ["[", "]"], ["(", ")"] ] }',
    {
      lineComment: "//",
      blockComment: ["/*", "*/"],
      brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
    },
  );
  assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
  assertValidParse('{ "hello": { "again": { "inside": 5 }, "world": 1 }}', {
    hello: { again: { inside: 5 }, world: 1 },
  });
  assertValidParse('{ "foo": /*hello*/true }', { foo: true });
  assertValidParse('{ "": true }', { "": true });
});

Deno.test("[jsonc] node-jsonc-parser parse: arrays", () => {
  assertValidParse("[]", []);
  assertValidParse("[ [],  [ [] ]]", [[], [[]]]);
  assertValidParse("[ 1, 2, 3 ]", [1, 2, 3]);
  assertValidParse('[ { "a": null } ]', [{ a: null }]);
});

Deno.test("[jsonc] node-jsonc-parser parse: objects with errors", () => {
  assertInvalidParse("{,}", SyntaxError);
  assertInvalidParse('{ "foo": true, }', SyntaxError, undefined, {
    allowTrailingComma: false,
  });
  assertInvalidParse('{ "bar": 8 "xoo": "foo" }', SyntaxError);
  assertInvalidParse('{ ,"bar": 8 }', SyntaxError);
  assertInvalidParse('{ ,"bar": 8, "foo" }', SyntaxError);
  assertInvalidParse('{ "bar": 8, "foo": }', SyntaxError);
  assertInvalidParse('{ 8, "foo": 9 }', SyntaxError);
});

Deno.test("[jsonc] node-jsonc-parser parse: array with errors", () => {
  assertInvalidParse("[,]", SyntaxError);
  assertInvalidParse("[ 1 2, 3 ]", SyntaxError);
  assertInvalidParse("[ ,1, 2, 3 ]", SyntaxError);
  assertInvalidParse("[ ,1, 2, 3, ]", SyntaxError);
});

Deno.test("[jsonc] node-jsonc-parser parse: errors", () => {
  assertInvalidParse("", SyntaxError);
  assertInvalidParse("1,1", SyntaxError);
});

Deno.test("[jsonc] node-jsonc-parser parse: trailing comma", () => {
  const options = { allowTrailingComma: false };
  assertValidParse('{ "hello": [], }', { hello: [] });
  assertValidParse('{ "hello": [] }', { hello: [] });
  assertValidParse(
    '{ "hello": [], "world": {}, }',
    { hello: [], world: {} },
  );
  assertValidParse(
    '{ "hello": [], "world": {} }',
    { hello: [], world: {} },
  );
  assertValidParse("[ 1, 2, ]", [1, 2]);
  assertValidParse("[ 1, 2 ]", [1, 2]);

  assertInvalidParse('{ "hello": [], }', SyntaxError, undefined, options);
  assertInvalidParse(
    '{ "hello": [], "world": {}, }',
    SyntaxError,
    undefined,
    options,
  );
  assertInvalidParse("[ 1, 2, ]", SyntaxError, undefined, options);
});
