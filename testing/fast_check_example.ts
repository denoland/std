// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Tests that run the fast-check property-based testing library in the Deno
 * runtime.
 *
 * See: https://github.com/dubzzz/fast-check
 *
 * This file contains all the 'simple' examples from the fast-check
 * repo (001-simple folder) using Deno.test for the test functions and
 * assertions from the Deno standard library. Missing type annotations
 * were also added to the original fast-check examples.
 *
 * Since the nested testing API is used, the tests need to be run with the
 * unstable flag as indicated in the command:
 *
 * ```shellsession
 * $ deno test --unstable ./testing/fast_check_example.ts
 * ```
 *
 * @module
 */

import fc from "https://cdn.skypack.dev/fast-check";
import { groupBy } from "../collections/group_by.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.90.0/testing/asserts.ts";

/********************** contains() *************************************/
const contains = (text: string, pattern: string): boolean =>
  text.indexOf(pattern) >= 0;

Deno.test("Can use fast-check to property test contains function", async (t) => {
  // string text always contains itself
  await t.step("should always contain itself", () => {
    fc.assert(fc.property(fc.string(), (text: string) => contains(text, text)));
  });
  // string a + b + c always contains b, whatever the values of a, b and c
  await t.step("should always contain its substrings", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.string(),
        (a: string, b: string, c: string) => {
          // Alternatively: no return statement and direct usage of expect or assert
          return contains(a + b + c, b);
        },
      ),
    );
  });
});

/*********************** decomposePrime() ************************************/
export const decomposePrime = (n: number): number[] => {
  // Quick implementation: the maximal number supported is 2**31-1
  let done = false;
  const factors: number[] = [];
  while (!done) {
    done = true;
    const stop = Math.sqrt(n);
    for (let i = 2; i <= stop; ++i) {
      if (n % i === 0) {
        factors.push(i);
        n = Math.floor(n / i);
        done = false;
        break;
      }
    }
  }
  return [...factors, n];
};

// Above this number a*b can be over 2**31-1
const MAX_INPUT = 65536;

Deno.test("Can use fast-check to property test decomposePrime function", async (t) => {
  await t.step(
    "should produce an array such that the product equals the input",
    () => {
      fc.assert(
        fc.property(fc.nat(MAX_INPUT), (n: number) => {
          const factors = decomposePrime(n);
          const productOfFactors = factors.reduce((a, b) => a * b, 1);
          return productOfFactors === n;
        }),
      );
    },
  );
  await t.step("should be able to decompose a product of two numbers", () => {
    fc.assert(
      fc.property(
        fc.integer(2, MAX_INPUT),
        fc.integer(2, MAX_INPUT),
        (a: number, b: number) => {
          const n = a * b;
          const factors = decomposePrime(n);
          return factors.length >= 2;
        },
      ),
    );
  });
  await t.step(
    "should compute the same factors as to the concatenation of the one of a and b for a times b",
    () => {
      fc.assert(
        fc.property(
          fc.integer(2, MAX_INPUT),
          fc.integer(2, MAX_INPUT),
          (a: number, b: number) => {
            const factorsA = decomposePrime(a);
            const factorsB = decomposePrime(b);
            const factorsAB = decomposePrime(a * b);
            const reorder = (arr: number[]) => [...arr].sort((a, b) => a - b);
            assertEquals(
              reorder(factorsAB),
              reorder([...factorsA, ...factorsB]),
            );
          },
        ),
      );
    },
  );
});

/*********************** indexOf() ************************************/
const indexOf = (text: string, pattern: string): number => {
  return text.indexOf(pattern);
};

Deno.test("Can use fast-check to property test indexOf function", async (t) => {
  await t.step("should confirm b is a substring of a + b + c", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.string(),
        (a: string, b: string, c: string) => {
          return indexOf(a + b + c, b) !== -1;
        },
      ),
    );
  });
  await t.step(
    "should return the starting position of the pattern within text if any",
    () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          fc.string(),
          (a: string, b: string, c: string) => {
            const text = a + b + c;
            const pattern = b;
            const index = indexOf(text, pattern);
            return index === -1 ||
              text.slice(index, index + pattern.length) === pattern;
          },
        ),
      );
    },
  );
});

