// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Contains the {@linkcode STATUS_CODES} object which contains standard HTTP
 * status codes and provides several type guards for handling status codes
 * with type safety.
 *
 * @example
 * ```ts
 * import {
 *   STATUS_CODES,
 *   STATUS_TEXT,
 * } from "https://deno.land/std@$STD_VERSION/http/status.ts";
 *
 * console.log(STATUS_CODES.NotFound); // Returns 404
 * console.log(STATUS_TEXT[STATUS_CODES.NotFound]); // Returns "Not Found"
 * ```
 *
 * @example
 * ```ts
 * import { isErrorStatus } from "https://deno.land/std@$STD_VERSION/http/status.ts";
 *
 * const res = await fetch("https://example.com/");
 *
 * if (isErrorStatus(res.status)) {
 *   // error handling here...
 * }
 * ```
 *
 * @module
 */

/**
 * @deprecated (will be removed in 0.207.0) Use {@linkcode STATUS_CODES} instead.
 *
 * Standard HTTP status codes.
 */
export enum Status {
  /** RFC 7231, 6.2.1 */
  Continue = 100,
  /** RFC 7231, 6.2.2 */
  SwitchingProtocols = 101,
  /** RFC 2518, 10.1 */
  Processing = 102,
  /** RFC 8297 **/
  EarlyHints = 103,

  /** RFC 7231, 6.3.1 */
  OK = 200,
  /** RFC 7231, 6.3.2 */
  Created = 201,
  /** RFC 7231, 6.3.3 */
  Accepted = 202,
  /** RFC 7231, 6.3.4 */
  NonAuthoritativeInfo = 203,
  /** RFC 7231, 6.3.5 */
  NoContent = 204,
  /** RFC 7231, 6.3.6 */
  ResetContent = 205,
  /** RFC 7233, 4.1 */
  PartialContent = 206,
  /** RFC 4918, 11.1 */
  MultiStatus = 207,
  /** RFC 5842, 7.1 */
  AlreadyReported = 208,
  /** RFC 3229, 10.4.1 */
  IMUsed = 226,

  /** RFC 7231, 6.4.1 */
  MultipleChoices = 300,
  /** RFC 7231, 6.4.2 */
  MovedPermanently = 301,
  /** RFC 7231, 6.4.3 */
  Found = 302,
  /** RFC 7231, 6.4.4 */
  SeeOther = 303,
  /** RFC 7232, 4.1 */
  NotModified = 304,
  /** RFC 7231, 6.4.5 */
  UseProxy = 305,
  /** RFC 7231, 6.4.7 */
  TemporaryRedirect = 307,
  /** RFC 7538, 3 */
  PermanentRedirect = 308,

  /** RFC 7231, 6.5.1 */
  BadRequest = 400,
  /** RFC 7235, 3.1 */
  Unauthorized = 401,
  /** RFC 7231, 6.5.2 */
  PaymentRequired = 402,
  /** RFC 7231, 6.5.3 */
  Forbidden = 403,
  /** RFC 7231, 6.5.4 */
  NotFound = 404,
  /** RFC 7231, 6.5.5 */
  MethodNotAllowed = 405,
  /** RFC 7231, 6.5.6 */
  NotAcceptable = 406,
  /** RFC 7235, 3.2 */
  ProxyAuthRequired = 407,
  /** RFC 7231, 6.5.7 */
  RequestTimeout = 408,
  /** RFC 7231, 6.5.8 */
  Conflict = 409,
  /** RFC 7231, 6.5.9 */
  Gone = 410,
  /** RFC 7231, 6.5.10 */
  LengthRequired = 411,
  /** RFC 7232, 4.2 */
  PreconditionFailed = 412,
  /** RFC 7231, 6.5.11 */
  RequestEntityTooLarge = 413,
  /** RFC 7231, 6.5.12 */
  RequestURITooLong = 414,
  /** RFC 7231, 6.5.13 */
  UnsupportedMediaType = 415,
  /** RFC 7233, 4.4 */
  RequestedRangeNotSatisfiable = 416,
  /** RFC 7231, 6.5.14 */
  ExpectationFailed = 417,
  /** RFC 7168, 2.3.3 */
  Teapot = 418,
  /** RFC 7540, 9.1.2 */
  MisdirectedRequest = 421,
  /** RFC 4918, 11.2 */
  UnprocessableEntity = 422,
  /** RFC 4918, 11.3 */
  Locked = 423,
  /** RFC 4918, 11.4 */
  FailedDependency = 424,
  /** RFC 8470, 5.2 */
  TooEarly = 425,
  /** RFC 7231, 6.5.15 */
  UpgradeRequired = 426,
  /** RFC 6585, 3 */
  PreconditionRequired = 428,
  /** RFC 6585, 4 */
  TooManyRequests = 429,
  /** RFC 6585, 5 */
  RequestHeaderFieldsTooLarge = 431,
  /** RFC 7725, 3 */
  UnavailableForLegalReasons = 451,

