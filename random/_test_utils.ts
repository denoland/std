// Copyright 2018-2025 the Deno authors. MIT license.
// deno-lint-ignore-file no-explicit-any
import { platform } from "./_platform.ts";
import { disposableStack } from "../internal/_testing.ts";

/**
 * ```ts
 * type _NumberType = { [K in keyof DataView]: K extends `get${infer T}` ? T : never }
 * type NumberTypeName = _NumberType[keyof _NumberType]
 * ```
 */
const numberTypes = [
  "Int8",
  "Int16",
  "Int32",
  "BigInt64",
  "Uint8",
  "Uint16",
  "Uint32",
  "BigUint64",
  "Float16",
  "Float32",
  "Float64",
] as const;

export function mockLittleEndian(littleEndian: boolean) {
  // partial `DisposableStack` polyfill
  const stack = disposableStack();

  const originalLittleEndian = platform.littleEndian;

  stack.defer(() => {
    platform.littleEndian = originalLittleEndian;
  });

  for (const type of numberTypes) {
    const TypedArray = globalThis[`${type}Array`];

    const MockTypedArray = class extends TypedArray {
      // @ts-ignore missing super() call
      constructor(...args: any[]) {
        const target = new TypedArray(...args);
        const dv = new DataView(
          target.buffer,
          target.byteOffset,
          target.byteLength,
        );

        const proxy: any = new Proxy(target, {
          get(target, prop) {
            if (prop === Symbol.iterator) {
              return Array.prototype[Symbol.iterator];
            }

            if (typeof prop === "symbol" || /\D/.test(prop)) {
              const val = Reflect.get(target, prop, target);
              if (typeof val === "function") {
                return val.bind(target);
              }
              return val;
            }

            const i = Number(prop);
            return dv[`get${type}`](i * target.BYTES_PER_ELEMENT, littleEndian);
          },
          set(target, prop, val: number & bigint) {
            if (typeof prop === "symbol" || /\D/.test(prop)) {
              return Reflect.set(target, prop, val, target);
            }

            const i = Number(prop);
            dv[`set${type}`](i * target.BYTES_PER_ELEMENT, val, littleEndian);
            return true;
          },
        });

        proxy[Symbol.for("nodejs.util.inspect.custom")] = (
          _: any,
          args: any,
          inspect: typeof Deno.inspect,
        ) => {
          return `${
            littleEndian ? "LE" : "BE"
          }_${TypedArray.name}(${proxy.length}) ${inspect([...proxy], args)}`;
        };

        if (
          typeof args[0] === "object" &&
          (Symbol.iterator in args[0] || "length" in args[0])
        ) {
          for (let i = 0; i < target.length; ++i) {
            proxy[i] = target[i];
          }
        }

        return proxy;
      }

      static from(args: any[]) {
        return new this(Array.from(args));
      }
    };

    // @ts-ignore mock
    globalThis[`${type}Array`] = MockTypedArray;

    stack.defer(() => {
      // @ts-ignore restore mock
      globalThis[`${type}Array`] = TypedArray;
    });
  }

  platform.littleEndian = littleEndian;

  return stack;
}
