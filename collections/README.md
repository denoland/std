# std/collections

This module includes pure functions for specific common tasks around collection
types like `Array` and `Record`. This module is heavily inspired by `kotlin`s
stdlib.

- All provided functions are **pure**, which also means that they do **not
  mutate** your inputs, **returning a new value** instead.
- All functions are importable on their own by referencing their snake_case
  named file (e.g. `collections/sort_by.ts`)

If you want to contribute or undestand why this is done the way it is, see the
[contribution guide](CONTRIBUTING.md).

## Usage

### associateBy

Transforms the given array into a Record, extracting the key of each element
using the given selector. If the selector produces the same key for multiple
elements, the latest one will be used (overriding the ones before it).

```ts
import { associateBy } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const users = [
  { id: "a2e", userName: "Anna" },
  { id: "5f8", userName: "Arnold" },
  { id: "d2c", userName: "Kim" },
];
const usersById = associateBy(users, (it) => it.id);

assertEquals(usersById, {
  "a2e": { id: "a2e", userName: "Anna" },
  "5f8": { id: "5f8", userName: "Arnold" },
  "d2c": { id: "d2c", userName: "Kim" },
});
```

### chunked

Splits the given array into chunks of the given size and returns them.

```ts
import { chunked } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

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

console.assert(
  chunks === [
    ["lorem", "ipsum", "dolor"],
    ["sit", "amet", "consetetur"],
    ["sadipscing"],
  ],
);
```

### deepMerge

Merges the two given Records, recursively merging any nested Records with the
second collection overriding the first in case of conflict

For arrays, maps and sets, a merging strategy can be specified to either
`replace` values, or `merge` them instead. Use `includeNonEnumerable` option to
include non enumerable properties too.

```ts
import { deepMerge } from "./deep_merge.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const a = { foo: true };
const b = { foo: { bar: true } };

assertEquals(deepMerge(a, b), { foo: { bar: true } });
```

### distinctBy

Returns all elements in the given array that produce a distinct value using the
given selector, preserving order by first occurence.

```ts
import { distinctBy } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const names = ["Anna", "Kim", "Arnold", "Kate"];
const exampleNamesByFirstLetter = distinctBy(names, (it) => it.charAt(0));

console.assert(exampleNamesByFirstLetter === ["Anna", "Kim"]);
```

### distinct

Returns all distinct elements in the given array, preserving order by first
occurence.

```ts
import { distinct } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const numbers = [3, 2, 5, 2, 5];
const distinctNumbers = distinct(numbers);

console.assert(distinctNumbers === [3, 2, 5]);
```

### filterEntries

Returns a new record with all entries of the given record except the ones that
do not match the given predicate.

```ts
import { filterEntries } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const menu = {
  "Salad": 11,
  "Soup": 8,
  "Pasta": 13,
};
const myOptions = filterEntries(
  menu,
  ([item, price]) => item !== "Pasta" && price < 10,
);
console.assert(
  myOptions === {
    "Soup": 8,
  },
);
```

### filterKeys

Returns a new record with all entries of the given record except the ones that
have a key that does not match the given predicate.

```ts
import { filterKeys } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const menu = {
  "Salad": 11,
  "Soup": 8,
  "Pasta": 13,
};
const menuWithoutSalad = filterKeys(menu, (it) => it !== "Salad");

console.assert(
  menuWithoutSalad === {
    "Soup": 8,
    "Pasta": 13,
  },
);
```

### filterValues

Returns a new record with all entries of the given record except the ones that
have a value that does not match the given predicate.

```ts
import { filterValues } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const people = {
  "Arnold": 37,
  "Sarah": 7,
  "Kim": 23,
};
const adults = filterValues(people, (it) => it >= 18);

console.assert(
  adults === {
    "Arnold": 37,
    "Kim": 23,
  },
);
```

### findLast

Returns the last element in the given array matching the given predicate.

```ts
import { findLast } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const numbers = [4, 2, 7];
const lastEvenNumber = findLast(numbers, (it) => it % 2 === 0);

console.assert(lastEvenNumber === 2);
```

### findLastIndex

Returns the index of the last element in the given array matching the given
predicate.

