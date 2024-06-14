// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Utilities for working with Deno's {@linkcode Reader | readers} and {@linkcode Writer | writers}.
 *
 * This package provides basic utilities for `Reader` and `Writer` interfaces
 * mainly for the backward compatibility. `Reader` and `Writer` are not
 * recommended anymore for performing I/O operations in Deno. Instead,
 * you should consider using
 * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API}.
 *
 * @module
 */

export * from "./buffer.ts";
export * from "./copy.ts";
export * from "./iterate_reader.ts";
export * from "./read_all.ts";
export * from "./reader_from_stream_reader.ts";
export * from "./to_readable_stream.ts";
export * from "./to_writable_stream.ts";
export * from "./types.ts";
export * from "./write_all.ts";
