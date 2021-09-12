import { assertEquals } from "../testing/asserts.ts";
import { HttpRequest, Middleware, stack } from "./middleware.ts";

type AuthedRequest = HttpRequest & { auth: string };

const passThrough: Middleware<HttpRequest> = async (req, next) => next!(req);

const authenticate: Middleware<HttpRequest, { auth: string }> = async (
  req,
  next,
) => {
  const auth = req.path;
  const response = await next!({
    ...req,
    auth,
  });

  return response;
};

const authorize = async <R extends AuthedRequest>(
  req: R,
  next?: Middleware<R>,
) => {
  const isAuthorized = req.auth === "admin";

  if (!isAuthorized) {
    return { body: "nope" };
  }

  return next!(req);
};

const rainbow: Middleware<HttpRequest, { rainbow: boolean }> = async (
  req,
  next,
) => next!({ ...req, rainbow: true });

const handleGet: Middleware<AuthedRequest> = async (req) => ({ body: "yey" });

const combinedHandler = stack(passThrough)
  .add(authenticate)
  .add(authorize)
  .add(rainbow)
  .add(handleGet)
  .handler;

assertEquals(await combinedHandler({ path: "someuser" }), { body: "nope" });
assertEquals(await combinedHandler({ path: "admin" }), { body: "yey" });
