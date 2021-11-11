import {
  chain,
  EmptyContext,
  Handler,
  Middleware,
  serve,
  Status,
} from "../mod.ts";
import { parse } from "../../encoding/yaml.ts";

const log: Middleware = async (req, next) => {
  const start = performance.now();
  const res = await next(req);
  const duration = performance.now() - start;

  console.log(
    `${req.method} ${req.url} - ${res.status}, ${duration.toFixed(1)}ms`,
  );

  return res;
};

const yaml: Middleware<EmptyContext, { data: unknown }> = async (
  req,
  next,
) => {
  const rawBody = await req.text();
  const data = parse(rawBody);
  const newReq = req.addContext({ data });

  return await next(newReq);
};

const validate: Middleware<{ data: unknown }, { data: string[] }> = (
  req,
  next,
) => {
  const { data } = req.context;

  if (Array.isArray(data) && data.every((it) => typeof it === "string")) {
    return next(req.addContext({ data }));
  }

  return new Response(
    "Invalid input, expected an array of string",
    { status: Status.UnprocessableEntity },
  );
};

const handle: Handler<{ data: string[] }> = (req) => {
  const { data } = req.context;

  return new Response(
    data
      .map((it) => `Hello ${it}!`)
      .join("\n"),
  );
};

const handler = chain(log)
  .add(yaml)
  .add(validate)
  .add(handle);

await serve(handler);
