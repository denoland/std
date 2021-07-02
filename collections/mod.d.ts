// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
type Predicate<T> = (item: T) => boolean;
type Selector<T, O = unknown> = (item: T) => O;
type Grouping<V> = Record<string, Array<V>>;

/**
 * Returns all distinct elements that appear in both given arrays
 *
 * Example:
 *
 * ```typescript
 * const lisaInterests = [ 'Cooking', 'Music', 'Hiking' ]
 * const kimInterests = [ 'Music', 'Tennis', 'Cooking' ]
 * const commonInterests = intersect(lisaInterests, kimInterests)
 *
 * console.assert(commonInterests === [ 'Cooking', 'Music' ])
 * ```
 */
declare function intersect<T>(
  array: Array<T>,
  withArray: Array<T>,
): Array<T>;

/**
 * Returns all distinct elements that appear in either of the given arrays
 *
 * Example:
 *
 * ```typescript
 * const soupIngredients = [ 'Pepper', 'Carrots', 'Leek' ]
 * const saladIngredients = [ 'Carrots', 'Radicchio', 'Pepper' ]
 * const shoppingList = union(soupIngredients, saladIngredients)
 *
 * console.assert(shoppingList === [ 'Pepper', 'Carrots', 'Leek', 'Radicchio' ])
 * ```
 */
declare function union<T>(
  array: Array<T>,
  withArray: Array<T>,
): Array<T>;

/**
 * Returns the last element in the given array matching the given predicate
 *
 * Example:
 *
 * ```typescript
 * const numbers = [ 4, 2, 7 ]
 * const lastEvenNumber = findLast(numbers, it => it % 2 === 0)
 *
 * console.assert(lastEvenNumber === 2)
 * ```
 */
declare function findLast<T>(
  array: Array<T>,
  predicate: Predicate<T>,
): T | undefined;

/**
 * Builds 2-tuples of elements from the given array with matching indices, stopping when the smaller array's end is reached
 *
 * Example:
 *
 * ```typescript
 * const numbers = [ 1, 2, 3, 4 ]
 * const letters = [ 'a', 'b', 'c', 'd' ]
 * const pairs = zip(numbers, letters)
 *
 * console.assert(pairs === [
 *     [ 1, 'a' ],
 *     [ 2, 'b' ],
 *     [ 3, 'c' ],
 *     [ 4, 'd' ],
 * ])
 * ```
 */
declare function zip<T, U>(
  array: Array<T>,
  withArray: Array<U>,
): Array<[T, U]>;

/**
 * Builds two separate arrays from the given array of 2-tuples, with the first returned array holding all first
 * tuple elements and the second one holding all the second elements
 *
 * Example:
 *
 * ```typescript
 * const parents = [
 *     [ 'Maria', 'Jeff' ],
 *     [ 'Anna', 'Kim' ],
 *     [ 'John', 'Leroy' ],
 * ]
 * const [ moms, dads ] = unzip(parents)
 *
 * console.assert(moms === [ 'Maria', 'Anna', 'John' ])
 * console.assert(moms === [ 'Jeff', 'Kim', 'Leroy' ])
 * ```
 */
declare function unzip<T, U>(pairs: Array<[T, U]>): [Array<T>, Array<U>];

/**
 * Applies the given selector to each element in the given array, returning a Record containing the results as keys
 * and all values that produced that key as values.
 *
 * Example:
 *
 * ```typescript
 * const people = [
 *     { name: 'Anna' },
 *     { name: 'Arnold' },
 *     { name: 'Kim' },
 * ]
 * const peopleByFirstLetter = groupBy(people, it => it.name.charAt(0))
 *
 * console.assert(peopleByFirstLetter === {
 *     'A': [ { name: 'Anna' }, { name: 'Arnold' } ],
 *     'K': [ { name: 'Kim' } ],
 * })
 * ```
 */
declare function groupBy<T>(
  array: Array<T>,
  selector: Selector<T, string>,
): Grouping<T>;

/**
 * Returns a tuple of two arrays with the first one containing all elements in the given array that match the given predicate
 * and the second one containing all that do not
 *
 * Example:
 *
 * ```typescript
 * const numbers = [ 5, 6, 7, 8, 9 ]
 * const [ even, odd ] = partition(numbers, it => it % 2 == 0)
 *
 * console.assert(even === [ 6, 8 ])
 * console.assert(odd === [ 5, 7, 9 ])
 * ```
 */
declare function partition<T>(
  array: Array<T>,
  predicate: Predicate<T>,
): [Array<T>, Array<T>];

/**
 * Splits the given array into chunks of the given size and returns them
 *
 * Example:
 *
 * ```typescript
 * const words = [ 'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consetetur', 'sadipscing' ]
 * const chunks = chunked(words, 3)
 *
 * console.assert(chunks === [
 *     [ 'lorem', 'ipsum', 'dolor' ],
 *     [ 'sit', 'amet', 'consetetur' ],
 *     [ 'sadipscing' ],
 * ])
 * ```
 */