  /** RFC 7231, 6.6.1 */
  InternalServerError = 500,
  /** RFC 7231, 6.6.2 */
  NotImplemented = 501,
  /** RFC 7231, 6.6.3 */
  BadGateway = 502,
  /** RFC 7231, 6.6.4 */
  ServiceUnavailable = 503,
  /** RFC 7231, 6.6.5 */
  GatewayTimeout = 504,
  /** RFC 7231, 6.6.6 */
  HTTPVersionNotSupported = 505,
  /** RFC 2295, 8.1 */
  VariantAlsoNegotiates = 506,
  /** RFC 4918, 11.5 */
  InsufficientStorage = 507,
  /** RFC 5842, 7.2 */
  LoopDetected = 508,
  /** RFC 2774, 7 */
  NotExtended = 510,
  /** RFC 6585, 6 */
  NetworkAuthenticationRequired = 511,
}

export const STATUS_CODES = {
  /** RFC 7231, 6.2.1 */
  Continue: 100,
  /** RFC 7231, 6.2.2 */
  SwitchingProtocols: 101,
  /** RFC 2518, 10.1 */
  Processing: 102,
  /** RFC 8297 **/
  EarlyHints: 103,

  /** RFC 7231, 6.3.1 */
  OK: 200,
  /** RFC 7231, 6.3.2 */
  Created: 201,
  /** RFC 7231, 6.3.3 */
  Accepted: 202,
  /** RFC 7231, 6.3.4 */
  NonAuthoritativeInfo: 203,
  /** RFC 7231, 6.3.5 */
  NoContent: 204,
  /** RFC 7231, 6.3.6 */
  ResetContent: 205,
  /** RFC 7233, 4.1 */
  PartialContent: 206,
  /** RFC 4918, 11.1 */
  MultiStatus: 207,
  /** RFC 5842, 7.1 */
  AlreadyReported: 208,
  /** RFC 3229, 10.4.1 */
  IMUsed: 226,

  /** RFC 7231, 6.4.1 */
  MultipleChoices: 300,
  /** RFC 7231, 6.4.2 */
  MovedPermanently: 301,
  /** RFC 7231, 6.4.3 */
  Found: 302,
  /** RFC 7231, 6.4.4 */
  SeeOther: 303,
  /** RFC 7232, 4.1 */
  NotModified: 304,
  /** RFC 7231, 6.4.5 */
  UseProxy: 305,
  /** RFC 7231, 6.4.7 */
  TemporaryRedirect: 307,
  /** RFC 7538, 3 */
  PermanentRedirect: 308,

  /** RFC 7231, 6.5.1 */
  BadRequest: 400,
  /** RFC 7235, 3.1 */
  Unauthorized: 401,
  /** RFC 7231, 6.5.2 */
  PaymentRequired: 402,
  /** RFC 7231, 6.5.3 */
  Forbidden: 403,
  /** RFC 7231, 6.5.4 */
  NotFound: 404,
  /** RFC 7231, 6.5.5 */
  MethodNotAllowed: 405,
  /** RFC 7231, 6.5.6 */
  NotAcceptable: 406,
  /** RFC 7235, 3.2 */
  ProxyAuthRequired: 407,
  /** RFC 7231, 6.5.7 */
  RequestTimeout: 408,
  /** RFC 7231, 6.5.8 */
  Conflict: 409,
  /** RFC 7231, 6.5.9 */
  Gone: 410,
  /** RFC 7231, 6.5.10 */
  LengthRequired: 411,
  /** RFC 7232, 4.2 */
  PreconditionFailed: 412,
  /** RFC 7231, 6.5.11 */
  ContentTooLarge: 413,
  /** RFC 7231, 6.5.12 */
  URITooLong: 414,
  /** RFC 7231, 6.5.13 */
  UnsupportedMediaType: 415,
  /** RFC 7233, 4.4 */
  RangeNotSatisfiable: 416,
  /** RFC 7231, 6.5.14 */
  ExpectationFailed: 417,
  /** RFC 7168, 2.3.3 */
  Teapot: 418,
  /** RFC 7540, 9.1.2 */
  MisdirectedRequest: 421,
  /** RFC 4918, 11.2 */
  UnprocessableEntity: 422,
  /** RFC 4918, 11.3 */
  Locked: 423,
  /** RFC 4918, 11.4 */
  FailedDependency: 424,
  /** RFC 8470, 5.2 */
  TooEarly: 425,
  /** RFC 7231, 6.5.15 */
  UpgradeRequired: 426,
  /** RFC 6585, 3 */
  PreconditionRequired: 428,
  /** RFC 6585, 4 */
  TooManyRequests: 429,
  /** RFC 6585, 5 */
  RequestHeaderFieldsTooLarge: 431,
  /** RFC 7725, 3 */
  UnavailableForLegalReasons: 451,

  /** RFC 7231, 6.6.1 */
  InternalServerError: 500,
  /** RFC 7231, 6.6.2 */
  NotImplemented: 501,
  /** RFC 7231, 6.6.3 */
  BadGateway: 502,
  /** RFC 7231, 6.6.4 */
  ServiceUnavailable: 503,
  /** RFC 7231, 6.6.5 */
  GatewayTimeout: 504,
  /** RFC 7231, 6.6.6 */
  HTTPVersionNotSupported: 505,
  /** RFC 2295, 8.1 */
  VariantAlsoNegotiates: 506,
  /** RFC 4918, 11.5 */
  InsufficientStorage: 507,
  /** RFC 5842, 7.2 */
  LoopDetected: 508,
  /** RFC 2774, 7 */
  NotExtended: 510,
  /** RFC 6585, 6 */
  NetworkAuthenticationRequired: 511,
} as const;

