# std/collections

This module includes utilities around collection types like `Array`, `Record`
and `Set`.

# Usage

## chunked

Splits the given array into chunks of the given size and returns them.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { chunked } from "https://deno.land/std/collections/chunked.ts";

const words = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consetetur",
  "sadipscing",
];
const chunks = chunked(words, 3);

assertEquals(chunks, [
  ["lorem", "ipsum", "dolor"],
  ["sit", "amet", "consetetur"],
  ["sadipscing"],
]);
```

## distinctBy

Returns all elements in the given array that produce a distinct value using the
given selector, preserving order by first occurence.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { distinctBy } from "https://deno.land/std/collections/distinct_by.ts";

const names = ["Anna", "Kim", "Arnold", "Kate"];
const exampleNamesByFirstLetter = distinctBy(names, (it) => it.charAt(0));

assertEquals(exampleNamesByFirstLetter, ["Anna", "Kim"]);
```

## distinct

Returns all distinct elements in the given array, preserving order by first
occurence.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { distinct } from "https://deno.land/std/collections/distinct.ts";

const numbers = [3, 2, 5];
const distinctNumbers = distinct(numbers);

assertEquals(distinctNumbers, [3, 2, 5]);
```

## filterEntries

Returns a new record with all entries of the given record except the ones that
do not match the given predicate.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { filterEntries } from "https://deno.land/std/collections/filter_entries.ts";

const menu = {
  "Salad": 11,
  "Soup": 8,
  "Pasta": 13,
};
const myOptions = filterEntries(
  menu,
  ([item, price]) => item !== "Pasta" && price < 10,
);
assertEquals(
  myOptions,
  {
    "Soup": 8,
  },
);
```

## filterKeys

Returns a new record with all entries of the given record except the ones that
have a key that does not match the given predicate.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { filterKeys } from "https://deno.land/std/collections/filter_keys.ts";

const menu = {
  "Salad": 11,
  "Soup": 8,
  "Pasta": 13,
};
const menuWithoutSalad = filterKeys(menu, (it) => it !== "Salad");

assertEquals(
  menuWithoutSalad,
  {
    "Soup": 8,
    "Pasta": 13,
  },
);
```

## filterValues

Returns a new record with all entries of the given record except the ones that
have a value that does not match the given predicate.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { filterValues } from "https://deno.land/std/collections/filter_values.ts";

const people = {
  "Arnold": { age: 37 },
  "Sarah": { age: 7 },
  "Kim": { age: 23 },
};
const adults = filterValues(people, (it) => it.age >= 18);

assertEquals(
  adults,
  {
    "Arnold": { age: 37 },
    "Kim": { age: 23 },
  },
);
```

## findLast

Returns the last element in the given array matching the given predicate.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { findLast } from "https://deno.land/std/collections/find_last.ts";

const numbers = [4, 2, 7];
const lastEvenNumber = findLast(numbers, (it) => it % 2 === 0);

assertEquals(lastEvenNumber, 2);
```

## groupBy

Applies the given selector to each element in the given array, returning a
Record containing the results as keys and all values that produced that key as
values.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { groupBy } from "https://deno.land/std/collections/group_by.ts";

const people = [
  { name: "Anna" },
  { name: "Arnold" },
  { name: "Kim" },
];
const peopleByFirstLetter = groupBy(people, (it) => it.name.charAt(0));

assertEquals(
  peopleByFirstLetter,
  {
    "A": [{ name: "Anna" }, { name: "Arnold" }],
    "K": [{ name: "Kim" }],
  },
);
```

## intersect

Returns all distinct elements that appear at least once in each of the given
arrays.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { intersect } from "https://deno.land/std/collections/intersect.ts";

const lisaInterests = ["Cooking", "Music", "Hiking"];
const kimInterests = ["Music", "Tennis", "Cooking"];
const commonInterests = intersect(lisaInterests, kimInterests);

assertEquals(commonInterests, ["Cooking", "Music"]);
```

## mapEntries

Applies the given transformer to all entries in the given record and returns a
new record containing the results.

```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { mapEntries } from "https://deno.land/std/collections/map_entries.ts";

const usersById = {
  "a2e": { name: "Kim", age: 22 },
  "dfe": { name: "Anna", age: 31 },
  "34b": { name: "Tim", age: 58 },
};
const agesByNames = mapEntries(usersById, ([id, { name, age }]) => [name, age]);

assertEquals(
  agesByNames,
  {
    "Kim": 22,
    "Anna": 31,
    "Tim": 58,
  },
);
```

## mapKeys

Applies the given transformer to all keys in the given record's entries and
returns a new record containing the transformed entries.

If the transformed entries contain the same key multiple times, only the last
one will appear in the returned record.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { mapKeys } from "https://deno.land/std/collections/map_keys.ts";

const counts = { a: 5, b: 3, c: 8 };

assertEquals(
  mapKeys(counts, (it) => it.toUpperCase()),
  {
    A: 5,
    B: 3,
    C: 8,
  },
);
```

## mapValues

Applies the given transformer to all valuesin the given record and returns a new
record containing the resulting keys associated to the last value that produced
them.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { mapValues } from "https://deno.land/std/collections/map_values.ts";

const usersById = {
  "a5ec": { name: "Mischa" },
  "de4f": { name: "Kim" },
};
const namesById = mapValues(usersById, (it) => it.name);

assertEquals(
  namesById,
  {
    "a5ec": "Mischa",
    "de4f": "Kim",
  },
);
```

## partition

Returns a tuple of two arrays with the first one containing all elements in the
given array that match the given predicate and the second one containing all
that do not.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { partition } from "https://deno.land/std/collections/partition.ts";

const numbers = [5, 6, 7, 8, 9];
const [even, odd] = partition(numbers, (it) => it % 2 == 0);

assertEquals(even, [6, 8]);
assertEquals(odd, [5, 7, 9]);
```

## permutations

Builds all possible orders of all elements in the given array Ignores equality
of elements, meaning this will always reutrn the same number of permutations for
a given length of input.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { permutations } from "https://deno.land/std/collections/permutations.ts";

const numbers = [1, 2];
const windows = permutations(numbers);

assertEquals(
  windows,
  [
    [1, 2],
    [2, 1],
  ],
);
```

## union

Returns all distinct elements that appear in any of the given arrays.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { union } from "https://deno.land/std/collections/union.ts";

const soupIngredients = ["Pepper", "Carrots", "Leek"];
const saladIngredients = ["Carrots", "Radicchio", "Pepper"];
const shoppingList = union(soupIngredients, saladIngredients);

assertEquals(shoppingList, ["Pepper", "Carrots", "Leek", "Radicchio"]);
```

## unzip

Builds two separate arrays from the given array of 2-tuples, with the first
returned array holding all first tuple elements and the second one holding all
the second elements.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { unzip } from "https://deno.land/std/collections/unzip.ts";

const parents = [
  ["Maria", "Jeff"],
  ["Anna", "Kim"],
  ["John", "Leroy"],
];
const [moms, dads] = unzip(parents);

assertEquals(moms, ["Maria", "Anna", "John"]);
assertEquals(dads, ["Jeff", "Kim", "Leroy"]);
```

## zip

Builds 2-tuples of elements from the given array with matching indices, stopping
when the smaller array's end is reached.

```ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { zip } from "https://deno.land/std/collections/zip.ts";

const numbers = [1, 2, 3, 4];
const letters = ["a", "b", "c", "d"];
const pairs = zip(numbers, letters);

assertEquals(
  pairs,
  [
    [1, "a"],
    [2, "b"],
    [3, "c"],
    [4, "d"],
  ],
);
```
