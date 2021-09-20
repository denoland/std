import { Middleware } from "../middleware.ts";

export const log: Middleware<Request> = async (req, con, next) => {
  const start = performance.now();
  const response = await next!(req, con);
  const end = performance.now();

  console.log(
    `${req.method} ${new URL(req.url).pathname}\t${response.status}\t${end -
      start}ms`,
  );

  return response;
};