declare function chunked<T>(
  array: Array<T>,
  size: number,
): Array<Array<T>>;

/**
 * Builds all possible combinations and orders of elements in the given array and the given size.
 *
 * If size is not given, it is assumed to be the length of the given array.
 *
 * Example:
 *
 * ```typescript
 * const numbers = [ 1, 2, 3 ]
 * const windows = permutations(words, 2)
 *
 * console.assert(windows === [
 *     [ 1, 2 ],
 *     [ 1, 3 ],
 *     [ 2, 1 ],
 *     [ 2, 3 ],
 *     [ 3, 1 ],
 *     [ 3, 2 ],
 * ])
 * ```
 */
declare function permutations<T>(
  array: Array<T>,
  size?: number,
): Array<Array<T>>;

/**
 * Returns a new record with all entries of the given record except the ones that do not match the given predicate
 *
 * Example:
 *
 * ```typescript
 * const menu = {
 *     'Salad': 11,
 *     'Soup': 8,
 *     'Pasta': 13,
 * }
 * const myOptions = filterEntries(menu,
 *     ([ item, price ]) => item !== 'Pasta' && price < 10,
 * )
 *
 * console.assert(myOptions === {
 *     'Soup': 8,
 * })
 * ```
 */
declare function filterEntries<T>(
  record: Record<string, T>,
  predicate: Predicate<[string, T]>,
): Record<string, T>;

/**
 * Returns a new record with all entries of the given record except the ones that have a key that does not match the given predicate
 *
 * Example:
 *
 * ```typescript
 * const menu = {
 *     'Salad': 11,
 *     'Soup': 8,
 *     'Pasta': 13,
 * }
 * const menuWithoutSalad = filterKeys(menu, it => it !== 'Salad')
 *
 * console.assert(menuWithoutSalad === {
 *     'Soup': 8,
 *     'Pasta': 13,
 * })
 * ```
 */
declare function filterKeys<T>(
  record: Record<string, T>,
  predicate: Predicate<string>,
): Record<string, T>;

/**
 * Returns a new record with all entries of the given record except the ones that have a value that does not match the given predicate
 *
 * Example:
 *
 * ```typescript
 * const people = {
 *     'Arnold': 37,
 *     'Sarah': 7,
 *     'Kim': 23,
 * }
 * const adults = filterValues(people, it => it.age >= 18)
 *
 * console.assert(adults === {
 *     'Arnold': 37,
 *     'Kim': 23,
 * })
 * ```
 */
declare function filterValues<T>(
  record: Record<string, T>,
  predicate: Predicate<T>,
): Record<string, T>;

/**
 * Applies the given transformer to all entries in the given record and returns a new record containing the results
 *
 * Example:
 *
 * ```typescript
 * const usersById = {
 *     'a2e': { name: 'Kim', age: 22 },
 *     'dfe': { name: 'Anna', age: 31 },
 *     '34b': { name: 'Tim', age: 58 },
 * }
 * const agesByNames = mapEntries(usersById,
 *     ([ id, { name, age } ]) => [ name, age ],
 * )
 *
 * console.assert(agesByNames === {
 *     'Kim': 22,
 *     'Anna': 31,
 *     'Tim': 58,
 * })
 * ```
 */
declare function mapEntries<T, O>(
  record: Record<string, T>,
  transformer: Selector<[string, T], [string, O]>,
): Record<string, O>;

/**
 * Applies the given transformer to all keys in the given record's entries and returns a new record containing the
 * transformed entries.
 *
 * If the transformed entries contain the same key multiple times, only the last one will appear in the returned record.
 *
 * Example:
 *
 * ```typescript
 * const counts = { a: 5, b: 3, c: 8 }
 *
 * console.assert(mapKeys(counts, it => it.toUppercase()) === {
 *     A: 5,
 *     B: 3,
 *     C: 8,
 * })
 * ```
 */
declare function mapKeys<T>(
  record: Record<string, T>,
  transformer: Selector<string, string>,
): Record<string, T>;

/**
 * Applies the given transformer to all valuesin the given record and returns a new record containing the resulting keys
 * associated to the last value that produced them.
 *
 * Example:
 *
 * ```typescript
 * const usersById = {
 *     'a5ec': { name: 'Mischa' },
 *     'de4f': { name: 'Kim' },
 * }
 * const namesById = mapValues(usersById, it => it.name)
 *
 * console.assert(namesById === {
 *     'a5ec': 'Mischa',
 *     'de4f': 'Kim',
 * }
 * ```
 */
declare function mapValues<T, O>(
  record: Record<string, T>,
  transformer: Selector<T, O>,
): Record<string, O>;
