// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import {
  bool,
  cleanEnv,
  email,
  host,
  json,
  makeValidator,
  num,
  port,
  str,
  url,
} from "./mod.ts";
import { assertPassthrough } from "./utils.ts";

const makeSilent = { reporter: null };

Deno.test("bool()", () => {
  assertThrows(() => cleanEnv({ FOO: "asfd" }, { FOO: bool() }, makeSilent));

  const trueBool = cleanEnv({ FOO: true }, { FOO: bool() });
  assertEquals(trueBool, { FOO: true });

  const falseBool = cleanEnv({ FOO: false }, { FOO: bool() });
  assertEquals(falseBool, { FOO: false });

  const truthyNum = cleanEnv({ FOO: "1" }, { FOO: bool() });
  assertEquals(truthyNum, { FOO: true });
  const falsyNum = cleanEnv({ FOO: "0" }, { FOO: bool() });
  assertEquals(falsyNum, { FOO: false });

  const trueStr = cleanEnv({ FOO: "true" }, { FOO: bool() });
  assertEquals(trueStr, { FOO: true });

  const falseStr = cleanEnv({ FOO: "false" }, { FOO: bool() });
  assertEquals(falseStr, { FOO: false });

  const t = cleanEnv({ FOO: "t" }, { FOO: bool() });
  assertEquals(t, { FOO: true });
  const f = cleanEnv({ FOO: "f" }, { FOO: bool() });
  assertEquals(f, { FOO: false });

  const defaultF = cleanEnv({}, { FOO: bool({ default: false }) });
  assertEquals(defaultF, { FOO: false });
});

Deno.test("num()", () => {
  const withInt = cleanEnv({ FOO: "1" }, { FOO: num() });
  assertEquals(withInt, { FOO: 1 });

  const withFloat = cleanEnv({ FOO: "0.34" }, { FOO: num() });
  assertEquals(withFloat, { FOO: 0.34 });

  const withExponent = cleanEnv({ FOO: "1e3" }, { FOO: num() });
  assertEquals(withExponent, { FOO: 1000 });

  const withZero = cleanEnv({ FOO: 0 }, { FOO: num() });
  assertEquals(withZero, { FOO: 0 });

  assertThrows(() => cleanEnv({ FOO: "asdf" }, { FOO: num() }, makeSilent));

  assertThrows(() => cleanEnv({ FOO: "" }, { FOO: num() }, makeSilent));
});

Deno.test("email()", () => {
  const spec = { FOO: email() };
  assertPassthrough({ FOO: "foo@example.com" }, spec);
  assertPassthrough({ FOO: "foo.bar@my.example.com" }, spec);

  assertThrows(() => cleanEnv({ FOO: "asdf@asdf" }, spec, makeSilent));
  assertThrows(() => cleanEnv({ FOO: "1" }, spec, makeSilent));
});

Deno.test("host()", () => {
  const spec = { FOO: host() };
  assertPassthrough({ FOO: "example.com" }, spec);
  assertPassthrough({ FOO: "localhost" }, spec);
  assertPassthrough({ FOO: "192.168.0.1" }, spec);
  assertPassthrough({ FOO: "2001:0db8:85a3:0000:0000:8a2e:0370:7334" }, spec);

  assertThrows(() => cleanEnv({ FOO: "" }, spec, makeSilent));
  assertThrows(() => cleanEnv({ FOO: "example.com." }, spec, makeSilent));
});

Deno.test("port()", () => {
  const spec = { FOO: port() };

  const with1 = cleanEnv({ FOO: "1" }, spec);
  assertEquals(with1, { FOO: 1 });
  const with80 = cleanEnv({ FOO: "80" }, spec);
  assertEquals(with80, { FOO: 80 });
  const with80Num = cleanEnv({ FOO: 80 }, spec);
  assertEquals(with80Num, { FOO: 80 });
  const with65535 = cleanEnv({ FOO: "65535" }, spec);
  assertEquals(with65535, { FOO: 65535 });

  assertThrows(() => cleanEnv({ FOO: "" }, spec, makeSilent));
  assertThrows(() => cleanEnv({ FOO: "0" }, spec, makeSilent));
  assertThrows(() => cleanEnv({ FOO: "65536" }, spec, makeSilent));
  assertThrows(() => cleanEnv({ FOO: "042" }, spec, makeSilent));
  assertThrows(() => cleanEnv({ FOO: "42.0" }, spec, makeSilent));
  assertThrows(() => cleanEnv({ FOO: "42.42" }, spec, makeSilent));
  assertThrows(() => cleanEnv({ FOO: "hello" }, spec, makeSilent));
});

Deno.test("json()", () => {
  const env = cleanEnv({ FOO: '{"x": 123}' }, { FOO: json() });
  assertEquals(env, { FOO: { x: 123 } });

  assertThrows(() => cleanEnv({ FOO: "abc" }, { FOO: json() }, makeSilent));

  // default value should be passed through without running through JSON.parse()
  assertEquals(
    cleanEnv(
      {},
      {
        FOO: json({ default: { x: 999 } }),
      },
    ),
    { FOO: { x: 999 } },
  );
});

Deno.test("url()", () => {
  assertPassthrough({ FOO: "http://foo.com" }, { FOO: url() });
  assertPassthrough({ FOO: "http://foo.com/bar/baz" }, { FOO: url() });
  assertPassthrough({ FOO: "custom://foo.com/bar/baz?hi=1" }, { FOO: url() });

  assertThrows(() => cleanEnv({ FOO: "abc" }, { FOO: url() }, makeSilent));
});

Deno.test("str()", () => {
  const withEmpty = cleanEnv({ FOO: "" }, { FOO: str() });
  assertEquals(withEmpty, { FOO: "" });

  assertThrows(() => cleanEnv({ FOO: 42 }, { FOO: str() }, makeSilent));
});

Deno.test("custom validators", () => {
  const alwaysFoo = makeValidator((_x) => "foo");

  const fooEnv = cleanEnv({ FOO: "asdf" }, { FOO: alwaysFoo() });
  assertEquals(fooEnv, { FOO: "foo" });

  const hex10 = makeValidator((x) => {
    if (/^[a-f0-9]{10}$/.test(x)) return x;
    throw new Error("need 10 hex chars");
  });
  assertPassthrough({ FOO: "a0d9aacbde" }, { FOO: hex10() });
  assertThrows(
    () => cleanEnv({ FOO: "abc" }, { FOO: hex10() }, makeSilent),
    Error,
  );

  // Default values work with custom validators as well
  const withDefault = cleanEnv({}, { FOO: hex10({ default: "abcabcabc0" }) });
  assertEquals(withDefault, { FOO: "abcabcabc0" });
});
