// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  assert,
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import { encode } from "../encoding/base64url.ts";

import {
  CookieMap,
  cookieMapHeadersInitSymbol,
  type Data,
  type KeyRing,
  mergeHeaders,
  SecureCookieMap,
} from "./cookie_map.ts";

export type Key = string | number[] | ArrayBuffer | Uint8Array;

const encoder = new TextEncoder();

function importKey(key: Key): Promise<CryptoKey> {
  if (typeof key === "string") {
    key = encoder.encode(key);
  } else if (Array.isArray(key)) {
    key = new Uint8Array(key);
  }
  return crypto.subtle.importKey(
    "raw",
    key,
    {
      name: "HMAC",
      hash: { name: "SHA-256" },
    },
    true,
    ["sign", "verify"],
  );
}

function sign(data: Data, key: CryptoKey): Promise<ArrayBuffer> {
  if (typeof data === "string") {
    data = encoder.encode(data);
  } else if (Array.isArray(data)) {
    data = Uint8Array.from(data);
  }
  return crypto.subtle.sign("HMAC", key, data);
}

function compareArrayBuffer(a: ArrayBuffer, b: ArrayBuffer): boolean {
  assert(a.byteLength === b.byteLength, "ArrayBuffer lengths must match.");
  const va = new DataView(a);
  const vb = new DataView(b);
  const length = va.byteLength;
  let out = 0;
  let i = -1;
  while (++i < length) {
    out |= va.getUint8(i) ^ vb.getUint8(i);
  }
  return out === 0;
}

async function compare(a: Data, b: Data): Promise<boolean> {
  const key = new Uint8Array(32);
  globalThis.crypto.getRandomValues(key);
  const cryptoKey = await importKey(key);
  const ah = await sign(a, cryptoKey);
  const bh = await sign(b, cryptoKey);
  return compareArrayBuffer(ah, bh);
}

export class KeyStack implements KeyRing {
  #cryptoKeys = new Map<Key, CryptoKey>();
  #keys: Key[];

  async #toCryptoKey(key: Key): Promise<CryptoKey> {
    if (!this.#cryptoKeys.has(key)) {
      this.#cryptoKeys.set(key, await importKey(key));
    }
    return this.#cryptoKeys.get(key)!;
  }

  get length(): number {
    return this.#keys.length;
  }

  constructor(keys: Iterable<Key>) {
    const values = Array.isArray(keys) ? keys : [...keys];
    if (!(values.length)) {
      throw new TypeError("keys must contain at least one value");
    }
    this.#keys = values;
  }

  /** Take `data` and return a SHA256 HMAC digest that uses the current 0 index
   * of the `keys` passed to the constructor.  This digest is in the form of a
   * URL safe base64 encoded string. */
  async sign(data: Data): Promise<string> {
    const key = await this.#toCryptoKey(this.#keys[0]);
    return encode(await sign(data, key));
  }

  /** Given `data` and a `digest`, verify that one of the `keys` provided the
   * constructor was used to generate the `digest`.  Returns `true` if one of
   * the keys was used, otherwise `false`. */
  async verify(data: Data, digest: string): Promise<boolean> {
    return (await this.indexOf(data, digest)) > -1;
  }

  /** Given `data` and a `digest`, return the current index of the key in the
   * `keys` passed the constructor that was used to generate the digest.  If no
   * key can be found, the method returns `-1`. */
  async indexOf(data: Data, digest: string): Promise<number> {
    for (let i = 0; i < this.#keys.length; i++) {
      const cryptoKey = await this.#toCryptoKey(this.#keys[i]);
      if (
        await compare(digest, encode(await sign(data, cryptoKey)))
      ) {
        return i;
      }
    }
    return -1;
  }

  [Symbol.for("Deno.customInspect")](inspect: (value: unknown) => string) {
    const { length } = this;
    return `${this.constructor.name} ${inspect({ length })}`;
  }

  [Symbol.for("nodejs.util.inspect.custom")](
    depth: number,
    // deno-lint-ignore no-explicit-any
    options: any,
    inspect: (value: unknown, options?: unknown) => string,
  ) {
    if (depth < 0) {
      return options.stylize(`[${this.constructor.name}]`, "special");
    }

    const newOptions = Object.assign({}, options, {
      depth: options.depth === null ? null : options.depth - 1,
    });
    const { length } = this;
    return `${options.stylize(this.constructor.name, "special")} ${
      inspect({ length }, newOptions)
    }`;
  }
}

