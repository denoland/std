import { Middleware } from "../middleware.ts";

export const log: Middleware = async (req, next) => {
  const start = performance.now();
  const response = await next!(req);
  const end = performance.now();

  console.log(
    `${req.method} ${new URL(req.url).pathname}\t${response.status}\t${end -
      start}ms`,
  );

  return response;
};
