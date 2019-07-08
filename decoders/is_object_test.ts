// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodesToSuccess,
  assertDecoder,
  assertDecodesToErrors,
  booleanPromiseDecoder,
  numberPromiseDecoder
} from "./test_util.ts";
import { PromiseDecoder } from "./decoder.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";
import { assertEquals, assertNotEquals } from "../testing/asserts.ts";
import { isObject } from "./is_object.ts";
import { stringDecoder, numberDecoder } from "./test_util.ts";

/**
 * isObject()
 */

test({
  name: "init isObject()",
  fn: (): void => {
    assertDecoder(isObject({}));
  }
});

test({
  name: "isObject({stringDecoder, numberDecoder})",
  fn: (): void => {
    const decoder = isObject({
      string: stringDecoder,
      number: numberDecoder
    });

    for (const item of [
      { string: "ste", number: 23 },
      { string: "fead", number: -123.21 },
      { string: "", number: 100.32 }
    ]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [
      { string: "ste", number: 23, boolean: true, 21: 32 },
      {
        string: "fead",
        number: -123.21,
        boolean: true,
        child: { string: "", number: 100.32, boolean: false }
      },
      { string: "fdaf", number: 324, boolean: false, square: ["box"] }
    ]) {
      assertNotEquals(decoder.decode(item), new DecoderSuccess(item));
      delete item[21];
      delete item["child"];
      delete item["square"];
      delete item["boolean"];
      assertEquals(decoder.decode(item), new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined, "stead"]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isObject"
        })
      ]);
    }

    const obj1 = { string: "ste" };
    assertDecodesToErrors(decoder, obj1, [
      new DecoderError(obj1, 'missing required key ["number"]', {
        decoderName: "isObject",
        child: new DecoderError(undefined, "must be a number")
      })
    ]);

    const obj2 = {
      string: "fdaf",
      boolean: false,
      square: ["box"],
      number: "324"
    };
    assertDecodesToErrors(decoder, obj2, [
      new DecoderError(
        obj2,
        'invalid value for key ["number"] > must be a number',
        {
          decoderName: "isObject",
          location: "number",
          key: "number",
          child: new DecoderError(obj2.number, "must be a number")
        }
      )
    ]);
  }
});

test({
  name: "isObject({stringDecoder, numberDecoder}, {allErrors: true})",
  fn: (): void => {
    const decoder = isObject(
      {
        string: stringDecoder,
        number: numberDecoder
      },
      {
        allErrors: true
      }
    );

    for (const item of [
      { string: "ste", number: 23 },
      { string: "fead", number: -123.21 },
      { string: "", number: 100.32 }
    ]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [
      { string: "ste", number: 23, boolean: true, 21: 32 },
      {
        string: "fead",
        number: -123.21,
        boolean: true,
        child: { string: "", number: 100.32, boolean: false }
      },
      { string: "fdaf", number: 324, boolean: false, square: ["box"] }
    ]) {
      assertNotEquals(decoder.decode(item), new DecoderSuccess(item));
      delete item[21];
      delete item["child"];
      delete item["square"];
      delete item["boolean"];
      assertEquals(decoder.decode(item), new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined, "stead"]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isObject",
          allErrors: true
        })
      ]);
    }

    const obj1 = { string: "ste" };
    assertDecodesToErrors(decoder, obj1, [
      new DecoderError(obj1, 'missing required key ["number"]', {
        decoderName: "isObject",
        allErrors: true,
        child: new DecoderError(undefined, "must be a number")
      })
    ]);

    const obj2 = {
      string: {},
      square: ["box"],
      number: "324"
    };
    assertDecodesToErrors(decoder, obj2, [
      new DecoderError(
        obj2,
        'invalid value for key ["number"] > must be a number',
        {
          decoderName: "isObject",
          location: "number",
          key: "number",
          allErrors: true,
          child: new DecoderError(obj2.number, "must be a number")
        }
      ),
      new DecoderError(
        obj2,
        'invalid value for key ["string"] > must be a string',
        {
          decoderName: "isObject",
          location: "string",
          key: "string",
          allErrors: true,
          child: new DecoderError(obj2.string, "must be a string")
        }
      )
    ]);
  }
});

