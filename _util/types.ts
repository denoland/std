// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

export type Expand<T> = T extends Record<PropertyKey, unknown>
  ? T extends infer O
    ? { [K in keyof O]: O[K] }
    : never
  : T;

export type SafeOmit<From, Omits> = Omit<From, CommonKeysWithSameType<Omits, From>>

export type CommonKeys<A, B> = keyof A & keyof B

export type CommonKeysWithSameType<T, U> = {
    [K in CommonKeys<T, U>]: T[K] extends U[K] ? K : never
}[CommonKeys<T, U>]

