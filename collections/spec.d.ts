type Predicate<T> = (item: T) => boolean
type Selector<T, O = unknown> = (item: T) => O
type Grouping<V> = Record<string, Array<V>>

/*
 * ARRAYS
 */

/*
 * Predicates
 */

/** Checks if the given collection has no elements */
declare function isEmpty(collection: Array<unknown>): boolean

/** Checks if the given collection has any elements */
declare function isNotEmpty(collection: Array<unknown>): boolean

/** Checks if none of the elements in the given collection match the given predicate */
declare function none<T>(collection: Array<T>, predicate: Predicate<T>): boolean

/** Checks if the given collection includes all elements in the other given collection */
declare function includesAll<T, O extends T>(collection: Array<T>, needles: Array<O>): boolean

/** Checks if the given collection includes any of the elements in the other given collection */
declare function includesAny<T, O extends T>(collection: Array<T>, needles: Array<O>): boolean

/** Checks if the given collection includes none of the elements in the other given collection */
declare function includesNone<T, O extends T>(collection: Array<T>, needles: Array<O>): boolean

/*
 * Transformations to Array
 */

/** Transforms all elements in the given collection using the given transformer and builds a new array with the results, removing nullish values */
declare function mapNotNullish<T, O>(collection: Array<T>, transformer: Selector<T, O>): Array<NonNullable<O>>

/** Returns the first n elements of a given collection. Returns the collection if it contains less than n elements. */
declare function takeFirst<T>(collection: Array<T>, n: number): Array<T>

/** Returns the last n elements of a given collection. Returns the collection if it contains less than n elements. */
declare function takeLast<T>(collection: Array<T>, n: number): Array<T>

/** Retursn all elements in the given collection except the first n elements. */
declare function dropFirst<T>(collection: Array<T>, n: number): Array<T>

/** Retursn all elements in the given collection except the last n elements. */
declare function dropLast<T>(collection: Array<T>, n: number): Array<T>

/** Returns all elements in the given collection until the first element that does not match the given predicate (excluded) */
declare function takeFirstWhile<T>(collection: Array<T>, predicate: Predicate<T>): Array<T>

/** Returns all elements in the given collection from the last element that does not match the given predicate (excluded) until the end of the collection */
declare function takeLastWhile<T>(collection: Array<T>, predicate: Predicate<T>): Array<T>

/** Returns all elements in the given collection starting from the first element that does not match the given predicate */
declare function dropFirstWhile<T>(collection: Array<T>, predicate: Predicate<T>): Array<T>

/** Returns all elements in the given collection until the last element that does not match the given predicate */
declare function dropLastWhile<T>(collection: Array<T>, predicate: Predicate<T>): Array<T>

/** Returns all elements in the given collection that do not match the given predicate */
declare function filterNot<T>(collection: Array<T>, predicate: Predicate<T>): Array<T>

/** Returns all elements in the given collection that are not nullish */
declare function filterNotNullish<T>(collection: Array<T>): Array<NonNullable<T>>

/** Returns all distinct elements in the given collection, preserving order by first occurence */
declare function distinct<T>(collection: Array<T>): Array<T>

/** Returns all elements in the given collection that produce a distinct value using the given selector, preserving order by first occurence */
declare function distinctBy<T>(collection: Array<T>, selector: Selector<T>): Array<T>

/** Returns all elements in the given collection, sorted by their result using the given selector */
declare function sortBy<T>(collection: Array<T>, selector: Selector<T, number | string>): Array<T>

/** Returns all distinct elements that appear in both given collections */
declare function intersect<T>(collection: Array<T>, withCollection: Array<T>): Array<T>

/** Returns all distinct elements that appear in either of the given collections */
declare function union<T>(collection: Array<T>, withCollection: Array<T>): Array<T>

/**
 * Calls the given reducer on each element of the given collection, passing it's result as the accumulator to the next respective call,
 * starting with the given initialValue. Returns all intermediate accumulator results.
 */
declare function runningReduce<T, A>(collection: Array<T>, reducer: (accumulator: A, current: T) => A, initialValue: A): Array<A>