test({
  name: "isObject({stringDecoder, numberDecoder}, {noExcessProperties: true})",
  fn: (): void => {
    const decoder = isObject(
      {
        string: stringDecoder,
        number: numberDecoder
      },
      {
        noExcessProperties: true
      }
    );

    for (const item of [
      { string: "ste", number: 23 },
      { string: "fead", number: -123.21 },
      { string: "", number: 100.32 }
    ]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined, "stead"]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isObject"
        })
      ]);
    }

    const obj1 = { string: "ste" };
    assertDecodesToErrors(decoder, obj1, [
      new DecoderError(obj1, 'missing required key ["number"]', {
        decoderName: "isObject",
        child: new DecoderError(undefined, "must be a number")
      })
    ]);

    const obj2 = { string: "ste", number: 23, boolean: true };
    assertDecodesToErrors(decoder, obj2, [
      new DecoderError(obj2, 'unknown key ["boolean"]', {
        decoderName: "isObject",
        location: "boolean",
        key: "boolean"
      })
    ]);
  }
});

test({
  name:
    "isObject({stringDecoder, numberDecoder}, " +
    "{noExcessProperties: true, allErrors: true})",
  fn: (): void => {
    const decoder = isObject(
      {
        string: stringDecoder,
        number: numberDecoder
      },
      {
        noExcessProperties: true,
        allErrors: true
      }
    );

    for (const item of [
      { string: "ste", number: 23 },
      { string: "fead", number: -123.21 },
      { string: "", number: 100.32 }
    ]) {
      assertDecodesToSuccess(decoder, item, new DecoderSuccess(item));
    }

    for (const item of [0.123, true, null, undefined, "stead"]) {
      assertDecodesToErrors(decoder, item, [
        new DecoderError(item, "must be a non-null object", {
          decoderName: "isObject",
          allErrors: true
        })
      ]);
    }

    const obj1 = { number: "23", boolean: true };
    assertDecodesToErrors(decoder, obj1, [
      new DecoderError(
        obj1,
        'invalid value for key ["number"] > must be a number',
        {
          decoderName: "isObject",
          location: "number",
          key: "number",
          allErrors: true,
          child: new DecoderError(obj1.number, "must be a number")
        }
      ),
      new DecoderError(obj1, 'unknown key ["boolean"]', {
        decoderName: "isObject",
        location: "boolean",
        key: "boolean",
        allErrors: true
      }),
      new DecoderError(obj1, 'missing required key ["string"]', {
        decoderName: "isObject",
        allErrors: true,
        child: new DecoderError(undefined, "must be a string")
      })
    ]);
  }
});

test({
  name:
    "isObject({stringDecoder, isObject({numberDecoder})}, " +
    "{noExcessProperties: true, allErrors: true})",
  fn: (): void => {
    const decoder = isObject(
      {
        string: stringDecoder,
        object: isObject({ number: numberDecoder })
      },
      {
        noExcessProperties: true,
        allErrors: true
      }
    );

    const obj1 = {
      string: "ste",
      object: {
        deno: Symbol("lang"),
        number: 2342343
      }
    };

    assertNotEquals(decoder.decode(obj1), new DecoderSuccess(obj1));
    delete obj1.object.deno;
    assertEquals(decoder.decode(obj1), new DecoderSuccess(obj1));

    const obj2 = {
      strig: "ste",
      object: { number: 2342343 }
    };
    assertDecodesToErrors(decoder, obj2, [
      new DecoderError(obj2, 'unknown key ["strig"]', {
        decoderName: "isObject",
        location: "strig",
        key: "strig",
        allErrors: true
      }),
      new DecoderError(obj2, 'missing required key ["string"]', {
        decoderName: "isObject",
        allErrors: true,
        child: new DecoderError(undefined, "must be a string")
      })
    ]);

    const obj3 = {
      string: true,
      object: { number: "2342343" }
    };
    assertDecodesToErrors(decoder, obj3, [
      new DecoderError(
        obj3,
        'invalid value for key ["string"] > must be a string',
        {
          decoderName: "isObject",
          location: "string",
          key: "string",
          allErrors: true,
          child: new DecoderError(obj3.string, "must be a string")
        }
      ),
      new DecoderError(
        obj3,
        'invalid value for key ["object"] > invalid value for key ["number"] ' +
          "> must be a number",
        {
          decoderName: "isObject",
          location: "object.number",
          key: "object",
          allErrors: true,
          child: new DecoderError(
            obj3.object,
            'invalid value for key ["number"] > must be a number',
            {
              decoderName: "isObject",
              location: "number",
              key: "number",
              child: new DecoderError(obj3.object.number, "must be a number")
            }
          )
        }
      )
    ]);
  }
});

