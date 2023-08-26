// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright 2023 Yoshiya Hinosawa. All rights reserved. MIT license.
// Copyright 2017 Alizain Feerasta. All rights reserved. MIT license.

import { FakeTime } from "../testing/time.ts";
import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "../assert/mod.ts";

import * as ULID from "./mod.ts";
const ulid = ULID.factory();

Deno.test("ulid", async (t) => {
  await t.step("prng", async (t) => {
    const prng = ULID.detectPrng();

    await t.step("should produce a number", () => {
      assertEquals(false, isNaN(prng()));
    });

    await t.step("should be between 0 and 1", () => {
      const num = prng();
      assert(num >= 0 && num <= 1);
    });
  });

  await t.step("incremenet base32", async (t) => {
    await t.step("increments correctly", () => {
      assertEquals("A109D", ULID.incrementBase32("A109C"));
    });

    await t.step("carries correctly", () => {
      assertEquals("A1Z00", ULID.incrementBase32("A1YZZ"));
    });

    await t.step("double increments correctly", () => {
      assertEquals(
        "A1Z01",
        ULID.incrementBase32(ULID.incrementBase32("A1YZZ")),
      );
    });

    await t.step("throws when it cannot increment", () => {
      assertThrows(() => {
        ULID.incrementBase32("ZZZ");
      });
    });
  });

  await t.step("randomChar", async (t) => {
    const sample: Record<string, number> = {};
    const prng = ULID.detectPrng();

    for (let x = 0; x < 320000; x++) {
      const char = String(ULID.randomChar(prng)); // for if it were to ever return undefined
      if (sample[char] === undefined) {
        sample[char] = 0;
      }
      sample[char] += 1;
    }

    await t.step("should never return undefined", () => {
      assertEquals(undefined, sample["undefined"]);
    });

    await t.step("should never return an empty string", () => {
      assertEquals(undefined, sample[""]);
    });
  });

  await t.step("encodeTime", async (t) => {
    await t.step("should return expected encoded result", () => {
      assertEquals("01ARYZ6S41", ULID.encodeTime(1469918176385, 10));
    });

    await t.step("should change length properly", () => {
      assertEquals("0001AS99AA60", ULID.encodeTime(1470264322240, 12));
    });

    await t.step("should truncate time if not enough length", () => {
      assertEquals("AS4Y1E11", ULID.encodeTime(1470118279201, 8));
    });

    await t.step("should throw an error", async (t) => {
      await t.step("if time greater than (2 ^ 48) - 1", () => {
        assertThrows(() => {
          ULID.encodeTime(Math.pow(2, 48), 8);
        }, Error);
      });

      await t.step("if time is not a number", () => {
        assertThrows(() => {
          // deno-lint-ignore no-explicit-any
          ULID.encodeTime("test" as any, 3);
        }, Error);
      });

      await t.step("if time is infinity", () => {
        assertThrows(() => {
          ULID.encodeTime(Infinity);
        }, Error);
      });

      await t.step("if time is negative", () => {
        assertThrows(() => {
          ULID.encodeTime(-1);
        }, Error);
      });

      await t.step("if time is a float", () => {
        assertThrows(() => {
          ULID.encodeTime(100.1);
        }, Error);
      });
    });
  });

  await t.step("encodeRandom", async (t) => {
    const prng = ULID.detectPrng();

    await t.step("should return correct length", () => {
      assertEquals(12, ULID.encodeRandom(12, prng).length);
    });
  });

  await t.step("decodeTime", async (t) => {
    await t.step("should return correct timestamp", () => {
      const timestamp = Date.now();
      const id = ulid(timestamp);
      assertEquals(timestamp, ULID.decodeTime(id));
    });

    await t.step("should accept the maximum allowed timestamp", () => {
      assertEquals(
        281474976710655,
        ULID.decodeTime("7ZZZZZZZZZZZZZZZZZZZZZZZZZ"),
      );
    });

    await t.step("should reject", async (t) => {
      await t.step("malformed strings of incorrect length", () => {
        assertThrows(() => {
          ULID.decodeTime("FFFF");
        }, Error);
      });

      await t.step("strings with timestamps that are too high", () => {
        assertThrows(() => {
          ULID.decodeTime("80000000000000000000000000");
        }, Error);
      });

      await t.step("invalid character", () => {
        assertThrows(() => {
          ULID.decodeTime("&1ARZ3NDEKTSV4RRFFQ69G5FAV");
        }, Error);
      });
    });
  });

  await t.step("ulid", async (t) => {
    await t.step("should return correct length", () => {
      assertEquals(26, ulid().length);
    });

    await t.step(
      "should return expected encoded time component result",
      () => {
        assertEquals("01ARYZ6S41", ulid(1469918176385).substring(0, 10));
      },
    );
  });

  await t.step("monotonicity", async (t) => {
    function stubbedPrng() {
      return 0.96;
    }

    await t.step("without seedTime", async (t) => {
      const stubbedUlid = ULID.monotonicFactory(stubbedPrng);

      const time = new FakeTime(1469918176385);

      await t.step("first call", () => {
        assertEquals("01ARYZ6S41YYYYYYYYYYYYYYYY", stubbedUlid());
      });

      await t.step("second call", () => {
        assertEquals("01ARYZ6S41YYYYYYYYYYYYYYYZ", stubbedUlid());
      });

      await t.step("third call", () => {
        assertEquals("01ARYZ6S41YYYYYYYYYYYYYYZ0", stubbedUlid());
      });

      await t.step("fourth call", () => {
        assertEquals("01ARYZ6S41YYYYYYYYYYYYYYZ1", stubbedUlid());
      });

      time.restore();
    });

    await t.step("with seedTime", async (t) => {
      const stubbedUlid = ULID.monotonicFactory(stubbedPrng);

      await t.step("first call", () => {
        assertEquals("01ARYZ6S41YYYYYYYYYYYYYYYY", stubbedUlid(1469918176385));
      });

      await t.step("second call with the same", () => {
        assertStrictEquals(
          "01ARYZ6S41YYYYYYYYYYYYYYYZ",
          stubbedUlid(1469918176385),
        );
      });

      await t.step("third call with less than", () => {
        assertEquals("01ARYZ6S41YYYYYYYYYYYYYYZ0", stubbedUlid(100000000));
      });

      await t.step("fourth call with even more less than", () => {
        assertEquals("01ARYZ6S41YYYYYYYYYYYYYYZ1", stubbedUlid(10000));
      });

      await t.step("fifth call with 1 greater than", () => {
        assertEquals("01ARYZ6S42YYYYYYYYYYYYYYYY", stubbedUlid(1469918176386));
      });
    });
  });
});
