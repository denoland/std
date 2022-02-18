# std/collections

This module includes pure functions for specific common tasks around collection
types like `Array` and `Record`. This module is heavily inspired by `kotlin`s
stdlib.

- All provided functions are **pure**, which also means that they do **not
  mutate** your inputs, **returning a new value** instead.
- All functions are importable on their own by referencing their snake_case
  named file (e.g. `collections/sort_by.ts`)

If you want to contribute or understand why this is done the way it is, see the
[contribution guide](CONTRIBUTING.md).

## Usage

### aggregateGroups

Applies the given aggregator to each group in the given grouping, returning the
results together with the respective group keys

```ts
import { aggregateGroups } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const foodProperties = {
  "Curry": ["spicy", "vegan"],
  "Omelette": ["creamy", "vegetarian"],
};
const descriptions = aggregateGroups(
  foodProperties,
  (current, key, first, acc) => {
    if (first) {
      return `${key} is ${current}`;
    }

    return `${acc} and ${current}`;
  },
);

assertEquals(descriptions, {
  "Curry": "Curry is spicy and vegan",
  "Omelette": "Omelette is creamy and vegetarian",
});
```

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

### associateWith

Builds a new Record using the given array as keys and choosing a value for each
key using the given selector. If any of two pairs would have the same value the
latest on will be used (overriding the ones before it).

```ts
import { associateWith } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const names = ["Kim", "Lara", "Jonathan"];
const namesToLength = associateWith(names, (it) => it.length);

assertEquals(namesToLength, {
  "Kim": 3,
  "Lara": 4,
  "Jonathan": 8,
});
```

### chunk

Splits the given array into chunks of the given size and returns them.

```ts
import { chunk } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const words = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consetetur",
  "sadipscing",
];
const chunks = chunk(words, 3);

assertEquals(
  chunks,
  [
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
import { deepMerge } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const a = { foo: true };
const b = { foo: { bar: true } };

assertEquals(deepMerge(a, b), { foo: { bar: true } });
```

### distinctBy

Returns all elements in the given array that produce a distinct value using the
given selector, preserving order by first occurrence.

```ts
import { distinctBy } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const names = ["Anna", "Kim", "Arnold", "Kate"];
const exampleNamesByFirstLetter = distinctBy(names, (it) => it.charAt(0));

assertEquals(exampleNamesByFirstLetter, ["Anna", "Kim"]);
```

### distinct

Returns all distinct elements in the given array, preserving order by first
occurrence.

```ts
import { distinct } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const numbers = [3, 2, 5, 2, 5];
const distinctNumbers = distinct(numbers);

assertEquals(distinctNumbers, [3, 2, 5]);
```

### dropWhile

Returns a new array that drops all elements in the given collection until the
first element that does not match the given predicate.

```ts
import { dropWhile } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const numbers = [3, 2, 5, 2, 5];
const dropWhileNumbers = dropWhile(numbers, (i) => i !== 2);

assertEquals(dropWhileNumbers, [2, 5, 2, 5]);
```

### dropLastWhile

Returns a new array that drops all elements in the given collection until the
last element that does not match the given predicate

Example:

```ts
import { dropLastWhile } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const numbers = [22, 30, 44];

const notFortyFour = dropLastWhile(numbers, (i) => i != 44);

assertEquals(
  notFortyFour,
  [22, 30],
);
```

### filterEntries

Returns a new record with all entries of the given record except the ones that
do not match the given predicate.

```ts
import { filterEntries } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

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

### filterKeys

Returns a new record with all entries of the given record except the ones that
have a key that does not match the given predicate.

```ts
import { filterKeys } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

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

### filterValues

Returns a new record with all entries of the given record except the ones that
have a value that does not match the given predicate.

```ts
import { filterValues } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const people = {
  "Arnold": 37,
  "Sarah": 7,
  "Kim": 23,
};
const adults = filterValues(people, (it) => it >= 18);

assertEquals(
  adults,
  {
    "Arnold": 37,
    "Kim": 23,
  },
);
```

### findSingle

Returns an element if and only if that element is the only one matching the
given condition. Returns `undefined` otherwise.

```ts
import { findSingle } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const bookings = [
  { month: "January", active: false },
  { month: "March", active: false },
  { month: "June", active: true },
];
const activeBooking = findSingle(bookings, (it) => it.active);
const inactiveBooking = findSingle(bookings, (it) => !it.active);

assertEquals(activeBooking, { month: "June", active: true });
assertEquals(inactiveBooking, undefined); // there are two applicable items
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

### groupBy

Applies the given selector to each element in the given array, returning a
Record containing the results as keys and all values that produced that key as
values.

```ts
import { groupBy } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

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

### includesValue

If the given value is part of the given object it returns true, otherwise it
returns false. Doesn't work with non-primitive values: includesValue({x: {}},
{}) returns false.

```ts
import { includesValue } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const input = {
  first: 33,
  second: 34,
};

assertEquals(includesValue(input, 34), true);
```

### intersect

Returns all distinct elements that appear at least once in each of the given
arrays.

```ts
import { intersect } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const lisaInterests = ["Cooking", "Music", "Hiking"];
const kimInterests = ["Music", "Tennis", "Cooking"];
const commonInterests = intersect(lisaInterests, kimInterests);

assertEquals(commonInterests, ["Cooking", "Music"]);
```

### joinToString