test({
  name: "async isObject({stringDecoder, isObject({numberDecoder})})",
  fn: async (): Promise<void> => {
    const decoder = isObject({
      string: stringDecoder,
      object: isObject({ boolean: booleanPromiseDecoder })
    });

    assertEquals(decoder instanceof PromiseDecoder, true);

    const obj1 = {
      string: "ste",
      object: {
        deno: Symbol("lang"),
        boolean: true
      }
    };

    assertEquals(decoder.decode(obj1) instanceof Promise, true);
    assertNotEquals(await decoder.decode(obj1), new DecoderSuccess(obj1));
    delete obj1.object.deno;
    assertEquals(await decoder.decode(obj1), new DecoderSuccess(obj1));

    const obj2 = {
      strig: "ste",
      object: { boolean: true }
    };
    await assertDecodesToErrors(decoder, obj2, [
      new DecoderError(obj2, 'missing required key ["string"]', {
        decoderName: "isObject",
        child: new DecoderError(undefined, "must be a string")
      })
    ]);

    const obj3 = {
      string: true,
      object: { boolean: "2342343" }
    };
    await assertDecodesToErrors(decoder, obj3, [
      new DecoderError(
        obj3,
        'invalid value for key ["string"] > must be a string',
        {
          decoderName: "isObject",
          location: "string",
          key: "string",
          child: new DecoderError(obj3.string, "must be a string")
        }
      )
    ]);
  }
});

test({
  name:
    "async isObject({stringDecoder, isObject({numberDecoder})}, " +
    "{noExcessProperties: true, allErrors: true})",
  fn: async (): Promise<void> => {
    const decoder = isObject(
      {
        string: stringDecoder,
        object: isObject({ number: numberPromiseDecoder })
      },
      {
        noExcessProperties: true,
        allErrors: true
      }
    );

    assertEquals(decoder instanceof PromiseDecoder, true);

    const obj1 = {
      string: "ste",
      object: {
        deno: Symbol("lang"),
        number: 2342343
      }
    };

    assertEquals(decoder.decode(obj1) instanceof Promise, true);
    assertNotEquals(await decoder.decode(obj1), new DecoderSuccess(obj1));
    delete obj1.object.deno;
    assertEquals(await decoder.decode(obj1), new DecoderSuccess(obj1));

    const obj2 = {
      strig: "ste",
      object: { number: 2342343 }
    };
    await assertDecodesToErrors(decoder, obj2, [
      new DecoderError(obj2, 'unknown key ["strig"]', {
        decoderName: "isObject",
        location: "strig",
        key: "strig",
        allErrors: true
      }),
      new DecoderError(obj2, 'missing required key ["string"]', {
        decoderName: "isObject",
        allErrors: true,
        child: new DecoderError(undefined, "must be a string")
      })
    ]);

    const obj3 = {
      string: true,
      object: { number: "2342343" }
    };
    await assertDecodesToErrors(decoder, obj3, [
      new DecoderError(
        obj3,
        'invalid value for key ["string"] > must be a string',
        {
          decoderName: "isObject",
          location: "string",
          key: "string",
          allErrors: true,
          child: new DecoderError(obj3.string, "must be a string")
        }
      ),
      new DecoderError(
        obj3,
        'invalid value for key ["object"] > ' +
          'invalid value for key ["number"] > must be a number',
        {
          decoderName: "isObject",
          location: "object.number",
          key: "object",
          allErrors: true,
          child: new DecoderError(
            obj3.object,
            'invalid value for key ["number"] > must be a number',
            {
              decoderName: "isObject",
              location: "number",
              key: "number",
              child: new DecoderError(obj3.object.number, "must be a number")
            }
          )
        }
      )
    ]);
  }
});

runTests();