/************************** fibronacci() *********************************/
function fibonacci(n: number): bigint {
  let a = 0n;
  let b = 1n;
  for (let i = 0; i !== n; ++i) {
    const previousA = a;
    a = b;
    b = previousA + b;
  }
  return a;
}

// The complexity of the algorithm is O(n)
// As a consequence we limit the value of n to 1000
const MaxN = 1000;

Deno.test("Can use fast-check to property test fibronacci function", async (t) => {
  await t.step(
    "should be equal to the sum of fibonacci(n-1) and fibonacci(n-2)",
    () => {
      fc.assert(
        fc.property(fc.integer(2, MaxN), (n: number) => {
          assert(fibonacci(n) === (fibonacci(n - 1) + fibonacci(n - 2)));
        }),
      );
    },
  );
  // The following properties are listed on the Wikipedia page:
  // https://fr.wikipedia.org/wiki/Suite_de_Fibonacci#Divisibilit%C3%A9_des_nombres_de_Fibonacci
  await t.step(
    "should fulfill fibonacci(p)*fibonacci(q+1)+fibonacci(p-1)*fibonacci(q) = fibonacci(p+q)",
    () => {
      fc.assert(
        fc.property(
          fc.integer(1, MaxN),
          fc.integer(0, MaxN),
          (p: number, q: number) => {
            assertEquals(
              fibonacci(p + q),
              fibonacci(p) * fibonacci(q + 1) + fibonacci(p - 1) * fibonacci(q),
            );
          },
        ),
      );
    },
  );
  await t.step("should fulfill fibonacci(2p-1) = fibo²(p-1)+fibo²(p)", () => {
    // Special case of the property above
    fc.assert(
      fc.property(fc.integer(1, MaxN), (p: number) => {
        assertEquals(
          fibonacci(2 * p - 1),
          fibonacci(p - 1) * fibonacci(p - 1) + fibonacci(p) * fibonacci(p),
        );
      }),
    );
  });
  await t.step("should fulfill Catalan identity", () => {
    fc.assert(
      fc.property(
        fc.integer(0, MaxN),
        fc.integer(0, MaxN),
        (a: number, b: number) => {
          const [p, q] = a < b ? [b, a] : [a, b];
          const sign = (p - q) % 2 === 0 ? 1n : -1n; // (-1)^(p-q)
          assertEquals(
            fibonacci(p) * fibonacci(p) - fibonacci(p - q) * fibonacci(p + q),
            sign * fibonacci(q) * fibonacci(q),
          );
        },
      ),
    );
  });
  await t.step("should fulfill Cassini identity", () => {
    fc.assert(
      fc.property(fc.integer(1, MaxN), fc.integer(0, MaxN), (p: number) => {
        const sign = p % 2 === 0 ? 1n : -1n; // (-1)^p
        assert(
          fibonacci(p + 1) * fibonacci(p - 1) - fibonacci(p) * fibonacci(p) ===
            sign,
        );
      }),
    );
  });
  await t.step("should fibonacci(nk) divisible by fibonacci(n)", () => {
    fc.assert(
      fc.property(
        fc.integer(1, MaxN),
        fc.integer(0, 100),
        (n: number, k: number) => {
          assert(fibonacci(n * k) % fibonacci(n) === 0n);
        },
      ),
    );
  });
  await t.step(
    "should fulfill gcd(fibonacci(a), fibonacci(b)) = fibonacci(gcd(a,b))",
    () => {
      fc.assert(
        fc.property(
          fc.integer(1, MaxN),
          fc.integer(1, MaxN),
          (a: number, b: number) => {
            const gcd = <T extends bigint | number>(a: T, b: T, zero: T): T => {
              a = a < zero ? (-a as T) : a;
              b = b < zero ? (-b as T) : b;
              if (b > a) {
                const temp = a;
                a = b;
                b = temp;
              }
              while (true) {
                if (b == zero) return a;
                a = (a % b) as T;
                if (a == zero) return b;
                b = (b % a) as T;
              }
            };
            assert(
              gcd(fibonacci(a), fibonacci(b), 0n) === fibonacci(gcd(a, b, 0)),
            );
          },
        ),
      );
    },
  );
});

