import { Middleware } from "../middleware.ts";

export type Routes = {
  [pattern: string]: {
    [method: string]: Middleware<Request>;
  };
};

export function route(routes: Routes): Middleware<Request> {
  const patternMap = new Map(
    Object
      .entries(routes)
      .map((
        [pattern, methods],
      ) => [new URLPattern({ pathname: pattern }), methods]),
  );

  const patterns = [...patternMap.keys()];

  return async (req, con) => {
    const matchedPattern = patterns.find((it) => it.exec(req.url));

    if (matchedPattern === undefined) {
      return new Response(`${path} did not match any routes`, { status: 404 });
    }

    const handler = patternMap.get(matchedPattern)![req.method];

    if (handler === undefined) {
      const supportedMethods = Object
        .keys(patternMap.get(matchedPattern)!)
        .map((it) => it.toUpperCase())
        .join(", ");

      return new Response(
        `Method ${req.method} is not allowed for this route. Supported methods are: ${supportedMethods}`,
        {
          status: 404,
          headers: {
            "Allow": supportedMethods,
          },
        },
      );
    }

    return await handler(req, con);
  };
}
