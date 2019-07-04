// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runTests } from "../testing/mod.ts";
import {
  assertDecodeSuccess,
  assertDecoder,
  assertDecodeErrors
} from "./_testing_util.ts";
import { Decoder } from "./decoder.ts";
import { DecoderSuccess, DecoderError } from "./decoder_result.ts";
import { assertEquals, assertNotEquals } from "../testing/asserts.ts";
import { isObject } from "./is_object.ts";
import {
  stringDecoder,
  numberDecoder,
  booleanDecoder
} from "./_testing_util.ts";

/**
 * isObject()
 */

test(function initializes() {
  assertDecoder(isObject({}));
});

test(function noOptions() {
  const decoder = isObject({
    string: stringDecoder,
    number: numberDecoder,
    boolean: booleanDecoder
  });

  for (const item of [
    { string: "ste", number: 23, boolean: true },
    { string: "fead", number: -123.21, boolean: true },
    { string: "", number: 100.32, boolean: false }
  ]) {
    // isObject returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
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
    // isObject returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertNotEquals(decoder.decode(item), new DecoderSuccess(item));
    delete item[21];
    delete item["child"];
    delete item["square"];
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  for (const item of [0.123, true, null, undefined, "stead"]) {
    assertDecodeErrors({
      decoder: decoder,
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

  const obj1 = { string: "ste", number: 23 };
  assertDecodeErrors({
    decoder: decoder,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg: `missing required key ["boolean"]`
      }
    ],
    count: 1
  });

  const obj2 = {
    string: "fdaf",
    boolean: false,
    square: ["box"],
    number: "324"
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg: `invalid value for key ["number"] > must be a number`
      }
    ],
    count: 1
  });

  const obj3 = {
    string: false,
    number: -123.21,
    boolean: "true",
    child: { string: "", number: 100.32, boolean: false }
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: `invalid value for key ["string"] > must be a string`
      }
    ],
    count: 1
  });
});

test(function optionAllErrors() {
  const decoder = isObject(
    {
      string: stringDecoder,
      number: numberDecoder,
      boolean: booleanDecoder
    },
    {
      allErrors: true
    }
  );

  for (const item of [
    { string: "ste", number: 23, boolean: true },
    { string: "fead", number: -123.21, boolean: true },
    { string: "", number: 100.32, boolean: false }
  ]) {
    // isObject returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
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
    // isObject returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertNotEquals(decoder.decode(item), new DecoderSuccess(item));
    delete item[21];
    delete item["child"];
    delete item["square"];
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  for (const item of [0.123, true, null, undefined, "stead"]) {
    assertDecodeErrors({
      decoder: decoder,
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

  const obj1 = { string: "ste", number: 23 };
  assertDecodeErrors({
    decoder: decoder,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg: `missing required key ["boolean"]`
      }
    ],
    count: 1
  });

  const obj2 = {
    string: "fdaf",
    boolean: "false",
    square: ["box"],
    number: "324"
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg: `invalid value for key ["boolean"] > must be a boolean`
      },
      {
        input: obj2,
        msg: `invalid value for key ["number"] > must be a number`
      }
    ],
    count: 2
  });

  const obj3 = {
    string: false,
    number: -123.21,
    boolean: "true",
    child: { string: "", number: 100.32, boolean: false }
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: `invalid value for key ["string"] > must be a string`
      },
      {
        input: obj3,
        msg: `invalid value for key ["boolean"] > must be a boolean`
      }
    ],
    count: 2
  });
});

test(function optionNoExcessProperties() {
  const decoder = isObject(
    {
      string: stringDecoder,
      number: numberDecoder,
      boolean: booleanDecoder
    },
    {
      noExcessProperties: true
    }
  );

  for (const item of [
    { string: "ste", number: 23, boolean: true },
    { string: "fead", number: -123.21, boolean: true },
    { string: "", number: 100.32, boolean: false }
  ]) {
    // isObject returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  const obja = { string: "ste", number: 23, boolean: true, 21: 32 };
  assertDecodeErrors({
    decoder: decoder,
    input: obja,
    expected: [
      {
        input: obja,
        msg: `unknown key ["21"]`
      }
    ],
    count: 1
  });

  const objb = {
    string: "fead",
    number: -123.21,
    boolean: true,
    child: { string: "", number: 100.32, boolean: false }
  };
  assertDecodeErrors({
    decoder: decoder,
    input: objb,
    expected: [
      {
        input: objb,
        msg: `unknown key ["child"]`
      }
    ],
    count: 1
  });

  const objc = { string: "fdaf", number: 324, boolan: false, square: ["box"] };
  assertDecodeErrors({
    decoder: decoder,
    input: objc,
    expected: [
      {
        input: objc,
        msg: `unknown key ["boolan"]`
      }
    ],
    count: 1
  });

  const obj1 = { string: "ste", number: 23 };
  assertDecodeErrors({
    decoder: decoder,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg: `missing required key ["boolean"]`
      }
    ],
    count: 1
  });

  const obj2 = {
    string: "fdaf",
    boolean: false,
    square: ["box"],
    number: "324"
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg: `unknown key ["square"]`
      }
    ],
    count: 1
  });

  const obj3 = {
    string: false,
    number: -123.21,
    boolean: "true",
    child: { string: "", number: 100.32, boolean: false }
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: `unknown key ["child"]`
      }
    ],
    count: 1
  });
});