export type StatusCode = typeof STATUS_CODES[keyof typeof STATUS_CODES];

/** A record of all the status codes text. */
export const STATUS_TEXT = {
  [STATUS_CODES.Accepted]: "Accepted",
  [STATUS_CODES.AlreadyReported]: "Already Reported",
  [STATUS_CODES.BadGateway]: "Bad Gateway",
  [STATUS_CODES.BadRequest]: "Bad Request",
  [STATUS_CODES.Conflict]: "Conflict",
  [STATUS_CODES.Continue]: "Continue",
  [STATUS_CODES.Created]: "Created",
  [STATUS_CODES.EarlyHints]: "Early Hints",
  [STATUS_CODES.ExpectationFailed]: "Expectation Failed",
  [STATUS_CODES.FailedDependency]: "Failed Dependency",
  [STATUS_CODES.Forbidden]: "Forbidden",
  [STATUS_CODES.Found]: "Found",
  [STATUS_CODES.GatewayTimeout]: "Gateway Timeout",
  [STATUS_CODES.Gone]: "Gone",
  [STATUS_CODES.HTTPVersionNotSupported]: "HTTP Version Not Supported",
  [STATUS_CODES.IMUsed]: "IM Used",
  [STATUS_CODES.InsufficientStorage]: "Insufficient Storage",
  [STATUS_CODES.InternalServerError]: "Internal Server Error",
  [STATUS_CODES.LengthRequired]: "Length Required",
  [STATUS_CODES.Locked]: "Locked",
  [STATUS_CODES.LoopDetected]: "Loop Detected",
  [STATUS_CODES.MethodNotAllowed]: "Method Not Allowed",
  [STATUS_CODES.MisdirectedRequest]: "Misdirected Request",
  [STATUS_CODES.MovedPermanently]: "Moved Permanently",
  [STATUS_CODES.MultiStatus]: "Multi Status",
  [STATUS_CODES.MultipleChoices]: "Multiple Choices",
  [STATUS_CODES.NetworkAuthenticationRequired]:
    "Network Authentication Required",
  [STATUS_CODES.NoContent]: "No Content",
  [STATUS_CODES.NonAuthoritativeInfo]: "Non Authoritative Info",
  [STATUS_CODES.NotAcceptable]: "Not Acceptable",
  [STATUS_CODES.NotExtended]: "Not Extended",
  [STATUS_CODES.NotFound]: "Not Found",
  [STATUS_CODES.NotImplemented]: "Not Implemented",
  [STATUS_CODES.NotModified]: "Not Modified",
  [STATUS_CODES.OK]: "OK",
  [STATUS_CODES.PartialContent]: "Partial Content",
  [STATUS_CODES.PaymentRequired]: "Payment Required",
  [STATUS_CODES.PermanentRedirect]: "Permanent Redirect",
  [STATUS_CODES.PreconditionFailed]: "Precondition Failed",
  [STATUS_CODES.PreconditionRequired]: "Precondition Required",
  [STATUS_CODES.Processing]: "Processing",
  [STATUS_CODES.ProxyAuthRequired]: "Proxy Auth Required",
  [STATUS_CODES.ContentTooLarge]: "Content Too Large",
  [STATUS_CODES.RequestHeaderFieldsTooLarge]: "Request Header Fields Too Large",
  [STATUS_CODES.RequestTimeout]: "Request Timeout",
  [STATUS_CODES.URITooLong]: "URI Too Long",
  [STATUS_CODES.RangeNotSatisfiable]: "Range Not Satisfiable",
  [STATUS_CODES.ResetContent]: "Reset Content",
  [STATUS_CODES.SeeOther]: "See Other",
  [STATUS_CODES.ServiceUnavailable]: "Service Unavailable",
  [STATUS_CODES.SwitchingProtocols]: "Switching Protocols",
  [STATUS_CODES.Teapot]: "I'm a teapot",
  [STATUS_CODES.TemporaryRedirect]: "Temporary Redirect",
  [STATUS_CODES.TooEarly]: "Too Early",
  [STATUS_CODES.TooManyRequests]: "Too Many Requests",
  [STATUS_CODES.Unauthorized]: "Unauthorized",
  [STATUS_CODES.UnavailableForLegalReasons]: "Unavailable For Legal Reasons",
  [STATUS_CODES.UnprocessableEntity]: "Unprocessable Entity",
  [STATUS_CODES.UnsupportedMediaType]: "Unsupported Media Type",
  [STATUS_CODES.UpgradeRequired]: "Upgrade Required",
  [STATUS_CODES.UseProxy]: "Use Proxy",
  [STATUS_CODES.VariantAlsoNegotiates]: "Variant Also Negotiates",
} as const;

