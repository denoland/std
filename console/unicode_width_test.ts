// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { unicodeWidth } from "./unicode_width.ts";
import { assertEquals } from "../testing/asserts.ts";
import { fromFileUrl } from "../path/mod.ts";
import fc from "https://esm.sh/fast-check@3.8.0";

Deno.test("stringWidth", async (t) => {
  await t.step("ASCII", () => {
    const lorem =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    assertEquals(unicodeWidth(lorem), lorem.length);
  });

  await t.step("CJK", () => {
    const qianZiWen =
      "天地玄黃宇宙洪荒日月盈昃辰宿列張寒來暑往秋收冬藏閏餘成歲律呂調陽雲騰致雨露結爲霜金生麗水玉出崑岡劍號巨闕珠稱夜光果珍李柰菜重芥薑海鹹河淡鱗潛羽翔龍師火帝鳥官人皇始制文字乃服衣裳推位讓國有虞陶唐弔民伐罪周發殷湯坐朝問道垂拱平章愛育黎首臣伏戎羌遐邇壹體率賓歸王鳴鳳在樹白駒食場化被草木賴及萬方蓋此身髮四大五常恭惟鞠養豈敢毀傷女慕貞絜男效才良知過必改得能莫忘罔談彼短靡恃己長信使可覆器欲難量墨悲絲淬詩讚羔羊";

    assertEquals(unicodeWidth(qianZiWen), qianZiWen.length * 2);
  });

  await t.step("Unicode normalization", async (t) => {
    const str = "á";

    await t.step("NFC", () => {
      const nfc = str.normalize("NFC");

      assertEquals(nfc.length, 1);
      assertEquals(unicodeWidth(nfc), 1);
    });

    await t.step("NFD", () => {
      const nfd = str.normalize("NFD");

      assertEquals(nfd.length, 2);
      assertEquals(unicodeWidth(nfd), 1);
    });
  });
});

Deno.test("fast-check equality with unicode_width Rust crate", async (t) => {
  const libPath = fromFileUrl(
    import.meta.resolve(
      "./testdata/unicode_width_crate/target/debug/libunicode_width_crate.so",
    ),
  );

  let ignore = false;

  const toCString = (str: string) => new TextEncoder().encode(str + "\0");

  // @ts-ignore type-check errors if unavailable due to lack of --unstable flag
  let dylib: Deno.DynamicLibrary<{
    unicode_width: { parameters: ["buffer"]; result: "usize" };
  }>;

  try {
    try {
      // @ts-ignore type-check errors if unavailable due to lack of --unstable flag
      dylib = Deno.dlopen(libPath, {
        unicode_width: { parameters: ["buffer"], result: "usize" },
      });
    } catch {
      // skip these tests if Rust code hasn't been compiled locally
      ignore = true;
    }

    for (
      const arbitrary of [
        "string",
        "unicodeString",
        "fullUnicodeString",
      ] as const
    ) {
      await t.step({
        name: `fc.${arbitrary}()`,
        ignore,
        fn() {
          fc.assert(
            fc.property(
              fc[arbitrary](),
              // JSON stringify to allow "\0" chars to cross FFI boundary in a null-terminated string
              (str) =>
                unicodeWidth(str) ===
                  dylib.symbols.unicode_width(toCString(JSON.stringify(str))),
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
