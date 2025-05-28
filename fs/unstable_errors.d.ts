// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Raised when trying to create a resource, like a file, that already
 * exits.
 */
export class AlreadyExists extends Error {}
/**
 * The underlying IO resource is invalid or closed, and so the operation
 * could not be performed.
 */
export class BadResource extends Error {}
/**
 * Raised when trying to write to a resource and a broken pipe error occurs.
 * This can happen when trying to write directly to `stdout` or `stderr`
 * and the operating system is unable to pipe the output for a reason
 * external to the Deno runtime.
 */
export class BrokenPipe extends Error {}
/**
 * Raised when the underlying IO resource is not available because it is
 * being awaited on in another block of code.
 */
export class Busy extends Error {}
/**
 * Raised when an operation to returns data that is invalid for the
 * operation being performed.
 */
export class InvalidData extends Error {}
/**
 * Raised when the underlying operating system reports an `EINTR` error. In
 * many cases, this underlying IO error will be handled internally within
 * Deno, or result in an {@linkcode BadResource} error instead.
 */
export class Interrupted extends Error {}
/**
 * Raised when the underlying operating system indicates that the file
 * was not found.
 */
export class NotFound extends Error {}
/**
 * Raised when the underlying operating system indicates the current user
 * which the Deno process is running under does not have the appropriate
 * permissions to a file or resource.
 */
export class PermissionDenied extends Error {}
/**
 * Raised when the underlying operating system reports that an I/O operation
 * has timed out (`ETIMEDOUT`).
 */
export class TimedOut extends Error {}
/**
 * Raised when attempting to read bytes from a resource, but the EOF was
 * unexpectedly encountered.
 */
export class UnexpectedEof extends Error {}
/**
 * Raised when expecting to write to a IO buffer resulted in zero bytes
 * being written.
 */
export class WriteZero extends Error {}
