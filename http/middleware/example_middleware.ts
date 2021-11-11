// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { EmptyContext, Handler, Middleware, Status } from "../mod.ts";
import { parse } from "../../encoding/yaml.ts";

export const log: Middleware = async (req, next) => {
  const start = performance.now();
  const res = await next(req);
  const duration = performance.now() - start;

  console.log(
    `${req.method} ${req.url} - ${res.status}, ${duration.toFixed(1)}ms`,
  );

  return res;
};

export const yaml: Middleware<EmptyContext, { data: unknown }> = async (
  req,
  next,
) => {
  const rawBody = await req.text();
  const data = parse(rawBody);
  const newReq = req.addContext({ data });

  return await next(newReq);
};

export const validate: Middleware<{ data: unknown }, { data: string[] }> = (
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

export const handleGreetings: Handler<{ data: string[] }> = (req) => {
  const { data } = req.context;

  return new Response(
    data
      .map((it) => `Hello ${it}!`)
      .join("\n"),
  );
};
