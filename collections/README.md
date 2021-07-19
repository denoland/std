# std/collections

This module includes utilities around collection types like `Array`, `Record`
and `Set`.

# Usage

## chunked

Splits the given array into chunks of the given size and returns them.

```ts
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

## distinctBy

Returns all elements in the given array that produce a distinct value using the
given selector, preserving order by first occurence.

```ts
const names = ["Anna", "Kim", "Arnold", "Kate"];
const exampleNamesByFirstLetter = distinctBy(names, (it) => it.charAt(0));

console.assert(exampleNamesByFirstLetter === ["Anna", "Kim"]);
```

## distinct

Returns all distinct elements in the given array, preserving order by first
occurence.

```ts
const numbers = [3, 2, 5, 2, 5];
const distinctNumbers = distinct(numbers);

console.assert(distinctNumbers === [3, 2, 5]);
```

## filterEntries

Returns a new record with all entries of the given record except the ones that
do not match the given predicate.

```ts
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

## filterKeys

Returns a new record with all entries of the given record except the ones that
have a key that does not match the given predicate.

```ts
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

## filterValues

Returns a new record with all entries of the given record except the ones that
have a value that does not match the given predicate.

```ts
const people = {
  "Arnold": 37,
  "Sarah": 7,
  "Kim": 23,
};
const adults = filterValues(people, (it) => it.age >= 18);

console.assert(
  adults === {
    "Arnold": 37,
    "Kim": 23,
  },
);
```

## findLast

Returns the last element in the given array matching the given predicate.

```ts
const numbers = [4, 2, 7];
const lastEvenNumber = findLast(numbers, (it) => it % 2 === 0);

console.assert(lastEvenNumber === 2);
```

## groupBy

Applies the given selector to each element in the given array, returning a
Record containing the results as keys and all values that produced that key as
values.

```ts
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

## intersect

Returns all distinct elements that appear at least once in each of the given
arrays.

```ts
const lisaInterests = ["Cooking", "Music", "Hiking"];
const kimInterests = ["Music", "Tennis", "Cooking"];
const commonInterests = intersectTest(lisaInterests, kimInterests);

console.assert(commonInterests === ["Cooking", "Music"]);
```

## mapEntries

Applies the given transformer to all entries in the given record and returns a
new record containing the results.

```typescript
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

## mapKeys

Applies the given transformer to all keys in the given record's entries and
returns a new record containing the transformed entries.

If the transformed entries contain the same key multiple times, only the last
one will appear in the returned record.

```ts
const counts = { a: 5, b: 3, c: 8 };

console.assert(
  mapKeys(counts, (it) => it.toUppercase()) === {
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
const usersById = {
   'a5ec': { name: 'Mischa' },
   'de4f': { name: 'Kim' },
}
const namesById = mapValues(usersById, it => it.name)

console.assert(namesById === {
  'a5ec': 'Mischa',
  'de4f': 'Kim',
}
```

## partition

Returns a tuple of two arrays with the first one containing all elements in the
given array that match the given predicate and the second one containing all
that do not.

```ts
const numbers = [5, 6, 7, 8, 9];
const [even, odd] = partition(numbers, (it) => it % 2 == 0);

console.assert(even === [6, 8]);
console.assert(odd === [5, 7, 9]);
```

## permutations

Builds all possible orders of all elements in the given array Ignores equality
of elements, meaning this will always reutrn the same number of permutations for
a given length of input.

```ts
const numbers = [1, 2];
const windows = permutations(numbers);

console.assert(
  windows === [
    [1, 2],
    [2, 1],
  ],
);
```
