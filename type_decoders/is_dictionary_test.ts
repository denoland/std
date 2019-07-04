// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodeSuccess,
  assertDecoder,
  assertDecodeErrors
} from "./_testing_util.ts";
import { Decoder } from "./decoder.ts";
import { isDictionary } from "./is_dictionary.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";
import { assertEquals } from "../testing/asserts.ts";

/**
 * isDictionary()
 */

test(function initializes() {
  const valueDecoder = new Decoder(
    value => new DecoderSuccess(value as string)
  );
  const KeyDecoder = new Decoder(value => new DecoderSuccess(value as string));

  assertDecoder(isDictionary(valueDecoder));
  assertDecoder(isDictionary(valueDecoder, KeyDecoder));
});

test(function noOptions() {
  const valueDecoder = new Decoder(value =>
    typeof value === "string"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a string")]
  );

  const decoder1 = isDictionary(valueDecoder);

  for (const item of [
    { 1: "one" },
    { 1: "one", two: "two" },
    { three: "a name", four: "another name", "a longer key": "name" }
  ]) {
    // isDictionary returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder1, item);
    assertEquals(decoder1.decode(item), new DecoderSuccess(item));
  }

  for (const item of [0.123, true, null, undefined]) {
    assertDecodeErrors({
      decoder: decoder1,
      input: item,
      expected: [
        {
          input: item,
          msg: "must be a non-null object"
        }
      ],
      count: 1
    });
  }

  const obj1 = { 1: 2 };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg: `invalid value for key ["1"] > must be a string`
      }
    ],
    count: 1
  });

  const obj2 = { 1: "one", two: ["two"] };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg: `invalid value for key ["two"] > must be a string`
      }
    ],
    count: 1
  });

  const obj3 = { three: "a name", four: true, "a longer key": 6 };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: `invalid value for key ["four"] > must be a string`
      }
    ],
    count: 1
  });
});

test(function optionAllErrors() {
  const valueDecoder = new Decoder(value =>
    typeof value === "string"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a string")]
  );

  const decoder1 = isDictionary(valueDecoder, { allErrors: true });

  for (const item of [
    { 1: "one" },
    { 1: "one", two: "two" },
    { three: "a name", four: "another name", "a longer key": "name" }
  ]) {
    // isDictionary returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder1, item);
    assertEquals(decoder1.decode(item), new DecoderSuccess(item));
  }

  for (const item of [0.123, true, null, undefined]) {
    assertDecodeErrors({
      decoder: decoder1,
      input: item,
      expected: [
        {
          input: item,
          msg: "must be a non-null object"
        }
      ],
      count: 1
    });
  }

  const obj1 = { 1: 2 };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg: `invalid value for key ["1"] > must be a string`
      }
    ],
    count: 1
  });

  const obj2 = { 1: 1, two: ["two"] };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg: `invalid value for key ["1"] > must be a string`
      },
      {
        input: obj2,
        msg: `invalid value for key ["two"] > must be a string`
      }
    ],
    count: 2
  });

  const obj3 = { three: { 1: "a name" }, four: true, "a longer key": 6 };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: `invalid value for key ["three"] > must be a string`
      },
      {
        input: obj3,
        msg: `invalid value for key ["four"] > must be a string`
      },
      {
        input: obj3,
        msg: `invalid value for key ["a longer key"] > must be a string`
      }
    ],
    count: 3
  });
});

test(function optionKeyDecoder() {
  const valueDecoder = new Decoder(value =>
    typeof value === "string"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a string")]
  );

  const keyDecoder = new Decoder(value => {
    const int = parseInt(value);

    return Number.isInteger(int) || value === "a"
      ? new DecoderSuccess(value as string)
      : [new DecoderError(value, 'must be a number or the letter "a"')];
  });

  const decoder1 = isDictionary(valueDecoder, keyDecoder);

  for (const item of [
    { 1: "one" },
    { 1: "one", "45": "two" },
    { "-3435654": "a name", a: "another name", 382938: "name" }
  ]) {
    // isDictionary returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder1, item);
    assertEquals(decoder1.decode(item), new DecoderSuccess(item));
  }

  const obj3 = { 1: 1, two: ["two"] };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: `invalid value for key ["1"] > must be a string`
      }
    ],
    count: 1
  });

  const obj4 = { apples: { 1: "a name" }, a: "true", "a longer key": 6 };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj4,
    expected: [
      {
        input: obj4,
        msg: `invalid key ["apples"] > must be a number or the letter "a"`
      }
    ],
    count: 1
  });
});

test(function optionKeyDecoderAllErrors() {
  const valueDecoder = new Decoder(value =>
    typeof value === "string"
      ? new DecoderSuccess(value)
      : [new DecoderError(value, "must be a string")]
  );

  const keyDecoder = new Decoder(value => {
    const int = parseInt(value);

    return Number.isInteger(int) || value === "a"
      ? new DecoderSuccess(value as string)
      : [new DecoderError(value, 'must be a number or the letter "a"')];
  });

  const decoder1 = isDictionary(valueDecoder, keyDecoder, { allErrors: true });

  for (const item of [
    { 1: "one" },
    { 1: "one", "45": "two" },
    { "-3435654": "a name", a: "another name", 382938: "name" }
  ]) {
    // isDictionary returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder1, item);
    assertEquals(decoder1.decode(item), new DecoderSuccess(item));
  }

  for (const item of [0.123, true, null, undefined]) {
    assertDecodeErrors({
      decoder: decoder1,
      input: item,
      expected: [
        {
          input: item,
          msg: "must be a non-null object"
        }
      ],
      count: 1
    });
  }

  const obj1 = { 1: 2 };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg: `invalid value for key ["1"] > must be a string`
      }
    ],
    count: 1
  });

  const obj2 = { apples: "apples" };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg: `invalid key ["apples"] > must be a number or the letter "a"`
      }
    ],
    count: 1
  });

  const obj3 = { 1: 1, two: ["two"] };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: `invalid value for key ["1"] > must be a string`
      },
      {
        input: obj3,
        msg: `invalid key ["two"] > must be a number or the letter "a"`
      }
    ],
    count: 2
  });

  const obj4 = { 3: { 1: "a name" }, a: "true", "a longer key": 6 };
  assertDecodeErrors({
    decoder: decoder1,
    input: obj4,
    expected: [
      {
        input: obj4,
        msg: `invalid value for key ["3"] > must be a string`
      },
      {
        input: obj4,
        msg: `invalid key ["a longer key"] > must be a number or the letter "a"`
      }
    ],
    count: 2
  });
});

runTests();