Transforms the elements in the given array to strings using the given selector.
Joins the produced strings into one using the given `separator` and applying the
given `prefix` and `suffix` to the whole string afterwards. If the array could
be huge, you can specify a non-negative value of `limit`, in which case only the
first `limit` elements will be appended, followed by the `truncated` string.
Returns the resulting string.

```ts
import { joinToString } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const users = [
  { name: "Kim" },
  { name: "Anna" },
  { name: "Tim" },
];

const message = joinToString(users, (it) => it.name, {
  suffix: " are winners",
  prefix: "result: ",
  separator: " and ",
  limit: 1,
  truncated: "others",
});

assertEquals(message, "result: Kim and others are winners");
```

### mapEntries

Applies the given transformer to all entries in the given record and returns a
new record containing the results.

```ts
import { mapEntries } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

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

### mapKeys

Applies the given transformer to all keys in the given record's entries and
returns a new record containing the transformed entries.

If the transformed entries contain the same key multiple times, only the last
one will appear in the returned record.

```ts
import { mapKeys } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

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
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

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

### maxWith

Returns the first element having the largest value according to the provided
comparator or undefined if there are no elements

```ts
import { maxWith } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const people = ["Kim", "Anna", "John", "Arthur"];
const largestName = maxWith(people, (a, b) => a.length - b.length);

assertEquals(largestName, "Arthur");
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

### minOf

Applies the given selector to all elements of the given collection and returns
the min value of all elements. If an empty array is provided the function will
return undefined

```ts
import { minOf } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const inventory = [
  { name: "mustard", count: 2 },
  { name: "soy", count: 4 },
  { name: "tomato", count: 32 },
];
const minCount = minOf(inventory, (i) => i.count);

assertEquals(minCount, 2);
```

### minWith

Returns the first element having the smallest value according to the provided
comparator or undefined if there are no elements

```ts
import { minWith } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const people = ["Kim", "Anna", "John"];
const smallestName = minWith(people, (a, b) => a.length - b.length);

assertEquals(smallestName, "Kim");
```

### partition

Returns a tuple of two arrays with the first one containing all elements in the
given array that match the given predicate and the second one containing all
that do not.

```ts
import { partition } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const numbers = [5, 6, 7, 8, 9];
const [even, odd] = partition(numbers, (it) => it % 2 == 0);

assertEquals(even, [6, 8]);
assertEquals(odd, [5, 7, 9]);
```

### permutations

Builds all possible orders of all elements in the given array Ignores equality
of elements, meaning this will always return the same number of permutations for
a given length of input.

```ts
import { permutations } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

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

### reduceGroups

Applies the given reducer to each group in the given Grouping, returning the
results together with the respective group keys

```ts
import { reduceGroups } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const votes = {
  "Woody": [2, 3, 1, 4],
  "Buzz": [5, 9],
};

const totalVotes = reduceGroups(votes, (sum, it) => sum + it, 0);

assertEquals(totalVotes, {
  "Woody": 10,
  "Buzz": 14,
});
```

### runningReduce

Calls the given reducer on each element of the given collection, passing it's
result as the accumulator to the next respective call, starting with the given
initialValue. Returns all intermediate accumulator results.

Example:

```ts
import { runningReduce } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const numbers = [1, 2, 3, 4, 5];
const sumSteps = runningReduce(numbers, (sum, current) => sum + current, 0);

assertEquals(sumSteps, [1, 3, 6, 10, 15]);
```

### sumOf

Applies the given selector to all elements in the given collection and
calculates the sum of the results.

```ts
import { sumOf } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const people = [
  { name: "Anna", age: 34 },
  { name: "Kim", age: 42 },
  { name: "John", age: 23 },
];
const totalAge = sumOf(people, (i) => i.age);

assertEquals(totalAge, 99);
```

### sample

Returns a random element from the given array

```ts
import { sample } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const numbers = [1, 2, 3, 4];
const random = sample(numbers);

assert(numbers.includes(random as number));
```

### slidingWindows

Generates sliding views of the given array of the given size and returns a new
array containing all of them.

If step is set, each window will start that many elements after the last
window's start. (Default: 1)

If partial is set, windows will be generated for the last elements of the
collection, resulting in some undefined values if size is greater than 1.
(Default: false)

```ts
import { slidingWindows } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
const numbers = [1, 2, 3, 4, 5];

const windows = slidingWindows(numbers, 3);
assertEquals(windows, [
  [1, 2, 3],
  [2, 3, 4],
  [3, 4, 5],
]);

const windowsWithStep = slidingWindows(numbers, 3, { step: 2 });
assertEquals(windowsWithStep, [
  [1, 2, 3],
  [3, 4, 5],
]);

const windowsWithPartial = slidingWindows(numbers, 3, { partial: true });
assertEquals(windowsWithPartial, [
  [1, 2, 3],
  [2, 3, 4],
  [3, 4, 5],
  [4, 5],
  [5],
]);
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

### takeLastWhile

Returns all elements in the given array after the last element that does not
match the given predicate.

Example:

```ts
import { takeLastWhile } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const arr = [1, 2, 3, 4, 5, 6];

assertEquals(
  takeLastWhile(arr, (i) => i > 4),
  [5, 6],
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
assertEquals(dads, ["Jeff", "Kim", "Leroy"]);
```

### withoutAll

Returns an array excluding all given values

```ts
import { withoutAll } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const withoutList = withoutAll([2, 1, 2, 3], [1, 2]);

assertEquals(withoutList, [3]);
```

### zip

Builds N-tuples of elements from the given N arrays with matching indices,
stopping when the smallest array's end is reached

```ts
import { zip } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

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
