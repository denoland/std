import { Middleware } from "../middleware.ts";

export const acceptJson: Middleware<{}, { parsedBody: unknown }> = async (
  req,
  next,
) => {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return new Response(
      "Content Type not supported, expected application/json",
      { status: 415 },
    );
  }

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

  const nextReq = req.addContext({ parsedBody });

  return next!(nextReq);
};