/********************* sort() **************************************/
const sortInternal = <T>(
  tab: T[],
  start: number,
  end: number,
  cmp: (a: T, b: T) => boolean,
  // cmp: (a: T, b: T) => string,
): T[] => {
  if (end - start < 2) return tab;

  let pivot = start;
  for (let idx = start + 1; idx < end; ++idx) {
    if (!cmp(tab[start], tab[idx])) {
      const prev = tab[++pivot];
      tab[pivot] = tab[idx];
      tab[idx] = prev;
    }
  }
  const prev = tab[pivot];
  tab[pivot] = tab[start];
  tab[start] = prev;

  sortInternal(tab, start, pivot, cmp);
  sortInternal(tab, pivot + 1, end, cmp);
  return tab;
};

const sort = <T>(tab: T[], compare?: (a: T, b: T) => boolean): T[] => {
  return sortInternal([...tab], 0, tab.length, compare || ((a, b) => a < b));
};

Deno.test("Can use fast-check to property test sort function", async (t) => {
  await t.step("should have the same length as source", () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (data: Array<number>) => {
        assert(sort(data).length === data.length);
      }),
    );
  });
  await t.step(
    "should have exactly the same number of occurences as source for each item",
    () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (data: Array<number>) => {
          const sorted = sort(data);
          const keyCreatorFn = (item: number) => item.toString();
          assertEquals(
            groupBy(data, keyCreatorFn),
            groupBy(sorted, keyCreatorFn),
          );
        }),
      );
    },
  );
  await t.step("should produce an ordered array", () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (data: Array<number>) => {
        const sorted = sort(data);
        for (let idx = 1; idx < sorted.length; ++idx) {
          assert(sorted[idx - 1] <= sorted[idx]);
        }
      }),
    );
  });
  await t.step(
    "should produce an ordered array with respect to a custom compare function",
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.compareBooleanFunc(),
          (
            data: Array<number>,
            compare: (n1: number, n2: number) => boolean,
          ) => {
            const sorted = sort(data, compare);
            for (let idx = 1; idx < sorted.length; ++idx) {
              // compare(sorted[idx], sorted[idx - 1]):
              // = true : sorted[idx - 1]  > sorted[idx]
              // = false: sorted[idx - 1] <= sorted[idx]
              assert(compare(sorted[idx], sorted[idx - 1]) === false);
              // Meaning of compare:
              // a = b means in terms of ordering a and b are equivalent
              // a < b means in terms of ordering a comes before b
              // One important property is: a < b and b < c implies a < c
            }
          },
        ),
      );
    },
  );
});

/**** Additional tests not in the fast-check github examples ****/
function lowercaseString(text: string): string {
  return text.toLowerCase();
}

Deno.test("Can use fast-check to property test lowercaseString function", async (t) => {
  await t.step("string after lower case should be of same length", () => {
    fc.assert(
      fc.property(
        fc.string(),
        (text: string) => text.length === lowercaseString(text).length,
      ),
    );
  });
});

function add(a: number, b: number): number {
  return a + b;
}

function absoluteAddition(a: number, b: number): number {
  return Math.abs(a) + Math.abs(b);
}

Deno.test("Can use fast-check to property test add and absoluteAddition functions", async (t) => {
  await t.step(
    "absolute addition should always be greater or equal to regular addition",
    () => {
      fc.assert(
        fc.property(
          fc.integer(-99, 99),
          fc.integer(-99, 99),
          (a: number, b: number) => add(a, b) <= absoluteAddition(a, b),
        ),
      );
    },
  );
});
