// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Utilities for working with {@linkcode Deno.Kv} stores.
 *
 * ## Working with JSON
 *
 * {@linkcode Deno.Kv} stores are able to store values that are serializable
 * using the structured clone algorithm. The challenge is that supports a lot
 * of types that are not serializable using JSON. To work around this, you can
 * use the the utilities to convert values which can be safely serialized to
 * JSON as well as deserialize them back. This makes it possible to fully
 * represent entries and values in a browser, or communicate them between Deno
 * processes.
 *
 * The JSON utilities are:
 *
 * - {@linkcode entryMaybeToJSON} - Convert a {@linkcode Deno.KvEntryMaybe} to
 *   JSON.
 * - {@linkcode entryToJSON} - Convert a {@linkcode Deno.KvEntry} to JSON.
 * - {@linkcode keyToJSON} - Convert a {@linkcode Deno.KvKey} to JSON.
 * - {@linkcode keyPartToJSON} - Convert a {@linkcode Deno.KvKeyPart} to JSON.
 * - {@linkcode valueToJSON} - Convert a value which can be stored in Deno KV to
 *   JSON.
 * - {@linkcode toEntry} - Convert a JSON object to a {@linkcode Deno.KvEntry}.
 * - {@linkcode toEntryMaybe} - Convert a JSON object to a
 *   {@linkcode Deno.KvEntryMaybe}.
 * - {@linkcode toKey} - Convert a JSON object to a {@linkcode Deno.KvKey}.
 * - {@linkcode toKeyPart} - Convert a JSON object to a
 *   {@linkcode Deno.KvKeyPart}.
 * - {@linkcode toValue} - Convert a JSON object to a value which can be stored
 *   in Deno KV.
 *
 * ### Examples
 *
 * Taking a maybe entry from Deno.Kv and converting it to JSON and sending it
 * as a response:
 *
 * ```ts ignore
 * import { entryMaybeToJSON } from "@std/kv";
 *
 * const db = await Deno.openKv();
 *
 * Deno.serve(async (_req) => {
 *   const maybeEntry = await db.get(["a"]);
 *   const json = entryMaybeToJSON(maybeEntry);
 *   return Response.json(json);
 * });
 * ```
 *
 * Taking a value that was serialized to JSON in a browser and storing it in
 * Deno KV:
 *
 * ```ts ignore
 * import { toValue } from "@std/kv";
 *
 * const db = await Deno.openKv();
 *
 * Deno.serve(async (req) => {
 *   const json = await req.json();
 *   const value = toValue(json);
 *   await db.set(["a"], value);
 *   return new Response(null, { status: 204 });
 * });
 * ```
 *
 * ## Estimating the size of a value
 *
 * When working with Deno KV and there is a need to have transactions be
 * infallible, it is helpful to be able to estimate the size of a value before
 * storing it. This is because there are limits on the size of values that can
 * be stored in Deno KV, as well as the size of atomic operations.
 *
 * Deno KV stores values by using the V8 serialization format, which converts
 * objects to a binary format and then that value is stored in the KV store.
 *
 * The {@linkcode sizeOf} function can be used to estimate the size of a value
 * in bytes. While it is not 100% accurate, it is 10x faster than using the V8
 * serialize function, which is not available in some environments.
 *
 * ### Example
 *
 * ```ts
 * import { sizeOf } from "@std/kv";
 * import { assertEquals } from "@std/assert";
 *
 * const value = { a: new Map([[{ a: 1 }, { b: /234/ }]]), b: false };
 * assertEquals(sizeOf(value), 36);
 * ```
 *
 * @module
 */

export * from "./json.ts";
export * from "./size_of.ts";
