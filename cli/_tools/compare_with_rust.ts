// Copyright 2018-2026 the Deno authors. MIT license.
// Run this test with `deno test --unstable-ffi -A compare_with_rust.ts`

import { unicodeWidth } from "../unicode_width.ts";
import { fromFileUrl } from "../../path/mod.ts";
import fc from "npm:fast-check@3.8.0";

// Note: This test is optional. It requires the Rust code to be compiled locally
Deno.test("fast-check equality with unicode_width Rust crate", async (t) => {
  const libName = ({
    darwin: "libunicode_width_crate.dylib",
    linux: "libunicode_width_crate.so",
    windows: "libunicode_width_crate.dll",
    // deno-lint-ignore no-explicit-any
  } as any)[Deno.build.os];
  const libPath = fromFileUrl(
    import.meta.resolve(
      `../testdata/unicode_width_crate/target/debug/${libName}`,
    ),
  );

  const toCString = (str: string) => new TextEncoder().encode(str + "\0");

  // @ts-ignore type-check errors if unavailable due to lack of --unstable-ffi flag
  let dylib: Deno.DynamicLibrary<{
    unicode_width: { parameters: ["buffer"]; result: "usize" };
  }>;

  try {
    dylib = Deno.dlopen(libPath, {
      unicode_width: { parameters: ["buffer"], result: "usize" },
    });

    for (
      const arbitrary of [
        "string",
        "unicodeString",
        "fullUnicodeString",
      ] as const
    ) {
      await t.step({
        name: `fc.${arbitrary}()`,
        fn() {
          // To avoid esm.sh statically analyzed
          fc.assert(
            fc.property(
              fc[arbitrary](),
              // JSON stringify to allow "\0" chars to cross FFI boundary in a null-terminated string
              // deno-lint-ignore no-explicit-any
              (str: any) =>
                unicodeWidth(str) ===
                  Number(
                    dylib.symbols.unicode_width(toCString(JSON.stringify(str))),
                  ),
            ),
          );
        },
      });
    }
  } finally {
    // deno-lint-ignore no-extra-non-null-assertion
    dylib!?.close();
  }
});