export type StatusText = typeof STATUS_TEXT[keyof typeof STATUS_TEXT];

/** An HTTP status that is a informational (1XX). */
export type InformationalStatus =
  | typeof STATUS_CODES.Continue
  | typeof STATUS_CODES.SwitchingProtocols
  | typeof STATUS_CODES.Processing
  | typeof STATUS_CODES.EarlyHints;

/** An HTTP status that is a success (2XX). */
export type SuccessfulStatus =
  | typeof STATUS_CODES.OK
  | typeof STATUS_CODES.Created
  | typeof STATUS_CODES.Accepted
  | typeof STATUS_CODES.NonAuthoritativeInfo
  | typeof STATUS_CODES.NoContent
  | typeof STATUS_CODES.ResetContent
  | typeof STATUS_CODES.PartialContent
  | typeof STATUS_CODES.MultiStatus
  | typeof STATUS_CODES.AlreadyReported
  | typeof STATUS_CODES.IMUsed;

/** An HTTP status that is a redirect (3XX). */
export type RedirectStatus =
  | typeof STATUS_CODES.MultipleChoices // 300
  | typeof STATUS_CODES.MovedPermanently // 301
  | typeof STATUS_CODES.Found // 302
  | typeof STATUS_CODES.SeeOther // 303
  | typeof STATUS_CODES.UseProxy // 305 - DEPRECATED
  | typeof STATUS_CODES.TemporaryRedirect // 307
  | typeof STATUS_CODES.PermanentRedirect; // 308

