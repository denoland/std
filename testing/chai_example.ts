// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * An example of using [ChaiJs](https://www.chaijs.com/) with `Deno.test()`.
 *
 * Run this example with:
 *
 * ```shellsession
 * $ deno test ./testing/chai_example.ts
 * ```
 *
 * @module
 */

import chai from "https://cdn.skypack.dev/chai@4.3.4?dts";

const foo = "bar";
const beverages = { tea: ["chai", "matcha", "oolong"] };

Deno.test("we can make chai assertions", () => {
  const assert = chai.assert;

  assert.typeOf(foo, "string"); // without optional message
  assert.typeOf(foo, "string", "foo is a string"); // with optional message
  assert.equal(foo, "bar", "foo equal `bar`");
  assert.lengthOf(foo, 3, "foo`s value has a length of 3");
  assert.lengthOf(beverages.tea, 3, "beverages has 3 types of tea");
});

Deno.test("we can make chai expectations", () => {
  const expect = chai.expect;

  expect(foo).to.be.a("string");
  expect(foo).to.equal("bar");
  expect(foo).to.have.lengthOf(3);
  expect(beverages).to.have.property("tea").with.lengthOf(3);
});

Deno.test("we can use chai should style", () => {
  chai.should();

  foo.should.be.a("string");
  foo.should.equal("bar");
  foo.should.have.lengthOf(3);
  beverages.should.have.property("tea").with.lengthOf(3);
});
