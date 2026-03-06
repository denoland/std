// Copyright 2018-2026 the Deno authors. MIT license.

// @ts-self-types="./unstable_errors.d.ts"

import { isDeno } from "./_utils.ts";

// please keep sorted
export const AlreadyExists = isDeno
  ? Deno.errors.AlreadyExists
  : class AlreadyExists extends Error {};
export const BadResource = isDeno
  ? Deno.errors.BadResource
  : class BadResource extends Error {};
export const BrokenPipe = isDeno
  ? Deno.errors.BrokenPipe
  : class BrokenPipe extends Error {};
export const Busy = isDeno ? Deno.errors.Busy : class Busy extends Error {};
export const Interrupted = isDeno
  ? Deno.errors.Interrupted
  : class Interrupted extends Error {};
export const InvalidData = isDeno
  ? Deno.errors.InvalidData
  : class InvalidData extends Error {};
export const NotFound = isDeno
  ? Deno.errors.NotFound
  : class NotFound extends Error {};
export const PermissionDenied = isDeno
  ? Deno.errors.PermissionDenied
  : class PermissionDenied extends Error {};
export const TimedOut = isDeno
  ? Deno.errors.TimedOut
  : class TimedOut extends Error {};
export const UnexpectedEof = isDeno
  ? Deno.errors.UnexpectedEof
  : class UnexpectedEof extends Error {};
export const WriteZero = isDeno
  ? Deno.errors.WriteZero
  : class WriteZero extends Error {};
