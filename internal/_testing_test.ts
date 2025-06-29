// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert/equals";
import { stubProperty } from "./_testing.ts";

Deno.test("stubProperty() stubs properties and returns them to their original values", () => {
  const prop = "foo";
  const originalValue = "bar";
  const stubbedValue = "baz";

  const descriptors: (TypedPropertyDescriptor<string> | undefined)[] = [
    undefined,
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
  ];

  const Empty = () => class Empty {};
  const Val = () =>
    class Val {
      [prop] = originalValue;
    };
  const Get = () =>
    class Get {
      get [prop]() {
        return originalValue;
      }
    };

  const objCreators: (() => { [prop]?: string })[] = [
    () => ({}),
    () => ({ [prop]: originalValue }),
    () => new (Val())(),
    () => new (Get())(),
    () => new (Empty())(),
    () => Val().prototype,
    () => Get().prototype,
    () => Empty().prototype,
    () => Object.create({ [prop]: originalValue }),
  ];

  for (const getObj of objCreators) {
    for (const descriptor of descriptors) {
      const obj = getObj();
      if (descriptor != null) Object.defineProperty(obj, prop, descriptor);

      const initialDescriptor = Object.getOwnPropertyDescriptor(obj, prop);
      const initialValue = obj[prop];

      {
        using _ = stubProperty(obj, prop, stubbedValue);

        assertEquals(obj[prop], stubbedValue);
      }

      assertEquals(obj[prop], initialValue);
      assertEquals(
        Object.getOwnPropertyDescriptor(obj, prop),
        initialDescriptor,
      );
    }
  }
});
