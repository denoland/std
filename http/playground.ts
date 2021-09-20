import { addMiddleware, Middleware, stack } from "./middleware.ts";
import { Handler } from "./mod.ts";

type AuthedRequest = Request & { auth: string };

const passThrough: Middleware<Request> = (req, con, next) => next!(req, con);

const authenticate: Middleware<Request, { auth: string }> = async (
  req,
  con,
  next,
) => {
  const auth = req.headers.get("authorization");

  if (auth === null) {
    return new Response(null, { status: 401 });
  }

  return await next!({ ...req, auth }, con);
};

const authorize: Middleware<AuthedRequest> = async (req, con, next) => {
  const { auth } = req;

  if (auth !== "asdf") {
    return new Response(null, { status: 401 });
  }

  return await next!(req, con);
};

const handle: Middleware<AuthedRequest> = async (req: AuthedRequest) => {
  return new Response(`Hi ${req.auth}`, { status: 200 });
};

const test = stack(passThrough)
  .add(authenticate)
  .add(authorize)
  .add(handle)
  .handler;

const http: Handler = test;