```ts
import { findLastIndex } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const numbers = [0, 1, 2, 3, 4, 5, 6];
const lastIndexEvenNumber = findLastIndex(numbers, (it) => it % 2 === 0);

console.assert(lastIndexEvenNumber === 6);
```

### groupBy

Applies the given selector to each element in the given array, returning a
Record containing the results as keys and all values that produced that key as
values.

```ts
import { groupBy } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const people = [
  { name: "Anna" },
  { name: "Arnold" },
  { name: "Kim" },
];
const peopleByFirstLetter = groupBy(people, (it) => it.name.charAt(0));

console.assert(
  peopleByFirstLetter === {
    "A": [{ name: "Anna" }, { name: "Arnold" }],
    "K": [{ name: "Kim" }],
  },
);
```

### intersect

Returns all distinct elements that appear at least once in each of the given
arrays.

```ts
import { intersect } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const lisaInterests = ["Cooking", "Music", "Hiking"];
const kimInterests = ["Music", "Tennis", "Cooking"];
const commonInterests = intersect(lisaInterests, kimInterests);

console.assert(commonInterests === ["Cooking", "Music"]);
```

### mapEntries

Applies the given transformer to all entries in the given record and returns a
new record containing the results.

```ts
import { mapEntries } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const usersById = {
  "a2e": { name: "Kim", age: 22 },
  "dfe": { name: "Anna", age: 31 },
  "34b": { name: "Tim", age: 58 },
};
const agesByNames = mapEntries(usersById, ([id, { name, age }]) => [name, age]);

console.assert(
  agesByNames === {
    "Kim": 22,
    "Anna": 31,
    "Tim": 58,
  },
);
```

### mapKeys

Applies the given transformer to all keys in the given record's entries and
returns a new record containing the transformed entries.

If the transformed entries contain the same key multiple times, only the last
one will appear in the returned record.

```ts
import { mapKeys } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const counts = { a: 5, b: 3, c: 8 };

console.assert(
  mapKeys(counts, (it) => it.toUpperCase()) === {
    A: 5,
    B: 3,
    C: 8,
  },
);
```

### mapNotNullish

Returns a new array, containing all elements in the given array transformed
using the given transformer, except the ones that were transformed to `null` or
`undefined`.

```ts
import { mapNotNullish } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const people = [
  { middleName: null },
  { middleName: "William" },
  { middleName: undefined },
  { middleName: "Martha" },
];
const foundMiddleNames = mapNotNullish(people, (it) => it.middleName);

assertEquals(foundMiddleNames, ["William", "Martha"]);
```

### mapValues

Applies the given transformer to all values in the given record and returns a
new record containing the resulting keys associated to the last value that
produced them.

```ts
import { mapValues } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const usersById = {
  "a5ec": { name: "Mischa" },
  "de4f": { name: "Kim" },
};
const namesById = mapValues(usersById, (it) => it.name);

console.assert(
  namesById === {
    "a5ec": "Mischa",
    "de4f": "Kim",
  },
);
```

### maxOf

Applies the given selector to all elements of the provided collection and
returns the max value of all elements. If an empty array is provided the
function will return undefined

```ts
import { maxOf } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const inventory = [
  { name: "mustard", count: 2 },
  { name: "soy", count: 4 },
  { name: "tomato", count: 32 },
];

const maxCount = maxOf(inventory, (i) => i.count);

assertEquals(maxCount, 32);
```

## minOf

Applies the given selector to all elements of the given collection and returns
the min value of all elements. If an empty array is provided the function will
return undefined

```ts
import { minOf } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "../testing/asserts.ts";

const inventory = [
  { name: "mustard", count: 2 },
  { name: "soy", count: 4 },
  { name: "tomato", count: 32 },
];
const minCount = minOf(inventory, (i) => i.count);

assertEquals(minCount, 2);
```

### partition

Returns a tuple of two arrays with the first one containing all elements in the
given array that match the given predicate and the second one containing all
that do not.

```ts
import { partition } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const numbers = [5, 6, 7, 8, 9];
const [even, odd] = partition(numbers, (it) => it % 2 == 0);

console.assert(even === [6, 8]);
console.assert(odd === [5, 7, 9]);
```

### permutations

