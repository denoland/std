// Copyright 2018-2025 the Deno authors. MIT license.
// deno-lint-ignore-file deno-style-guide/naming-convention
import { assertEquals } from "@std/assert/equals";
import { stubProperty } from "./unstable_stub_property.ts";
import { assertThrows } from "@std/assert/throws";

const PROP = "foo";
const ORIGINAL_VALUE = "bar";
const STUBBED_VALUE = "baz";

type Obj = { [PROP]?: string };

Deno.test("stubProperty() stubs properties and returns them to their original values", () => {
  const descriptors: (TypedPropertyDescriptor<string> | undefined)[] = [
    undefined,
    {
      get: () => ORIGINAL_VALUE,
      configurable: true,
    },
    { value: ORIGINAL_VALUE, writable: true, configurable: true },
    { value: ORIGINAL_VALUE, writable: true, configurable: false },
    { value: ORIGINAL_VALUE, writable: false, configurable: true },
  ];

  const Empty = () => class Empty {};
  const Val = () =>
    class Val {
      [PROP] = ORIGINAL_VALUE;
    };
  const Get = () =>
    class Get {
      get [PROP]() {
        return ORIGINAL_VALUE;
      }
    };

  const objCreators: (() => Obj)[] = [
    () => ({}),
    () => ({ [PROP]: ORIGINAL_VALUE }),
    () => {
      const o: Obj = {};
      o[PROP] = ORIGINAL_VALUE;
      return o;
    },
    () => new (Val())(),
    () => new (Get())(),
    () => new (Empty())(),
    () => Val().prototype,
    () => Get().prototype,
    () => Empty().prototype,
    () => Object.create({ [PROP]: ORIGINAL_VALUE }),
  ];

  for (const getObj of objCreators) {
    for (const descriptor of descriptors) {
      const obj = getObj();
      if (descriptor != null) Object.defineProperty(obj, PROP, descriptor);

      const initialDescriptor = Object.getOwnPropertyDescriptor(obj, PROP);
      const initialValue = obj[PROP];

      {
        using _ = stubProperty(obj, PROP, STUBBED_VALUE);
        assertEquals(obj[PROP], STUBBED_VALUE);
      }

      assertEquals(obj[PROP], initialValue);
      assertEquals(
        Object.getOwnPropertyDescriptor(obj, PROP),
        initialDescriptor,
      );
    }
  }
});

Deno.test("stubProperty() runs setters", () => {
  const obj = new (class {
    #bar: string | -1 = -1;
    set foo(value: string) {
      this.#bar = value;
    }
    get foo(): string | -1 {
      return this.#bar;
    }
  })();

  {
    using _ = stubProperty(obj, "foo", "baz");
    assertEquals(obj.foo, "baz");
  }

  assertEquals(obj.foo, -1);

  obj.foo = "bar";
  {
    using _ = stubProperty(obj, "foo", "baz");
    assertEquals(obj.foo, "baz");
  }
  assertEquals(obj.foo, "bar");
});

Deno.test("stubProperty() sets and resets the property descriptor directly if no setter exists", () => {
  const obj = {
    get foo(): string | -1 {
      return -1;
    },
  };

  {
    using _ = stubProperty(obj, "foo", "baz");
    assertEquals(obj.foo, "baz");
  }

  assertEquals(obj.foo, -1);
});

Deno.test("stubProperty() sets and resets the property descriptor directly if the setter throws", () => {
  const obj = {
    set foo(_value: string) {
      throw new Error("!");
    },
    get foo(): string | -1 {
      return -1;
    },
  };

  {
    using _ = stubProperty(obj, "foo", "baz");
    assertEquals(obj.foo, "baz");
  }

  assertEquals(obj.foo, -1);
});

Deno.test("stubProperty() throws if property is not configurable or writable", () => {
  assertThrows(
    () =>
      stubProperty(
        Object.defineProperty(
          {} as Obj,
          PROP,
          { value: ORIGINAL_VALUE },
        ),
        PROP,
        STUBBED_VALUE,
      ),
    TypeError,
    'Cannot stub property "foo" because it is not configurable or writable.',
  );

  assertThrows(
    () =>
      stubProperty(
        Object.freeze({ [PROP]: ORIGINAL_VALUE } as Obj),
        PROP,
        STUBBED_VALUE,
      ),
    TypeError,
    'Cannot stub property "foo" because it is not configurable or writable.',
  );
});
