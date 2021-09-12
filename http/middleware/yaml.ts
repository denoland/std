import { Middleware } from "../middleware.ts";
import { parse } from "../../encoding/yaml.ts";
import { YAMLError } from "../../encoding/_yaml/error.ts";

export const acceptYaml: Middleware<Request, { parsedBody: unknown }> = async (
  req,
  con,
  next,
) => {
  const body = await req.text();

  let parsedBody: unknown;

  try {
    parsedBody = parse(body);
  } catch (e) {
    if (e instanceof YAMLError) {
      return new Response(
        e.toString(false),
        { status: 422, statusText: "Request could not be parsed" },
      );
    }

    throw e;
  }

  const nextReq = {
    ...req,
    parsedBody,
  };

  return next!(nextReq, con);
};