Builds all possible orders of all elements in the given array Ignores equality
of elements, meaning this will always reutrn the same number of permutations for
a given length of input.

```ts
import { permutations } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const numbers = [1, 2];
const windows = permutations(numbers);

console.assert(
  windows === [
    [1, 2],
    [2, 1],
  ],
);
```

### sortBy

Returns all elements in the given collection, sorted by their result using the
given selector. The selector function is called only once for each element.

```ts
import { sortBy } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const people = [
  { name: "Anna", age: 34 },
  { name: "Kim", age: 42 },
  { name: "John", age: 23 },
];
const sortedByAge = sortBy(people, (it) => it.age);

assertEquals(sortedByAge, [
  { name: "John", age: 23 },
  { name: "Anna", age: 34 },
  { name: "Kim", age: 42 },
]);
```

### union

Returns all distinct elements that appear in any of the given arrays

```ts
import { union } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const soupIngredients = ["Pepper", "Carrots", "Leek"];
const saladIngredients = ["Carrots", "Radicchio", "Pepper"];
const shoppingList = union(soupIngredients, saladIngredients);

assertEquals(shoppingList, ["Pepper", "Carrots", "Leek", "Radicchio"]);
```

### withoutAll

Returns an array excluding all given values

```ts
import { withoutAll } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const withoutList = withoutAll([2, 1, 2, 3], [1, 2]);

assertEquals(withoutList, [3]);
```

### unzip

Builds two separate arrays from the given array of 2-tuples, with the first
returned array holding all first tuple elements and the second one holding all
the second elements

```ts
import { unzip } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const parents = [
  ["Maria", "Jeff"],
  ["Anna", "Kim"],
  ["John", "Leroy"],
] as [string, string][];

const [moms, dads] = unzip(parents);

assertEquals(moms, ["Maria", "Anna", "John"]);
assertEquals(moms, ["Jeff", "Kim", "Leroy"]);
```

### zip

Builds 2-tuples of elements from the given array with matching indices, stopping
when the smaller array's end is reached

```ts
import { zip } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";

const numbers = [1, 2, 3, 4];
const letters = ["a", "b", "c", "d"];
const pairs = zip(numbers, letters);

console.assert(
  pairs === [
    [1, "a"],
    [2, "b"],
    [3, "c"],
    [4, "d"],
  ],
);
```

### takeWhile

Returns all elements in the given collection until the first element that does
not match the given predicate.

```ts
import { takeWhile } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const arr = [1, 2, 3, 4, 5, 6];

assertEquals(
  takeWhile(arr, (i) => i !== 4),
  [1, 2, 3],
);
```

### firstNotNullishOf

Applies the given selector to elements in the given array until a value is
produced that is neither `null` nor `undefined` and returns that value. Returns
`undefined` if no such value is produced

```ts
import { firstNotNullishOf } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const tables = [
  { number: 11, order: null },
  { number: 12, order: "Soup" },
  { number: 13, order: "Salad" },
];
const nextOrder = firstNotNullishOf(tables, (it) => it.order);

assertEquals(nextOrder, "Soup");
```

### maxBy

Returns the first element that is the largest value of the given function or
undefined if there are no elements.

```ts
import { maxBy } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const people = [
  { name: "Anna", age: 34 },
  { name: "Kim", age: 42 },
  { name: "John", age: 23 },
];

const personWithMaxAge = maxBy(people, (i) => i.age);

assertEquals(personWithMaxAge, { name: "Kim", age: 42 });
```

### minBy

Returns the first element that is the smallest value of the given function or
undefined if there are no elements

```ts
import { minBy } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const people = [
  { name: "Anna", age: 34 },
  { name: "Kim", age: 42 },
  { name: "John", age: 23 },
];

const personWithMinAge = minBy(people, (i) => i.age);

assertEquals(personWithMinAge, { name: "John", age: 23 });
```

### dropLastWhile

Returns all elements in the given collection until the last element that does
not match the given predicate

Example:

```ts
import { dropLastWhile } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const values = [22, 30, 44];

const notFourtyFour = dropLastWhile(values, (i) => i != 44);

assertEquals(
  notFourtyFour,
  [22, 30],
);
```