function isNode(): boolean {
  return "process" in globalThis && "global" in globalThis;
}

function createHeaders(cookies?: string[]) {
  return new Headers(
    cookies ? [["cookie", cookies.join("; ")]] : undefined,
  );
}

Deno.test({
  name: "CookieMap - get cookie value",
  fn() {
    const request = createHeaders(["foo=bar"]);
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    assertEquals(cookies.get("foo"), "bar");
    assertEquals(cookies.get("bar"), undefined);
    assertEquals([...response], []);
  },
});

Deno.test({
  name: "CookieMap - set cookie",
  fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    cookies.set("foo", "bar");
    assertEquals([...response], [
      ["set-cookie", "foo=bar; path=/; httponly"],
    ]);
  },
});

Deno.test({
  name: "CookieMap - pass request and response",
  fn() {
    const request = new Request("http://localhost:8080/");
    const response = new Response(null);
    const cookies = new CookieMap(request, { response });
    cookies.set("foo", "bar");
    assertEquals([...response.headers], [
      ["set-cookie", "foo=bar; path=/; httponly"],
    ]);
  },
});

Deno.test({
  name: "CookieMap - omit response",
  fn() {
    const request = createHeaders();
    const cookies = new CookieMap(request);
    cookies.set("foo", "bar");
    assertEquals(cookies[cookieMapHeadersInitSymbol](), [
      ["set-cookie", "foo=bar; path=/; httponly"],
    ]);
  },
});

Deno.test({
  name: "CookieMap - set multiple cookies",
  fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    cookies.set("a", "a");
    cookies.set("b", "b");
    cookies.set("c", "c");
    const expected = isNode()
      ? [[
        "set-cookie",
        "a=a; path=/; httponly, b=b; path=/; httponly, c=c; path=/; httponly",
      ]]
      : [
        ["set-cookie", "a=a; path=/; httponly"],
        ["set-cookie", "b=b; path=/; httponly"],
        ["set-cookie", "c=c; path=/; httponly"],
      ];
    assertEquals([...response], expected);
  },
});

Deno.test({
  name: "CookieMap - set cookie with options",
  fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    cookies.set("foo", "bar", {
      domain: "*.example.com",
      expires: new Date("2020-01-01T00:00:00+00:00"),
      httpOnly: false,
      overwrite: false,
      path: "/foo",
      sameSite: "strict",
    });
    assertEquals(
      response.get("set-cookie"),
      "foo=bar; path=/foo; expires=Wed, 01 Jan 2020 00:00:00 GMT; domain=*.example.com; samesite=strict",
    );
  },
});

Deno.test({
  name: "CookieMap - set secure cookie",
  fn() {
    const request = createHeaders([]);
    const response = createHeaders();
    const cookies = new CookieMap(request, { response, secure: true });
    cookies.set("bar", "foo", { secure: true });

    assertEquals(
      response.get("set-cookie"),
      "bar=foo; path=/; secure; httponly",
    );
  },
});

Deno.test({
  name: "CookieMap - set secure cookie on insecure context fails",
  fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    assertThrows(
      () => {
        cookies.set("bar", "foo", { secure: true });
      },
      TypeError,
      "Cannot send secure cookie over unencrypted connection.",
    );
  },
});

Deno.test({
  name: "CookieMap - set secure cookie on insecure context with ignoreInsecure",
  fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    cookies.set("bar", "foo", { secure: true, ignoreInsecure: true });

    assertEquals(
      response.get("set-cookie"),
      "bar=foo; path=/; secure; httponly",
    );
  },
});

Deno.test({
  name: "CookieMap - iterate cookies",
  fn() {
    const request = createHeaders(
      ["bar=foo", "foo=baz", "baz=1234"],
    );
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    const actual = [...cookies];
    assertEquals(
      actual,
      [["bar", "foo"], ["foo", "baz"], ["baz", "1234"]],
    );
  },
});

Deno.test({
  name: "CookieMap - has",
  fn() {
    const request = createHeaders(
      ["bar=foo", "foo=baz", "baz=1234"],
    );
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    assert(cookies.has("baz"));
    assert(!cookies.has("qat"));
  },
});