/** An HTTP status that is a client error (4XX). */
export type ClientErrorStatus =
  | typeof STATUS_CODES.BadRequest
  | typeof STATUS_CODES.Unauthorized
  | typeof STATUS_CODES.PaymentRequired
  | typeof STATUS_CODES.Forbidden
  | typeof STATUS_CODES.NotFound
  | typeof STATUS_CODES.MethodNotAllowed
  | typeof STATUS_CODES.NotAcceptable
  | typeof STATUS_CODES.ProxyAuthRequired
  | typeof STATUS_CODES.RequestTimeout
  | typeof STATUS_CODES.Conflict
  | typeof STATUS_CODES.Gone
  | typeof STATUS_CODES.LengthRequired
  | typeof STATUS_CODES.PreconditionFailed
  | typeof STATUS_CODES.ContentTooLarge
  | typeof STATUS_CODES.URITooLong
  | typeof STATUS_CODES.UnsupportedMediaType
  | typeof STATUS_CODES.RangeNotSatisfiable
  | typeof STATUS_CODES.ExpectationFailed
  | typeof STATUS_CODES.Teapot
  | typeof STATUS_CODES.MisdirectedRequest
  | typeof STATUS_CODES.UnprocessableEntity
  | typeof STATUS_CODES.Locked
  | typeof STATUS_CODES.FailedDependency
  | typeof STATUS_CODES.UpgradeRequired
  | typeof STATUS_CODES.PreconditionRequired
  | typeof STATUS_CODES.TooManyRequests
  | typeof STATUS_CODES.RequestHeaderFieldsTooLarge
  | typeof STATUS_CODES.UnavailableForLegalReasons;

/** An HTTP status that is a server error (5XX). */
export type ServerErrorStatus =
  | typeof STATUS_CODES.InternalServerError
  | typeof STATUS_CODES.NotImplemented
  | typeof STATUS_CODES.BadGateway
  | typeof STATUS_CODES.ServiceUnavailable
  | typeof STATUS_CODES.GatewayTimeout
  | typeof STATUS_CODES.HTTPVersionNotSupported
  | typeof STATUS_CODES.VariantAlsoNegotiates
  | typeof STATUS_CODES.InsufficientStorage
  | typeof STATUS_CODES.LoopDetected
  | typeof STATUS_CODES.NotExtended
  | typeof STATUS_CODES.NetworkAuthenticationRequired;

/** An HTTP status that is an error (4XX and 5XX). */
export type ErrorStatus = ClientErrorStatus | ServerErrorStatus;

export function isStatus(status: number): status is StatusCode {
  return Object.values(STATUS_CODES).includes(status as StatusCode);
}

/** A type guard that determines if the status code is informational. */
export function isInformationalStatus(
  status: number,
): status is InformationalStatus {
  return isStatus(status) && status >= 100 && status < 200;
}

/** A type guard that determines if the status code is successful. */
export function isSuccessfulStatus(
  status: number,
): status is SuccessfulStatus {
  return isStatus(status) && status >= 200 && status < 300;
}

/** A type guard that determines if the status code is a redirection. */
export function isRedirectStatus(status: number): status is RedirectStatus {
  return isStatus(status) && status >= 300 && status < 400;
}

/** A type guard that determines if the status code is a client error. */
export function isClientErrorStatus(
  status: number,
): status is ClientErrorStatus {
  return isStatus(status) && status >= 400 && status < 500;
}

/** A type guard that determines if the status code is a server error. */
export function isServerErrorStatus(
  status: number,
): status is ServerErrorStatus {
  return isStatus(status) && status >= 500 && status < 600;
}

/** A type guard that determines if the status code is an error. */
export function isErrorStatus(status: number): status is ErrorStatus {
  return isStatus(status) && status >= 400 && status < 600;
}
