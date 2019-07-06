// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecoder,
  assertDecodesToErrors,
  stringDecoder,
  stringPromiseDecoder
} from "./test_util.ts";
import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isDictionary } from "./is_dictionary.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";
import { assertEquals } from "../testing/asserts.ts";

/**
 * isDictionary()
 */

test({
  name: "init isDictionary()",
  fn: () => {
    assertDecoder(isDictionary(stringDecoder));
    assertDecoder(isDictionary(stringDecoder, stringDecoder));
  }
});

test({
  name: "isDictionary(stringDecoder)",
  fn: () => {
    const decoder = isDictionary(stringDecoder);

    for (const item of [
      { 1: "one" },
      { 1: "one", two: "two" },
      { three: "a name", four: "another name", "a longer key": "name" }
    ]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isDictionary"
        })
      ]);
    }

    const input = {
      1: "one",
      two: ["two"],
      three: null,
      four: true,
      "a longer key": 6
    };
    assertDecodesToErrors(decoder, input, [
      new DecoderError(
        input,
        'invalid value for key ["two"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "two",
          key: "two",
          child: new DecoderError(input.two, "must be a string")
        }
      )
    ]);
  }
});

test({
  name: "isDictionary(stringDecoder, {allErrors: true})",
  fn: () => {
    const decoder = isDictionary(stringDecoder, { allErrors: true });

    for (const item of [
      { 1: "one" },
      { 1: "one", two: "two" },
      { three: "a name", four: "another name", "a longer key": "name" }
    ]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isDictionary",
          allErrors: true
        })
      ]);
    }

    const input = {
      1: "one",
      two: ["two"],
      three: null,
      four: true,
      "a longer key": 6
    };
    assertDecodesToErrors(decoder, input, [
      new DecoderError(
        input,
        'invalid value for key ["two"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "two",
          key: "two",
          allErrors: true,
          child: new DecoderError(input.two, "must be a string")
        }
      ),
      new DecoderError(
        input,
        'invalid value for key ["three"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "three",
          key: "three",
          allErrors: true,
          child: new DecoderError(input.three, "must be a string")
        }
      ),
      new DecoderError(
        input,
        'invalid value for key ["four"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "four",
          key: "four",
          allErrors: true,
          child: new DecoderError(input.four, "must be a string")
        }
      ),
      new DecoderError(
        input,
        'invalid value for key ["a longer key"] > must be a string',
        {
          decoderName: "isDictionary",
          location: '["a longer key"]',
          key: "a longer key",
          allErrors: true,
          child: new DecoderError(input["a longer key"], "must be a string")
        }
      )
    ]);
  }
});

test({
  name: "isDictionary(stringDecoder, keyDecoder)",
  fn: () => {
    const keyDecoder = new Decoder((value: string) =>
      value.length < 5
        ? new DecoderSuccess(value)
        : [new DecoderError(value, "must have length less than 5")]
    );

    const decoder = isDictionary(stringDecoder, keyDecoder);

    for (const item of [{ 1: "one" }, { 1: "one", two: "two" }]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isDictionary"
        })
      ]);
    }

    const input = {
      1: "one",
      two: ["two"],
      three: null,
      four: true,
      "a longer key": 6
    };
    assertDecodesToErrors(decoder, input, [
      new DecoderError(
        input,
        'invalid value for key ["two"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "two",
          key: "two",
          child: new DecoderError(input.two, "must be a string")
        }
      )
    ]);
  }
});

