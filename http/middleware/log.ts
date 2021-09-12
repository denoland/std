import { Middleware } from "../middleware.ts";

export const log: Middleware<Request> = async (req, con, next) => {
  const start = performance.now();
  const response = await next!(req, con);
  const end = performance.now();

  console.log(
    `${req.method} ${new URL(req.url).pathname}\t\t${response.status}\t\t${end -
      start}ms`,
  );

  return response;
};
