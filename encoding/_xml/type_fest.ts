// Ported from type-fest v2.17.0:
// https://github.com/sindresorhus/type-fest/commit/1baf95dcc46bd6e621d5eeb17bc1705de83edd92
// Copyright 2019-2022 by Sindre Sorhus. All rights reserved. MIT license.

type Merge_<FirstType, SecondType> = Except<
  FirstType,
  Extract<keyof FirstType, keyof SecondType>
> &
  SecondType;

export interface SimplifyOptions {
  /**
	Do the simplification recursively.
	@default false
	*/
  deep?: boolean;
}

// Flatten a type without worrying about the result.
type Flatten<
  AnyType,
  Options extends SimplifyOptions = {}
> = Options["deep"] extends true
  ? { [KeyType in keyof AnyType]: Simplify<AnyType[KeyType], Options> }
  : { [KeyType in keyof AnyType]: AnyType[KeyType] };

export type Simplify<
  AnyType,
  Options extends SimplifyOptions = {}
> = Flatten<AnyType> extends AnyType ? Flatten<AnyType, Options> : AnyType;

export type Merge<FirstType, SecondType> = Simplify<
  Merge_<FirstType, SecondType>
>;

export type IsEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends <
  G
>() => G extends U ? 1 : 2
  ? true
  : false;

type Filter<KeyType, ExcludeType> = IsEqual<KeyType, ExcludeType> extends true
  ? never
  : KeyType extends ExcludeType
  ? never
  : KeyType;

export type Except<ObjectType, KeysType extends keyof ObjectType> = {
  [KeyType in keyof ObjectType as Filter<
    KeyType,
    KeysType
  >]: ObjectType[KeyType];
};