/** Returns all elements in the given collection except the given value to remove */
declare function without<T>(collection: Array<T>, toRemove: T): Array<T>

/** Returns all elements in the given collection except the given values to remove */
declare function withoutAll<T>(collection: Array<T>, toRemove: Array<T>): Array<T>

/*
 * Transformations to value
 */

/** Returns the last index in the given collection, equal to it's size minus 1. Returns undefined if the collection is empty. */
declare function lastIndex(collection: Array<unknown>): number

/** Returns the first element in the given collection and undefined if there is none */
declare function first<T>(collection: Array<T>): T | undefined 

/** Returns the last element in the given collection and undefined if there is none */
declare function last<T>(collection: Array<T>): T | undefined 

/** Returns the last element in the given collection matching the given predicate */
declare function findLast<T>(collection: Array<T>, predicate: Predicate<T>): T | undefined 

/** Returns the only element in the given collection matching the given predicate. Returns undefined if there is none. */
declare function single<T>(collection: Array<T>, predicate: Predicate<T>): T | undefined 

/** Returns the first value in the given collection that produces a not-nullish value using the given selector */
declare function firstNotNullishOf<T, O>(collection: Array<T>, selector: Selector<T, O>): NonNullable<O> | undefined 

/** Applies the given selector to all elements in the given collection and calculates the sum of the results */
declare function sumOf<T>(collection: Array<T>, selector: Selector<T, number>): number

/**
 * Applies the given selector to all elements in the given collection and returns the element that produced the maximum result.
 *
 * Returns undefined if the collection is empty.
 */
declare function maxBy<T>(collection: Array<T>, selector: Selector<T, number | string>): T | undefined

/**
 * Applies the given selector to all elements in the given collection and returns the element that produced the minimum result.
 *
 * Returns undefined if the collection is empty.
 */
declare function minBy<T>(collection: Array<T>, selector: Selector<T, number | string>): T | undefined

/**
 * Returns the maximum element in the given collection when sorted using the given comparator.
 *
 * Returns undefined if the collection is empty.
 */
declare function maxWith<T>(collection: Array<T>, comparator: (a: T, b: T) => number): T | undefined

/**
 * Returns the minimum element in the given collection when sorted using the given comparator.
 *
 * Returns undefined if the collection is empty.
 */
declare function minWith<T>(collection: Array<T>, comparator: (a: T, b: T) => number): T | undefined

/**
 * Applies the given selector to all elements in the given collection and returns the maximum result.
 *
 * Returns undefined if the collection is empty.
 */
declare function maxOf<T, O extends number | string>(collection: Array<T>, selector: Selector<T, O>): O | undefined

/**
 * Applies the given selector to all elements in the given collection and returns the minimum result.
 *
 * Returns undefined if the collection is empty.
 */
declare function minOf<T, O extends number | string>(collection: Array<T>, selector: Selector<T, O>): O | undefined

/*
 * Number array transformations
 */

/** Returns the mean average of all elements in the given collection */
declare function average(collection: Array<number>): number | undefined

/*
 * Transformations to other formats
 */

/** Builds 2-tuples of elements from the given collection with matching indices, stopping when the smaller collection's end is reached */
declare function zip<T, U>(collection: Array<T>, withCollection: Array<U>): Array<[ T, U ]>

/**
 * Builds two separate collections from the given collection of 2-tuples, with the first returned collection holding all first
 * tuple elements and the second one holding all the second elements
 */
declare function unzip<T, U>(pairs: Array<[ T, U ]>): [ Array<T>, Array<U> ]

/**
 * Applies the given selector to each element in the given array, returning a Record containing the results as keys
 * and the last value that produced that key as values.
 */
declare function associateBy<T>(collection: Array<T>, selector: Selector<T, string>): Record<string, T>

/**
 * Applies the given selector to each element in the given array, returning a Record containing the results as keys
 * and all values that produced that key as values.
 */
declare function groupBy<T>(collection: Array<T>, selector: Selector<T, string>): Grouping<T>