test(function optionNoExcessPropertiesAllErrors() {
  const decoder = isObject(
    {
      string: stringDecoder,
      number: numberDecoder,
      boolean: booleanDecoder
    },
    {
      noExcessProperties: true,
      allErrors: true
    }
  );

  for (const item of [
    { string: "ste", number: 23, boolean: true },
    { string: "fead", number: -123.21, boolean: true },
    { string: "", number: 100.32, boolean: false }
  ]) {
    // isObject returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  const obja = { string: "ste", number: 23, boolean: true, 21: 32 };
  assertDecodeErrors({
    decoder: decoder,
    input: obja,
    expected: [
      {
        input: obja,
        msg: `unknown key ["21"]`
      }
    ],
    count: 1
  });

  const objb = {
    string: "fead",
    number: -123.21,
    boolean: true,
    child: { string: "", number: 100.32, boolean: false }
  };
  assertDecodeErrors({
    decoder: decoder,
    input: objb,
    expected: [
      {
        input: objb,
        msg: `unknown key ["child"]`
      }
    ],
    count: 1
  });

  const objc = { string: "fdaf", number: 324, boolan: false, square: ["box"] };
  assertDecodeErrors({
    decoder: decoder,
    input: objc,
    expected: [
      {
        input: objc,
        msg: `unknown key ["boolan"]`
      },
      {
        input: objc,
        msg: `unknown key ["square"]`
      },
      {
        input: objc,
        msg: `missing required key ["boolean"]`
      }
    ],
    count: 3
  });

  const obj1 = { string: "ste", number: 23 };
  assertDecodeErrors({
    decoder: decoder,
    input: obj1,
    expected: [
      {
        input: obj1,
        msg: `missing required key ["boolean"]`
      }
    ],
    count: 1
  });

  const obj2 = {
    string: "fdaf",
    boolean: false,
    square: ["box"],
    number: "324"
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj2,
    expected: [
      {
        input: obj2,
        msg: `unknown key ["square"]`
      },
      {
        input: obj2,
        msg: `invalid value for key ["number"] > must be a number`
      }
    ],
    count: 2
  });

  const obj3 = {
    string: false,
    number: -123.21,
    boolean: "true",
    child: { string: "", number: 100.32, boolean: false }
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obj3,
    expected: [
      {
        input: obj3,
        msg: `unknown key ["child"]`
      },
      {
        input: obj3,
        msg: `invalid value for key ["string"] > must be a string`
      },
      {
        input: obj3,
        msg: `invalid value for key ["boolean"] > must be a boolean`
      }
    ],
    count: 3
  });
});

test(function nestedObject() {
  const decoder = isObject(
    {
      string: stringDecoder,
      number: numberDecoder,
      boolean: booleanDecoder,
      child: isObject(
        {
          string: stringDecoder,
          number: numberDecoder,
          boolean: booleanDecoder
        },
        {
          allErrors: true
        }
      )
    },
    {
      noExcessProperties: true,
      allErrors: true
    }
  );

  for (const item of [
    {
      string: "ste",
      number: 23,
      boolean: true,
      child: {
        string: "",
        deno: Symbol("lang"),
        number: 2342343,
        boolean: false
      }
    },
    {
      string: "feAd",
      number: -123.21,
      boolean: true,
      child: {
        string: "fDFEDcd",
        number: -343.3434,
        nullable: null,
        boolean: true
      }
    },
    {
      string: "",
      number: 100.32,
      boolean: false,
      child: { string: "f43df454", number: 23, boolean: true, square: ["box"] }
    }
  ]) {
    // isObject returns a new object so we can't use the `expected` option
    assertDecodeSuccess(decoder, item);
    assertNotEquals(decoder.decode(item), new DecoderSuccess(item));
    delete item.child.deno;
    delete item.child.nullable;
    delete item.child.square;
    assertEquals(decoder.decode(item), new DecoderSuccess(item));
  }

  const obja = {
    string: "ste",
    numbr: 23,
    boolean: true,
    child: { strig: "", deno: Symbol("lang"), number: 2342343, boolean: false }
  };
  assertDecodeErrors({
    decoder: decoder,
    input: obja,
    expected: [
      {
        input: obja,
        msg: `unknown key ["numbr"]`
      },
      {
        input: obja,
        msg: `missing required key ["number"]`
      },
      {
        input: obja,
        msg: `invalid value for key ["child"] > missing required key ["string"]`
      }
    ],
    count: 3
  });

  const objb = {
    string: "feAd",
    number: -123.21,
    boolean: true,
    child: { string: "fDFEDcd", number: "-343.3434", boolean: true }
  };
  assertDecodeErrors({
    decoder: decoder,
    input: objb,
    expected: [
      {
        input: objb,
        msg: `invalid value for key ["child"] > invalid value for key ["number"] > must be a number`
      }
    ],
    count: 1
  });

  const objc = {
    string: Symbol("f43df454"),
    number: 100.32,
    boolean: false,
    child: {
      string: Symbol("f43df454"),
      number: 23,
      boolean: {},
      square: ["box"]
    }
  };
  assertDecodeErrors({
    decoder: decoder,
    input: objc,
    expected: [
      {
        input: objc,
        msg: `invalid value for key ["string"] > must be a string`,
        location: "string",
        path: ["string"]
      },
      {
        input: objc,
        msg: `invalid value for key ["child"] > invalid value for key ["string"] > must be a string`,
        location: "child.string",
        path: ["child", "string"]
      },
      {
        input: objc,
        msg: `invalid value for key ["child"] > invalid value for key ["boolean"] > must be a boolean`,
        location: "child.boolean",
        path: ["child", "boolean"]
      }
    ],
    count: 3
  });
});

runTests();