Deno.test({
  name: "CookieMap - size",
  fn() {
    const request = createHeaders(
      ["bar=foo", "foo=baz", "baz=1234"],
    );
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    assertEquals(cookies.size, 3);
  },
});

Deno.test({
  name: "CookieMap - inspecting",
  fn() {
    const request = createHeaders(
      ["bar=foo", "foo=baz", "baz=1234"],
    );
    const response = createHeaders();
    assertEquals(
      Deno.inspect(new CookieMap(request, { response })),
      `CookieMap []`,
    );
  },
});

Deno.test({
  name: "CookieMap - set multiple cookies with options",
  fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new CookieMap(request, { response });
    cookies.set("foo", "bar", {
      domain: "*.example.com",
      expires: new Date("2020-01-01T00:00:00+00:00"),
      httpOnly: false,
      overwrite: false,
      path: "/foo",
      sameSite: "strict",
    });
    cookies.set("a", "b", {
      domain: "*.example.com",
      expires: new Date("2020-01-01T00:00:00+00:00"),
      httpOnly: false,
      overwrite: false,
      path: "/a",
      sameSite: "strict",
    });
    cookies.set("foo", "baz", {
      domain: "*.example.com",
      expires: new Date("2020-01-01T00:00:00+00:00"),
      httpOnly: false,
      overwrite: true,
      path: "/baz",
      sameSite: "strict",
    });
    const expected = isNode()
      ? "foo=baz; path=/baz; expires=Wed, 01 Jan 2020 00:00:00 GMT; domain=*.example.com; samesite=strict"
      : "a=b; path=/a; expires=Wed, 01 Jan 2020 00:00:00 GMT; domain=*.example.com; samesite=strict, foo=baz; path=/baz; expires=Wed, 01 Jan 2020 00:00:00 GMT; domain=*.example.com; samesite=strict";
    assertEquals(response.get("set-cookie"), expected);
  },
});

Deno.test({
  name: "SecureCookieMap - get cookie value",
  async fn() {
    const request = createHeaders(["foo=bar"]);
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    assertEquals(await cookies.get("foo"), "bar");
    assertEquals(await cookies.get("bar"), undefined);
    assertEquals([...response], []);
  },
});

Deno.test({
  name: "SecureCookieMap - pass request and response",
  async fn() {
    const request = new Request("http://localhost:8080/");
    const response = new Response(null);
    const cookies = new SecureCookieMap(request, { response });
    await cookies.set("foo", "bar");
    assertEquals([...response.headers], [
      ["set-cookie", "foo=bar; path=/; httponly"],
    ]);
  },
});

Deno.test({
  name: "SecureCookieMap - omit response",
  async fn() {
    const request = createHeaders();
    const cookies = new SecureCookieMap(request);
    await cookies.set("foo", "bar");
    assertEquals(cookies[cookieMapHeadersInitSymbol](), [
      ["set-cookie", "foo=bar; path=/; httponly"],
    ]);
  },
});

Deno.test({
  name: "SecureCookieMap - get signed cookie",
  async fn() {
    const request = createHeaders(
      ["bar=foo", "bar.sig=S7GhXzJF3n4j8JwTupr7H-h25qtt_vs0stdETXZb-Ro"],
    );
    const response = createHeaders();
    const cookies = new SecureCookieMap(
      request,
      { response, keys: new KeyStack(["secret1"]) },
    );
    assertEquals(await cookies.get("bar"), "foo");
    assertEquals([...response], []);
  },
});

Deno.test({
  name: "SecureCookieMap - get signed cookie requiring re-signing",
  async fn() {
    const request = createHeaders(
      ["bar=foo", "bar.sig=S7GhXzJF3n4j8JwTupr7H-h25qtt_vs0stdETXZb-Ro"],
    );
    const response = createHeaders();
    const cookies = new SecureCookieMap(
      request,
      { response, keys: new KeyStack(["secret2", "secret1"]) },
    );
    assertEquals(await cookies.get("bar"), "foo");
    assertEquals([...response], [[
      "set-cookie",
      "bar.sig=ar46bgP3n0ZRazFOfiZ4SyZVFxKUvG1-zQZCb9lbcPI; path=/; httponly",
    ]]);
  },
});