/**
 * Returns a tuple of two collections with the first one containing all elements in the given collection that match the given predicate
 * and the second one containing all that do not
 */
declare function partition<T>(collection: Array<T>, predicate: Predicate<T>): [ Array<T>, Array<T> ]

/** Splits the given collection into chunks of the given size and returns them */
declare function chunked<T>(collection: Array<T>, size: number): Array<Array<T>>

/**
 * Builds all possible combinations and orders of elements in the given collection and the given size.
 *
 * If size is not given, it is assumed to be the length of the given collection.
 */
declare function permutations<T>(collection: Array<T>, size?: number): Array<Array<T>>

/**
 * Generates sliding views of the given collection of the given size and returns a new collection contianing all of them.
 *
 * If step is set, each window will start that many elements after the last window's start.
 * If partial is set, windows will be generated for the last elements of the collection,
 * resulting in some undefined values if size is greather than 1.
 */
declare function windowed<T>(collection: Array<T>, size: number, config?: { step?: number, partial?: boolean }): Array<Array<T>>

/*
 * RECORDS
 */

/*
 * Predicates
 */

/** Checks if the given collection includes the given value */
declare function includesValue<T>(collection: Record<string, T>, value: T): boolean

/** Checks if the given collection includes the given key */
declare function includesKey<T>(collection: Record<string, T>, value: string): boolean

/*
 * Transformations to Records
 */

/** Returns a new collection with all entries of the given collection except the ones that do not match the given predicate */
declare function filterEntries<T>(collection: Record<string, T>, predicate: Predicate<[string, T]>): Record<string, T>

/** Returns a new collection with all entries of the given collection except the ones that have a key that does not match the given predicate */
declare function filterKeys<T>(collection: Record<string, T>, predicate: Predicate<string>): Record<string, T>

/** Returns a new collection with all entries of the given collection except the ones that have a value that does not match the given predicate */
declare function filterValues<T>(collection: Record<string, T>, predicate: Predicate<T>): Record<string, T>

/** Returns a new collection with all entries of the given collection except the ones that have a nullish value */
declare function filterValuesNotNullish<T>(collection: Record<string, T>): Record<string, NonNullable<T>>

/** Applies the given transformer to all entries in the given collection and returns a new collection containing the results */
declare function mapEntries<T, O>(collection: Record<string, T>, transformer: Selector<[string, T], [string, O]>): Record<string, O>

/** Merges the two given Records, recursively merging any nested Records with the second collection overriding the first in case of conflict */
declare function deepMerge<T extends Record<keyof any, unknown>>(collection: Partial<T>, other: Partial<T>): T
declare function deepMerge<T extends Record<keyof any, unknown>, U extends Record<keyof unknown, unknown>>(collection: T, other: U): T & U

/**
 * Applies the given transformer to all keys in the given collection's entries and returns a new collection containing the
 * transformed entries.
 *
 * If the transformed entries contain the same key multiple times, only the last one will appear in the returned collection.
 */
declare function mapKeys<T>(collection: Record<string, T>, transformer: Selector<string, string>): Record<string, T>

/**
 * Applies the given transformer to all valuesin the given collection and returns a new collection containing the resulting keys
 * associated to the last value that produced them.
 */
declare function mapValues<T, O>(collection: Record<string, T>, transformer: Selector<T, O>): Record<string, O>

/**
 * Groups
 */

/** Returns the number of elements together with their group key from the given Grouping */
declare function countGroups(collection: Grouping<unknown>): Record<string, number>

/** Applies the given reducer to each group in the given Grouping, returning the results together with the respective group keys */
declare function reduceGroups<T, A>(collection: Grouping<T>, reducer: (accumulator: A, current: T) => A, initialValue: A): Record<string, A>

/** Applies the given aggregator to each group in the given Grouping, returning the results together with the respective group keys */
declare function aggregateGroups<T, A>(collection: Grouping<T>, aggregator: (accumulator: A, current: T, key: string, first: boolean) => A, initalValue: A): Record<string, A>