test({
  name: "isDictionary(stringDecoder, keyDecoder, {allErrors: true})",
  fn: () => {
    const keyDecoder = new Decoder((value: string) =>
      value.length < 5
        ? new DecoderSuccess(value)
        : [new DecoderError(value, "must have length less than 5")]
    );

    const decoder = isDictionary(stringDecoder, keyDecoder, {
      allErrors: true
    });

    for (const item of [{ 1: "one" }, { 1: "one", two: "two" }]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isDictionary",
          allErrors: true
        })
      ]);
    }

    const input = {
      1: "one",
      two: ["two"],
      three: null,
      four: true,
      "a longer key": 6
    };
    assertDecodesToErrors(decoder, input, [
      new DecoderError(
        input,
        'invalid value for key ["two"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "two",
          key: "two",
          allErrors: true,
          child: new DecoderError(input.two, "must be a string")
        }
      ),
      new DecoderError(
        input,
        'invalid key ["three"] > must have length less than 5',
        {
          decoderName: "isDictionary",
          allErrors: true,
          location: "three",
          key: "three",
          child: new DecoderError("three", "must have length less than 5")
        }
      ),
      new DecoderError(
        input,
        'invalid value for key ["four"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "four",
          key: "four",
          allErrors: true,
          child: new DecoderError(input.four, "must be a string")
        }
      ),
      new DecoderError(
        input,
        'invalid key ["a longer key"] > must have length less than 5',
        {
          decoderName: "isDictionary",
          allErrors: true,
          location: '["a longer key"]',
          key: "a longer key",
          child: new DecoderError(
            "a longer key",
            "must have length less than 5"
          )
        }
      )
    ]);
  }
});

test({
  name: "async isDictionary(stringDecoder, keyDecoder)",
  fn: async () => {
    const keyPromiseDecoder = new PromiseDecoder(async (value: string) =>
      value.length < 5
        ? new DecoderSuccess(value)
        : [new DecoderError(value, "must have length less than 5")]
    );

    const decoder = isDictionary(stringPromiseDecoder, keyPromiseDecoder);

    for (const item of [{ 1: "one" }, { 1: "one", two: "two" }]) {
      await assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined]) {
      await assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isDictionary"
        })
      ]);
    }

    const input = {
      1: "one",
      two: ["two"],
      three: null,
      four: true,
      "a longer key": 6
    };
    await assertDecodesToErrors(decoder, input, [
      new DecoderError(
        input,
        'invalid value for key ["two"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "two",
          key: "two",
          child: new DecoderError(input.two, "must be a string")
        }
      )
    ]);
  }
});

test({
  name: "async isDictionary(stringDecoder, keyDecoder, {allErrors: true})",
  fn: async () => {
    const keyPromiseDecoder = new PromiseDecoder(async (value: string) =>
      value.length < 5
        ? new DecoderSuccess(value)
        : [new DecoderError(value, "must have length less than 5")]
    );

    const decoder = isDictionary(stringDecoder, keyPromiseDecoder, {
      allErrors: true
    });

    assertEquals(decoder instanceof PromiseDecoder, true);

    for (const item of [{ 1: "one" }, { 1: "one", two: "two" }]) {
      await assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined]) {
      await assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isDictionary",
          allErrors: true
        })
      ]);
    }

    const input = {
      1: "one",
      two: ["two"],
      three: null,
      four: true,
      "a longer key": 6
    };
    await assertDecodesToErrors(decoder, input, [
      new DecoderError(
        input,
        'invalid value for key ["two"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "two",
          key: "two",
          allErrors: true,
          child: new DecoderError(input.two, "must be a string")
        }
      ),
      new DecoderError(
        input,
        'invalid key ["three"] > must have length less than 5',
        {
          decoderName: "isDictionary",
          allErrors: true,
          location: "three",
          key: "three",
          child: new DecoderError("three", "must have length less than 5")
        }
      ),
      new DecoderError(
        input,
        'invalid value for key ["four"] > must be a string',
        {
          decoderName: "isDictionary",
          location: "four",
          key: "four",
          allErrors: true,
          child: new DecoderError(input.four, "must be a string")
        }
      ),
      new DecoderError(
        input,
        'invalid key ["a longer key"] > must have length less than 5',
        {
          decoderName: "isDictionary",
          allErrors: true,
          location: '["a longer key"]',
          key: "a longer key",
          child: new DecoderError(
            "a longer key",
            "must have length less than 5"
          )
        }
      )
    ]);
  }
});

runTests();