Deno.test({
  name: "SecureCookieMap - get invalid signed cookie",
  async fn() {
    const request = createHeaders(
      ["bar=foo", "bar.sig=tampered", "foo=baz"],
    );
    const response = createHeaders();
    const cookies = new SecureCookieMap(
      request,
      { response, keys: new KeyStack(["secret1"]) },
    );
    assertEquals(await cookies.get("bar"), undefined);
    assertEquals(await cookies.get("foo"), undefined);
    assertEquals([...response], [
      [
        "set-cookie",
        "bar.sig=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly",
      ],
    ]);
  },
});

Deno.test({
  name: "SecureCookieMap - set cookie",
  async fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    await cookies.set("foo", "bar");
    assertEquals([...response], [
      ["set-cookie", "foo=bar; path=/; httponly"],
    ]);
  },
});

Deno.test({
  name: "SecureCookieMap - set multiple cookies",
  async fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    await cookies.set("a", "a");
    await cookies.set("b", "b");
    await cookies.set("c", "c");
    const expected = isNode()
      ? [[
        "set-cookie",
        "a=a; path=/; httponly, b=b; path=/; httponly, c=c; path=/; httponly",
      ]]
      : [
        ["set-cookie", "a=a; path=/; httponly"],
        ["set-cookie", "b=b; path=/; httponly"],
        ["set-cookie", "c=c; path=/; httponly"],
      ];
    assertEquals([...response], expected);
  },
});

Deno.test({
  name: "SecureCookieMap - set cookie with options",
  async fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    await cookies.set("foo", "bar", {
      domain: "*.example.com",
      expires: new Date("2020-01-01T00:00:00+00:00"),
      httpOnly: false,
      overwrite: false,
      path: "/foo",
      sameSite: "strict",
    });
    assertEquals(
      response.get("set-cookie"),
      "foo=bar; path=/foo; expires=Wed, 01 Jan 2020 00:00:00 GMT; domain=*.example.com; samesite=strict",
    );
  },
});

Deno.test({
  name: "SecureCookieMap - set signed cookie",
  async fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new SecureCookieMap(
      request,
      { response, keys: new KeyStack(["secret1"]) },
    );
    await cookies.set("bar", "foo");

    assertEquals(
      response.get("set-cookie"),
      "bar=foo; path=/; httponly, bar.sig=S7GhXzJF3n4j8JwTupr7H-h25qtt_vs0stdETXZb-Ro; path=/; httponly",
    );
  },
});

Deno.test({
  name: "SecureCookieMap - set secure cookie",
  async fn() {
    const request = createHeaders([]);
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response, secure: true });
    await cookies.set("bar", "foo", { secure: true });

    assertEquals(
      response.get("set-cookie"),
      "bar=foo; path=/; secure; httponly",
    );
  },
});

Deno.test({
  name: "SecureCookieMap - set secure cookie on insecure context fails",
  async fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    await assertRejects(
      async () => {
        await cookies.set("bar", "foo", { secure: true });
      },
      TypeError,
      "Cannot send secure cookie over unencrypted connection.",
    );
  },
});

Deno.test({
  name:
    "SecureCookieMap - set secure cookie on insecure context with ignoreInsecure",
  async fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    await cookies.set("bar", "foo", { secure: true, ignoreInsecure: true });

    assertEquals(
      response.get("set-cookie"),
      "bar=foo; path=/; secure; httponly",
    );
  },
});

Deno.test({
  name: "SecureCookieMap - iterate cookies",
  async fn() {
    const request = createHeaders(
      ["bar=foo", "foo=baz", "baz=1234"],
    );
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    const actual = [];
    for await (const cookie of cookies) {
      actual.push(cookie);
    }
    assertEquals(
      actual,
      [["bar", "foo"], ["foo", "baz"], ["baz", "1234"]],
    );
  },
});

Deno.test({
  name: "SecureCookieMap - iterate signed cookie",
  async fn() {
    const request = createHeaders(
      ["bar=foo", "bar.sig=S7GhXzJF3n4j8JwTupr7H-h25qtt_vs0stdETXZb-Ro"],
    );
    const response = createHeaders();
    const cookies = new SecureCookieMap(
      request,
      { response, keys: new KeyStack(["secret1"]) },
    );
    const actual = [];
    for await (const cookie of cookies) {
      actual.push(cookie);
    }
    assertEquals(actual, [["bar", "foo"]]);
  },
});

