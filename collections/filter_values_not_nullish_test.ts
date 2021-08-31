import { filterValuesNotNullish } from "./filter_values_not_nullish.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test("[collections/filterValuesNotNullish] Example code", () => {
  const values = {
    x: null,
    y: undefined,
    z: "hi",
  };

  const actual = filterValuesNotNullish(values);

  assertEquals(actual, { z: "hi" });
});

Deno.test("[collections/filterValuesNotNullish] No mutation", () => {
  const values = {
    x: null,
    y: undefined,
    z: "hi",
  };

  const actual = filterValuesNotNullish(values);

  assertEquals(actual, { z: "hi" });
  assertEquals(values, {
    x: null,
    y: undefined,
    z: "hi",
  });
});

Deno.test("[collections/filterValuesNotNullish] Empty input", () => {
  const values = {};

  const actual = filterValuesNotNullish(values);

  assertEquals(actual, {});
});

Deno.test("[collections/filterValuesNotNullish] No nullish values returns the same object", () => {
  const values = {
    x: 32,
    y: 40,
    z: "hello",
  };

  const actual = filterValuesNotNullish(values);

  assertEquals(actual, values);
});

Deno.test("[collections/filterValuesNotNullish] All values being nullish returns empty object", () => {
  const values = {
    x: null,
    y: undefined,
    z: undefined,
    four: null,
  };

  const actual = filterValuesNotNullish(values);

  assertEquals(actual, {});
});
