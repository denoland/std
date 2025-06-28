// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert/equals";
import { stubProperty } from "./_testing.ts";

Deno.test("stubProperty() stubs properties and returns them to their original values", async (t) => {
  const prop = "foo";
  const originalValue = "bar";
  const stubbedValue = "baz";

  const descriptors: (PropertyDescriptor | undefined)[] = [
    {
      get: () => originalValue,
      configurable: true,
    },
    {
      set: () => {},
      configurable: true,
    },
    { value: originalValue, writable: true, configurable: true },
    { value: originalValue, writable: true, configurable: false },
    { value: originalValue, writable: false, configurable: true },
    undefined,
  ];

  class Val {
    [prop] = originalValue;
  }
  class Get {
    get [prop]() {
      return originalValue;
    }
  }

  const objCreators: (() => { [prop]?: string })[] = [
    () => ({}),
    () => ({ [prop]: originalValue }),
    () => new Val(),
    () => new Get(),
    () => Object.create({ [prop]: originalValue }),
  ];

  for (const getObj of objCreators) {
    for (const descriptor of descriptors) {
      const obj = getObj();
      await t.step(JSON.stringify({ obj, descriptor }) ?? "undefined", () => {
        if (descriptor != null) Object.defineProperty(obj, prop, descriptor);
        const descriptorBefore = Object.getOwnPropertyDescriptor(obj, prop);
        const valBefore = obj[prop];

        {
          using _ = stubProperty(obj, prop, stubbedValue);

          assertEquals(obj[prop], stubbedValue);
        }
        assertEquals(obj[prop], valBefore);
        assertEquals(
          Object.getOwnPropertyDescriptor(obj, prop),
          descriptorBefore,
        );
      });
    }
  }
});
