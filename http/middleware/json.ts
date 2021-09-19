import { Middleware } from "../middleware.ts";

export const acceptJson: Middleware<Request, { parsedBody: unknown }> = async (
  req,
  con,
  next,
) => {
  const body = await req.text();

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(body);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return new Response(
        `Request could not be parsed as JSON: ${e.message}`,
        { status: 422 },
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
