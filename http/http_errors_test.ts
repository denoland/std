// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals, assertInstanceOf } from "../testing/asserts.ts";

import { type ErrorStatus, Status, STATUS_TEXT } from "./http_status.ts";

import {
  createHttpError,
  errors,
  type ErrorStatusKeys,
  HttpError,
} from "./http_errors.ts";

const clientErrorStatus: ErrorStatus[] = [
  Status.BadRequest,
  Status.Unauthorized,
  Status.PaymentRequired,
  Status.Forbidden,
  Status.NotFound,
  Status.MethodNotAllowed,
  Status.NotAcceptable,
  Status.ProxyAuthRequired,
  Status.RequestTimeout,
  Status.Conflict,
  Status.Gone,
  Status.LengthRequired,
  Status.PreconditionFailed,
  Status.RequestEntityTooLarge,
  Status.RequestURITooLong,
  Status.UnsupportedMediaType,
  Status.RequestedRangeNotSatisfiable,
  Status.ExpectationFailed,
  Status.Teapot,
  Status.MisdirectedRequest,
  Status.UnprocessableEntity,
  Status.Locked,
  Status.FailedDependency,
  Status.UpgradeRequired,
  Status.PreconditionRequired,
  Status.TooManyRequests,
  Status.RequestHeaderFieldsTooLarge,
  Status.UnavailableForLegalReasons,
];

const serverErrorStatus: ErrorStatus[] = [
  Status.InternalServerError,
  Status.NotImplemented,
  Status.BadGateway,
  Status.ServiceUnavailable,
  Status.GatewayTimeout,
  Status.HTTPVersionNotSupported,
  Status.VariantAlsoNegotiates,
  Status.InsufficientStorage,
  Status.LoopDetected,
  Status.NotExtended,
  Status.NetworkAuthenticationRequired,
];

Deno.test({
  name: "http_error - validate client errors",
  fn() {
    for (const errorStatus of clientErrorStatus) {
      const error = createHttpError(errorStatus);
      const errorExpose = createHttpError(
        errorStatus,
        STATUS_TEXT[errorStatus],
        {
          expose: false,
          headers: new Headers({ "WWW-Authenticate": "Bearer" }),
        },
      );
      assertInstanceOf(error, HttpError);
      assertInstanceOf(error, errors[Status[errorStatus] as ErrorStatusKeys]);
      assertEquals(error.name, `${Status[errorStatus]}Error`);
      assertEquals(error.message, STATUS_TEXT[errorStatus]);
      assertEquals(errorExpose.status, errorStatus);
      assertEquals(errorExpose.headers?.get("WWW-Authenticate"), "Bearer");
      assert(error.expose);
      assert(!errorExpose.expose);
    }
  },
});

Deno.test({
  name: "http_error - validate server errors",
  fn() {
    for (const errorStatus of serverErrorStatus) {
      const error = createHttpError(errorStatus);
      const errorExpose = createHttpError(
        errorStatus,
        STATUS_TEXT[errorStatus],
        {
          expose: true,
        },
      );
      assertInstanceOf(error, HttpError);
      assertInstanceOf(error, errors[Status[errorStatus] as ErrorStatusKeys]);
      assertEquals(error.name, `${Status[errorStatus]}Error`);
      assertEquals(error.message, STATUS_TEXT[errorStatus]);
      assertEquals(error.status, errorStatus);
      assert(!error.expose);
      assert(errorExpose.expose);
      assert(!error.headers);
    }
  },
});