Deno.test({
  name: "SecureCookieMap - has",
  async fn() {
    const request = createHeaders(
      ["bar=foo", "foo=baz", "baz=1234"],
    );
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    assert(await cookies.has("baz"));
    assert(!await cookies.has("qat"));
  },
});

Deno.test({
  name: "SecureCookieMap - size",
  async fn() {
    const request = createHeaders(
      ["bar=foo", "foo=baz", "baz=1234"],
    );
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    assertEquals(await cookies.size, 3);
  },
});

Deno.test({
  name: "SecureCookieMap - inspecting",
  fn() {
    const request = createHeaders(
      ["bar=foo", "foo=baz", "baz=1234"],
    );
    const response = createHeaders();
    assertEquals(
      Deno.inspect(new SecureCookieMap(request, { response })),
      `SecureCookieMap []`,
    );
  },
});

Deno.test({
  name: "SecureCookieMap - set multiple cookies with options",
  async fn() {
    const request = createHeaders();
    const response = createHeaders();
    const cookies = new SecureCookieMap(request, { response });
    await cookies.set("foo", "bar", {
      domain: "*.example.com",
      expires: new Date("2020-01-01T00:00:00+00:00"),
      httpOnly: false,
      overwrite: false,
      path: "/foo",
      sameSite: "strict",
    });
    await cookies.set("a", "b", {
      domain: "*.example.com",
      expires: new Date("2020-01-01T00:00:00+00:00"),
      httpOnly: false,
      overwrite: false,
      path: "/a",
      sameSite: "strict",
    });
    await cookies.set("foo", "baz", {
      domain: "*.example.com",
      expires: new Date("2020-01-01T00:00:00+00:00"),
      httpOnly: false,
      overwrite: true,
      path: "/baz",
      sameSite: "strict",
    });
    const expected = isNode()
      ? "foo=baz; path=/baz; expires=Wed, 01 Jan 2020 00:00:00 GMT; domain=*.example.com; samesite=strict"
      : "a=b; path=/a; expires=Wed, 01 Jan 2020 00:00:00 GMT; domain=*.example.com; samesite=strict, foo=baz; path=/baz; expires=Wed, 01 Jan 2020 00:00:00 GMT; domain=*.example.com; samesite=strict";
    assertEquals(response.get("set-cookie"), expected);
  },
});

Deno.test({
  name: "mergeHeaders() - passing cookies/mergable",
  async fn() {
    const request = createHeaders();
    const secureCookies = new SecureCookieMap(request);
    await secureCookies.set("foo", "bar");
    const cookies = new CookieMap(request);
    cookies.set("bar", "baz");
    const headers = mergeHeaders(secureCookies, cookies);
    assertEquals([...headers], [
      ["set-cookie", "foo=bar; path=/; httponly"],
      ["set-cookie", "bar=baz; path=/; httponly"],
    ]);
  },
});

Deno.test({
  name: "mergeHeaders() - passing headers",
  fn() {
    const request = createHeaders();
    const cookies = new CookieMap(request);
    cookies.set("bar", "baz");
    const upstreamHeaders = new Headers({ "Content-Type": "application/json" });
    const headers = mergeHeaders(upstreamHeaders, cookies);
    assertEquals([...headers], [
      ["content-type", "application/json"],
      ["set-cookie", "bar=baz; path=/; httponly"],
    ]);
  },
});

Deno.test({
  name: "mergeHeaders() - passing response object",
  fn() {
    const request = createHeaders();
    const cookies = new CookieMap(request);
    cookies.set("bar", "baz");
    const response = new Response(null, {
      headers: { "Content-Type": "application/json" },
    });
    const headers = mergeHeaders(response, cookies);
    assertEquals([...headers], [
      ["content-type", "application/json"],
      ["set-cookie", "bar=baz; path=/; httponly"],
    ]);
  },
});

Deno.test({
  name: "mergeHeaders() - passing headers init",
  fn() {
    const request = createHeaders();
    const cookies = new CookieMap(request);
    cookies.set("bar", "baz");
    const headers = mergeHeaders(
      { "Content-Type": "application/json" },
      [["vary", "accept"]],
      cookies,
    );
    assertEquals([...headers], [
      ["content-type", "application/json"],
      ["set-cookie", "bar=baz; path=/; httponly"],
      ["vary", "accept"],
    ]);
  },
});
